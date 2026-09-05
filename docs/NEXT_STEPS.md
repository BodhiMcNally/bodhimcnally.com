# Next-step checklist

## Publish the repository

- [ ] Create an empty GitHub repository named `bodhimcnally.com`.
- [ ] Initialise Git in this folder, commit the source and push `main`.
- [ ] Replace `YOUR_GITHUB_USERNAME` in the README command before adding the remote.
- [ ] Add the verified GitHub profile URL to `src/data/site.ts` once known.

## Deploy

- [ ] Import the repository into Vercel.
- [ ] Confirm `npm run build` and `dist` if Vercel does not detect them automatically.
- [ ] Deploy with no environment variables.
- [ ] Open every top-level page on the Vercel preview before assigning the production domain.

## Connect the domain

- [ ] Purchase or transfer `bodhimcnally.com` at the registrar of your choice.
- [ ] Add `bodhimcnally.com` and `www.bodhimcnally.com` in Vercel.
- [ ] Enter the exact DNS records Vercel currently supplies.
- [ ] Set `bodhimcnally.com` as primary and confirm `www` redirects to it.
- [ ] Confirm HTTPS, the sitemap and `robots.txt` after DNS propagation.

## Complete profile assets

- [ ] Add `public/cv/Bodhi_McNally_CV.pdf`.
- [ ] Set `site.cv.href` in `src/data/site.ts`.
- [ ] Replace `src/assets/images/Bodhi_McNally_Portrait.jpg` later only if a new approved headshot is preferred.
- [ ] Add a professional email only when you want it public.

## Publish the first real resource

- [ ] Copy the example Markdown file in `src/content/resources/`.
- [ ] Replace all example copy and metadata.
- [ ] Check ownership, copyright, confidentiality and assessment status.
- [ ] Keep `draft: true` while editing.
- [ ] Set `draft: false`, run `npm run verify`, then review the page on mobile and desktop.

## Add future research outputs

- [ ] Add the first verified project, publication or presentation in `src/data/research.ts`.
- [ ] Check the exact title, author order, status, year and DOI or program link.
- [ ] Ask before publicly naming collaborators or non-public projects.
- [ ] Run `npm run verify` before pushing the update.
