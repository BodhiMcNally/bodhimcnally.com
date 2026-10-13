import { randomBytes, createHash, createHmac, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { editorConfig } from '../../config/editor.mjs';

const derive = promisify(scrypt);
const attempts = new Map();
const duration = editorConfig.sessionHours * 3600;

export async function hashPassword(password, salt = randomBytes(16).toString('base64url')) {
  const hash = await derive(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${salt}$${hash.toString('base64url')}`;
}
function same(a, b) {
  const left = Buffer.from(String(a)), right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}
export function expectedOrigin(request, env) {
  const url = new URL(request.url);
  if (env['CMS_ALLOW_LOCAL'] === '1' && ['localhost', '127.0.0.1'].includes(url.hostname)) return url.origin;
  return (env['CMS_ORIGIN'] ?? editorConfig.origin).replace(/\/$/, '');
}
export function checkOrigin(request, env) {
  return request.headers.get('origin') === expectedOrigin(request, env);
}
function cookieName(request, env) {
  return expectedOrigin(request, env).startsWith('https:') ? '__Host-site-editor' : 'site-editor-local';
}
function version(env) { return createHash('sha256').update(env['CMS_PASSWORD_HASH'] ?? '').digest('hex').slice(0, 20); }
export function issueSession(request, env) {
  if ((env['CMS_SESSION_SECRET'] ?? '').length < 32) throw new Error('CMS_SESSION_SECRET must contain at least 32 characters.');
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    user: env['CMS_USERNAME'] ?? editorConfig.username, iat: now, exp: now + duration,
    csrf: randomBytes(24).toString('base64url'), version: version(env), origin: expectedOrigin(request, env),
  };
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = createHmac('sha256', env['CMS_SESSION_SECRET']).update(body).digest('base64url');
  const secure = claims.origin.startsWith('https:') ? '; Secure' : '';
  return { claims, cookie: `${cookieName(request, env)}=${body}.${signature}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${duration}${secure}` };
}
export function readSession(request, env) {
  const secret = env['CMS_SESSION_SECRET'];
  if (!secret || secret.length < 32) return null;
  const cookie = (request.headers.get('cookie') ?? '').split(';').map(item => item.trim()).find(item => item.startsWith(`${cookieName(request, env)}=`));
  if (!cookie) return null;
  const token = cookie.slice(cookie.indexOf('=') + 1);
  if (token.length > 4096) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  if (!same(signature, createHmac('sha256', secret).update(body).digest('base64url'))) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (claims.user !== (env['CMS_USERNAME'] ?? editorConfig.username) || claims.version !== version(env) || claims.origin !== expectedOrigin(request, env)) return null;
    if (!Number.isInteger(claims.exp) || !Number.isInteger(claims.iat) || claims.exp <= now || claims.iat > now + 30 || claims.exp - claims.iat !== duration || typeof claims.csrf !== 'string') return null;
    return claims;
  } catch { return null; }
}
export function logoutCookie(request, env) {
  return `${cookieName(request, env)}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${expectedOrigin(request, env).startsWith('https:') ? '; Secure' : ''}`;
}
export function validCsrf(request, session) { return same(request.headers.get('x-editor-csrf') ?? '', session.csrf); }

export async function checkLogin(request, env, username, password) {
  const setting = env['CMS_PASSWORD_HASH'];
  if (!setting || !env['CMS_SESSION_SECRET']) return { status: 503, message: 'The editor needs its private login settings. Run the setup script and add the generated settings to Vercel.' };
  const key = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const now = Date.now();
  let state = attempts.get(key);
  if (!state || now > state.until) { state = { count: 0, until: now + 10 * 60 * 1000 }; attempts.set(key, state); }
  if (state.count >= 5) return { status: 429, message: 'Too many login attempts. Please wait ten minutes.' };
  if (attempts.size > 2000) for (const [ip, value] of attempts) if (now > value.until) attempts.delete(ip);
  state.count += 1;
  const [kind, salt, expected] = setting.split('$');
  if (kind !== 'scrypt' || !salt || !expected) return { status: 503, message: 'The private password hash is not configured correctly.' };
  const actual = await derive(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  if (!same(actual.toString('base64url'), expected) || !same(username, env['CMS_USERNAME'] ?? editorConfig.username)) {
    return { status: 401, message: 'The username or password is incorrect.' };
  }
  attempts.delete(key);
  return { status: 200 };
}
