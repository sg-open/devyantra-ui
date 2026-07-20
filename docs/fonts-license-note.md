# Font licensing note

## JetBrains Mono

- **License:** SIL Open Font License 1.1 (OFL-1.1)
- **Copyright:** © 2020 The JetBrains Mono Project Authors
- **Upstream project:** https://github.com/JetBrains/JetBrainsMono
- **Vendored via:** Google Fonts `css2` API (same binary Google serves, downloaded once and
  committed to this repo instead of being fetched from `fonts.googleapis.com` /
  `fonts.gstatic.com` at request time).
- **Source css2 URL:** `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap`
  (this is the exact URL that was previously `@import`-ed from `src/assets/theme.css`)
- **Upstream woff2 URL:** `https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbV2o-flEEny0FZhsfKu5WU4xD7OwGtT0rU.woff2`
- **Fetch date:** 2026-07-19
- **Subset vendored:** Latin only (`unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC,
  U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193,
  U+2212, U+2215, U+FEFF, U+FFFD`) — matches the `latin` block Google's css2 response returns for
  this family; the other subsets (latin-ext, greek, cyrillic, cyrillic-ext, vietnamese) were not
  loaded by the app before this change and are not vendored now.
- **Weights covered:** 300–700 variable range, `font-style: normal` (the original `@import`
  requested the static weights 300/400/500/600/700 and no italic).
- **File:** `public/fonts/jetbrains-mono.woff2` (single file, 40,480 bytes,
  SHA-256 `1e06740a02a443fb7f3eeda8fcaa685a0f6c620e3f01e6666e847295469ce3ad`)

Note: JetBrains Mono is distributed by Google Fonts as a **variable font**. The css2 response
above returns the *same* underlying latin woff2 binary for all five requested weights — Google
emits one `@font-face` block per weight that all point at that one file, and the browser renders
each weight from the variable font's `wght` axis. Rather than vendoring five byte-identical
copies, this repo keeps the single file and declares it once in `src/assets/theme.css` with
`font-weight: 300 700; src: url('/fonts/jetbrains-mono.woff2') format('woff2-variations')`.
The `format('woff2-variations')` identifier is verified working in Chromium via the e2e test in
`tests/e2e/platform.spec.ts` (probes both `13px` and `600 13px`); if it ever misbehaves in a
target browser, plain `format('woff2')` is an accepted equivalent in all modern browsers.

The OFL-1.1 permits this kind of redistribution (bundling/embedding in software) provided the
license text accompanies the font and the font name isn't used to imply endorsement. The upstream
license text can be found alongside the project's source at the URL above
(`OFL.txt` in the JetBrains/JetBrainsMono repository).
