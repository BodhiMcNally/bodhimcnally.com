import { liveCv } from '../config/live-cv.mjs';

const origin = process.argv[2] ?? 'https://bodhimcnally.com';
const response = await fetch(new URL(liveCv.endpoint, origin), { signal: AbortSignal.timeout(35000) });
if (!response.ok) throw new Error(`Live CV endpoint returned HTTP ${response.status}.`);
const bytes = Buffer.from(await response.arrayBuffer());
if (!response.headers.get('content-type')?.includes('application/pdf') || bytes.subarray(0, 5).toString() !== '%PDF-') {
  throw new Error('The live CV endpoint did not return a PDF.');
}
for (const filename of ['pdf.min.mjs', 'pdf.worker.min.mjs']) {
  const result = await fetch(new URL(`${liveCv.pdfjsBase}${filename}`, origin), { method: 'HEAD' });
  if (!result.ok || !/(?:javascript|ecmascript)/i.test(result.headers.get('content-type') ?? '')) {
    throw new Error(`${filename} is missing or has the wrong content type (HTTP ${result.status}). Run the fix installer, commit package.json and scripts/prepare-live-cv.mjs, then redeploy.`);
  }
}
console.log(`The live PDF (${bytes.length.toLocaleString()} bytes) and both browser renderer files are available.`);
