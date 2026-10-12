// Run after the one-time deployment: node scripts/check-live-cv.mjs
import { liveCv } from '../config/live-cv.mjs';

const origin = process.argv[2] ?? 'https://bodhimcnally.com';
const response = await fetch(new URL(liveCv.endpoint, origin), { signal: AbortSignal.timeout(35000) });
if (!response.ok) throw new Error(`Live CV endpoint returned HTTP ${response.status}. Check that api/, server/ and config/ were committed.`);
const bytes = Buffer.from(await response.arrayBuffer());
if (!response.headers.get('content-type')?.includes('application/pdf') || bytes.subarray(0, 5).toString() !== '%PDF-') {
  throw new Error('The live CV endpoint did not return a PDF.');
}
const worker = await fetch(new URL(`${liveCv.pdfjsBase}pdf.worker.min.mjs`, origin), { method: 'HEAD' });
if (!worker.ok) throw new Error(`PDF worker returned HTTP ${worker.status}. Commit public/cv/runtime/ too.`);
console.log(`Live CV is available (${bytes.length.toLocaleString()} bytes). The PDF worker is available too.`);
