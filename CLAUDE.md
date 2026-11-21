# vjandasek.cz — personal photography site

Hugo static site for Vít Jandásek's photography (galleries + photo blog). Content is in **Czech**.
Live at https://vjandasek.cz (custom domain on GitHub Pages; `vjandasek.github.io` redirects there).

## Stack

- **Hugo** — CI pins `HUGO_VERSION` and `DART_SASS_VERSION` in `.github/workflows/hugo.yaml`. Keep the local versions the same as CI (local Hugo comes from `go install`; the Ubuntu apt package is far older).
- **Dart Sass** — required: Hugo 0.170 dropped LibSass and calls an external `sass` binary. Locally it lives in `~/.local/dart-sass` (on PATH via `~/.bashrc`). The npm `sass` and Ruby Sass don't work with Hugo.
- **Theme**: `themes/massively-mod/` — an in-repo, heavily modified fork of the Hugo port of HTML5 UP "Massively". Not a submodule; edit it directly.
  - Layouts use Hugo's 0.146+ template system: page templates sit at the top of `layouts/` (`home.html`, `single.html`, `single_photos.html`, `taxonomy.html`, `term.html`, `404.html`) plus `blog/section.html`; partials in `_partials/`, shortcodes in `_shortcodes/`. No `_default/` folder.
  - SCSS compiled by Hugo (`css.Sass`, Dart Sass) from `assets/scss/main.scss` and `noscript.scss`, in `layouts/_partials/htmlhead.html`. The build is warning-free; keep it that way.
  - Uses the Sass **module system** (`@use`/`@forward`, no Sass `@import`). Partials load helpers with `@use '../libs' as *;` (`libs/_index.scss` forwards all of libs/). A layout file that borrows a `color-*` mixin must `@use` the partial that defines it.
  - Helper functions are `palette()`, `size()`, `font()`, `duration()`, `misc()` — no leading underscore (that would make them module-private).
  - Breakpoints are the default `$breakpoints` in `libs/_breakpoints.scss`.
  - Site config reaches Sass via `css.Sass` `vars` → `@use "hugo:vars"` (e.g. `backgroundPath` in `hugotheme/main.scss`). Don't put Go template syntax in SCSS files.
  - Many theme files use CRLF line endings; keep each file's existing style.
  - Palette mixes that land on fractional colour channels are written out as literal hex in `libs/_vars.scss`, so Dart Sass output matches the old LibSass output.
  - JS: jQuery 3.7.1 + HTML5 UP helpers + lightbox2, concatenated in `layouts/_partials/scripts/index.html`.
  - Icons: a self-hosted 2 KB cut of Font Awesome Free 7 (`static/assets/fonts/fa-icons.woff2`, rules in `components/_icon.scss`) under the old FA4 class names and code points. To add an icon, edit and run `fonts-src/build-icon-font.sh` (in the theme); no FA kit or CDN.
- **Pagefind** for search — pinned in `package.json`/`package-lock.json` (its only dependency; run `npm ci` once to install). Runs in CI after the Hugo build (`npx pagefind --site public`). Search UI lives in `layouts/blog/section.html`; it won't work under plain `hugo server`.
- **GoatCounter** analytics in `layouts/_partials/htmlhead-custom.html`. Don't put extra dots in template names: Hugo ≥0.146 treats `name.variant.html` as a variant of `name.html`.
- Post-list teasers come from `layouts/_partials/posts/summary.html` (plain text, first 50 words to end of sentence), not `.Summary`, which since Hugo 0.134 drags in gallery HTML.
- Contact form posts to **Formspree** (`data/cs/contactinfo.yaml`).
- Deploy: push to `master` → GitHub Actions builds and deploys to Pages.

## Commands

```bash
hugo server                     # local dev at http://localhost:1313
hugo --gc --minify              # production build into public/
npm ci                          # install the locked Pagefind (once)
npx pagefind --site public --serve   # build search index + serve public/ to test search
```

No tests or linters; verify changes by building and looking at the pages.

## Layout of the repo

- `config/_default/config.toml` — main config; `config/production/config.toml` overrides `baseURL` (CI passes `--baseURL` anyway).
- `data/cs/*.yaml` — nav menu, intro text, social links, contact info.
- `i18n/cs.toml` — UI strings.
- `content/` — every page is a **page bundle** (`index.md` + images alongside or in `images/`).
  - Gallery sections (`transport`, `wildlife`, `landscape`, `cityscape`, `analog`) use `layout: "single_photos"`, which shows every photo in the bundle at its natural aspect ratio in justified rows (`_partials/image-gallery.html` + `assets/js/gallery-rows.js`, CSS-only greedy fallback without JS), each linked to the lightbox. Gallery photos have **no thumbnails**: just drop `foo.jpg` in the bundle.
  - Blog posts live in `content/blog/<slug>/index.md` with `image:` (cover), `tags:`, and images in `images/`.
  - Pages set `_build: publishResources: false` so only Hugo-processed images are published, never raw files.

## Image conventions

- Every **blog** photo `foo.jpg` needs a hand-made thumbnail `foo.thu.jpg` next to it (often a deliberate crop). Without it, `image-entry` warns and scales the full image instead (a safety net, not a substitute); a misspelt `src=` fails the build with a clear error. The gallery partial skips any `*.thu.*` file.
  - Gallery-section photos are shown whole (Fit 1400x800 q75 WebP), signature included. The square hand-made gallery thumbnails were deleted on 2026-11-21 (in git history before that date if an overview ever needs them).
- Full-size images are exported at roughly 1800–1920 px and re-processed by Hugo (`Fit 1920x1920 q75 webp`). Blog thumbnails and covers are WebP q75 too.
- Vít judges image quality by eye: any change to formats or quality needs a side-by-side visual comparison first, not just byte counts.
- Zoner Photo Studio leaves `*.data-zps` sidecar files — don't commit them.

Blog post gallery shortcodes:

```
{{< image-gal-start cols="2" columns="2fr 4fr" >}}   <!-- cols = column count, columns = CSS grid fractions -->
{{< image-entry src="images/50.jpg" title="Caption" res="2" >}}  <!-- res multiplies the 400px thumbnail size; gal = lightbox group -->
{{< image-gal-end >}}
```

Two-column text/image block: `{{< columns >}} left <---> right {{< /columns >}}`.

## Conventions

- Commit messages: `Area: short description`, e.g. `Blog: Italie 2023 (3)`, `Gallery: …`, `General: …`, `Deploy: …`, `Development: …`.
- Generated folders (`public/`, `resources/`, `node_modules/`) are git-ignored.
- `pubcrank.yml` describes editable content/fields for an external CMS editor.
