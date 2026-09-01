# menuutils

Public website and release host for **MenuUtils**, a modular macOS menu-bar
utility.

This repository contains only the static marketing site and release artifacts
— **not the application source**, which is private and not open-sourced.
Issues and pull requests are not accepted here; for support see
<https://menuutils.dogukaan.dev/support>.

## What this repo serves

- **The website** at <https://menuutils.dogukaan.dev> — landing page, privacy
  policy, and support page. Served from the repo root via GitHub Pages.
- **Release downloads** — each MenuUtils release is published here as a GitHub
  Release; the notarized `.dmg` is a release asset.
- **Release notes** at <https://menuutils.dogukaan.dev/releases> — generated
  from commits included since the previous version tag.
- **The update feed** at <https://menuutils.dogukaan.dev/appcast.xml> — the
  Sparkle appcast checked by the direct-download edition. Its enclosure URLs
  point at the matching GitHub Release asset.

## Automated publishing

The private application repository owns the release pipeline. Pushing a version
tag builds and notarizes the app, publishes the DMG and SHA-256 checksum, updates
the GitHub Release notes, and commits `appcast.xml`, `releases.json`,
`releases.html`, and the homepage's latest-release card here. That commit
triggers `.github/workflows/pages.yml` and deploys the complete release to the
custom domain.

## Custom domain

`CNAME` is set to `menuutils.dogukaan.dev`. Point the subdomain at GitHub Pages:

```
menuutils  CNAME  darkbringer1.github.io.
```

GitHub Pages issues a Let's Encrypt certificate once the record resolves; enable
"Enforce HTTPS" in Settings → Pages.

## Editions

MenuUtils ships in two editions from one codebase:

- **Direct download** (hosted here) — the full edition, notarized, with
  self-update via Sparkle.
- **Mac App Store** — the sandboxed edition; updates through the App Store.

See the website for the feature comparison.
