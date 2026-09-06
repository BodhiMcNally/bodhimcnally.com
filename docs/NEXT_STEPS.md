# Next-step checklist

## Publish this revision

- [ ] Review the two email addresses, Google Drive CV link and conference list in `src/data/site.ts`.
- [ ] Open the CV and teaching portfolio links locally.
- [ ] Run `npm run verify`.
- [ ] Commit the revision with `git add -A` and `git commit -m "Simplify site content and add teaching resources"`.
- [ ] Push `main`; the connected Vercel project should deploy automatically.
- [ ] Review Home, About, Research, Teaching, Resources and Contact on the Vercel preview before promoting it to production.

## Maintain the documents

- [ ] Keep the Google Drive CV sharing setting at “Anyone with the link can view”.
- [ ] Update `site.cv.updated` whenever the CV changes.
- [ ] Replace `public/cv/Bodhi_McNally_Master_CV.pdf` if the downloadable copy changes.
- [ ] Replace `public/teaching/Bodhi_McNally_Teaching_Portfolio.pdf` when the portfolio changes.
- [ ] Consider producing public versions without a telephone number if the documents will remain linked from the website.

## Add a publication

- [ ] Add the verified record to `publications` in `src/data/research.ts`.
- [ ] Check the exact title, author order, journal, year, publication type, DOI and PubMed URL.
- [ ] Run `npm run verify`, then test search and each publication filter.

## Add a teaching resource

- [ ] Copy an existing Markdown file in `src/content/resources/` and give it a short filename.
- [ ] Replace all frontmatter and body content.
- [ ] Keep `draft: true` while editing.
- [ ] Check ownership, copyright, confidentiality and active-assessment status.
- [ ] Set `draft: false`, run `npm run verify`, then review the result on mobile and desktop.
- [ ] Test every R block using its **Run R** button.

## Keep the conference list current

- [ ] Add confirmed events to `site.appearances` in chronological order.
- [ ] Remove past events or move them to an archive only if an archive becomes useful.
