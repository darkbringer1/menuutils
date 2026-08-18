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

1. In the private MenuKit repo: `make release-direct` builds, notarizes, staples,
   and produces `dist/direct/MenuUtils-<version>.dmg` plus a local appcast.
2. Create a GitHub Release on this repo (tag `v<version>`), upload the DMG as an
   asset. Copy the asset download URL.
3. Regenerate `appcast.xml` with the public enclosure URL and the EdDSA
   signature from Sparkle's `sign_update`, then commit and push. The feed is
   live immediately.
4. `SUFeedURL` in `App/Sources/Info-Direct.plist` points at
   `https://menuutils.dogukaan.dev/appcast.xml`. `SUPublicEDKey` must match the
   key used to sign every appcast.

A signed appcast whose key does not match `SUPublicEDKey` means updates silently
never install. A new DMG without a matching appcast update reaches nobody.

## Mac App Store

The App Store build is a reduced edition (no SMC sensors, no memory purge, no
crash auto-restart, no self-update). It updates through the App Store, not
Sparkle, so it does not touch this repo.