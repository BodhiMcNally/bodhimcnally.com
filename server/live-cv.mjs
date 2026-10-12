import { createHash } from 'node:crypto';
import { liveCv } from '../config/live-cv.mjs';

const noCache = { 'Cache-Control': 'no-store', 'Vercel-CDN-Cache-Control': 'no-store' };

function allowedDownloadHost(url) {
  return url.protocol === 'https:' && (
    ['drive.google.com', 'drive.usercontent.google.com', 'docs.google.com'].includes(url.hostname)
    || url.hostname.endsWith('.googleusercontent.com')
  );
}

async function downloadPdf(fetcher) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    let url = new URL('https://drive.google.com/uc');
    url.searchParams.set('export', 'download');
    url.searchParams.set('id', liveCv.fileId);
    let response;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      response = await fetcher(url, {
        redirect: 'manual', cache: 'no-store', signal: controller.signal,
      });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location) throw new Error('Drive returned a redirect without a destination.');
      url = new URL(location, url);
      if (!allowedDownloadHost(url)) throw new Error('Unexpected Drive download destination.');
    }
    if (!response?.ok || !response.body) throw new Error(`Drive download failed (${response?.status ?? 'no response'}).`);
    if (Number(response.headers.get('content-length') ?? 0) > liveCv.maxBytes) {
      await response.body.cancel();
      throw new Error('The CV exceeds the 4 MiB limit.');
    }
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > liveCv.maxBytes) {
        await reader.cancel();
        throw new Error('The CV exceeds the 4 MiB limit.');
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks, size);
    if (bytes.subarray(0, 5).toString() !== '%PDF-') {
      throw new Error('Drive returned a sharing or download page instead of a PDF.');
    }
    return bytes;
  } finally {
    clearTimeout(timer);
  }
}

export async function serveLiveCv(request, { fetcher = fetch, logger = console } = {}) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response('Method not allowed', { status: 405, headers: { ...noCache, Allow: 'GET, HEAD' } });
  }
  const download = new URL(request.url).searchParams.get('download') === '1';
  try {
    const bytes = await downloadPdf(fetcher);
    const etag = `"${createHash('sha256').update(bytes).digest('hex')}"`;
    const headers = {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${liveCv.filename}"`,
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Vercel-CDN-Cache-Control': `public, max-age=${liveCv.cacheSeconds}`,
      'X-Content-Type-Options': 'nosniff',
      ETag: etag,
    };
    if (request.headers.get('if-none-match')?.split(',').some((tag) => tag.trim().replace(/^W\//, '') === etag)) {
      return new Response(null, { status: 304, headers });
    }
    return new Response(request.method === 'HEAD' ? null : bytes, {
      status: 200, headers: { ...headers, 'Content-Length': String(bytes.byteLength) },
    });
  } catch (error) {
    logger.error('Live CV fetch failed:', error instanceof Error ? error.message : 'Unknown error');
    // A download still opens the source CV if Drive temporarily blocks fetching.
    if (download) return new Response(null, {
      status: 307, headers: { ...noCache, Location: liveCv.driveHref },
    });
    return Response.json({ error: 'The latest CV could not be loaded. Please view it on Google Drive.' }, {
      status: 502, headers: noCache,
    });
  }
}
