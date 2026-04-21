# notes

Static sites published to GitHub Pages at <https://0x00101010.github.io/notes/>.

## Sites

| Path | Source | URL |
|------|--------|-----|
| `200ms-blocks/` | Astro 5 + React | <https://0x00101010.github.io/notes/200ms-blocks/> |

## How deploys work

`.github/workflows/deploy.yml` runs on every push to `main` that touches `200ms-blocks/**` or the workflow file.

1. Build each Astro site with `npm ci && npm run build`
2. Stage outputs into `_site/<site-name>/`
3. Generate a tiny `_site/index.html` landing page that links to each site
4. Upload `_site/` as the GitHub Pages artifact and deploy

## One-time GitHub setup

After pushing the workflow for the first time:

1. Open the repo on GitHub → **Settings** → **Pages**
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**
3. Push to `main` (or run the workflow manually from the Actions tab)
4. Wait for the `deploy` job to finish; the URL appears in the job summary

That's the full setup. No `gh-pages` branch, no `peaceiris/actions-gh-pages` — just the official `actions/deploy-pages@v4` flow.

## Adding another site

1. Create a new top-level directory (e.g. `my-other-site/`)
2. Set its Astro `base` to `/notes/my-other-site/` in its `astro.config.mjs`
3. In `.github/workflows/deploy.yml`:
   - Add it to the `paths:` filter
   - Add a build step (or duplicate the existing one)
   - Add a `cp -r my-other-site/dist/. _site/my-other-site/` line
   - Add a `<a>` row to the inline landing-page HTML
4. Push to `main`

## Local development

```bash
cd 200ms-blocks
npm install
npm run dev      # http://localhost:4321/notes/200ms-blocks/
npm run build    # static dist/
npm run preview  # serve dist/ (also at /notes/200ms-blocks/)
```
