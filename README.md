# menuutils

Public website and release host for **MenuUtils**, a modular macOS menu-bar
utility. This repo powers:

- **GitHub Pages site** at <https://menuutils.dogukaan.dev> (landing, privacy,
  support) — served from the repo root.
- **GitHub Releases** — the notarized direct-download `.dmg` binaries.
- **Sparkle appcast** at <https://menuutils.dogukaan.dev/appcast.xml> —
  committed to the repo so the feed URL is stable. Its `<enclosure>` URLs
  point at the matching GitHub Release asset.

The MenuUtils **application source is private and not open-sourced.** This
repo contains only the marketing site and release artifacts.

## Custom domain

`CNAME` contains `menuutils.dogukaan.dev`. DNS must add:

```
menuutils  CNAME  darkbringer1.github.io.
```

GitHub Pages issues a Let's Encrypt certificate once the CNAME resolves. Enable
"Enforce HTTPS" in repo Settings → Pages after the domain verifies.

## Release workflow (direct distribution)

Releases are driven entirely from the **private** MenuKit repo. This public
repo is touched only by automation — push a tag `v<version>` there (or run its
`Release (direct)` workflow) and it:

1. Builds, notarizes, staples, and packages the DMG.
2. Creates a GitHub Release on **this** repo and uploads the DMG as an asset.
3. Regenerates `appcast.xml` with the public enclosure URL and the EdDSA
   signature, then commits and pushes `appcast.xml` here.

You should rarely edit this repo manually — only for site/feature updates.
Required secrets and the full step list live in
`.github/workflows/release-direct.yml` in the private MenuKit repo.

`SUFeedURL` in `App/Sources/Info-Direct.plist` points at
`https://menuutils.dogukaan.dev/appcast.xml`. `SUPublicEDKey` must match the
key used to sign every appcast. A mismatch means updates silently never install;
a new DMG without a matching appcast update reaches nobody.

## Mac App Store

The App Store build is a reduced edition (no SMC sensors, no memory purge, no
crash auto-restart, no self-update). It updates through the App Store, not
Sparkle, so it does not touch this repo.