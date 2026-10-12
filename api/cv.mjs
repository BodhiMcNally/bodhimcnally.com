import { serveLiveCv } from '../server/live-cv.mjs';

// Vercel deploys this as /api/cv alongside the static Astro website.
export default { fetch: serveLiveCv };
