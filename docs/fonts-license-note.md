# Font licensing note

## JetBrains Mono

- **License:** SIL Open Font License 1.1 (OFL-1.1)
- **Copyright:** © 2020 The JetBrains Mono Project Authors
- **Upstream project:** https://github.com/JetBrains/JetBrainsMono
- **Vendored via:** Google Fonts `css2` API (same binaries Google serves, downloaded once and
  committed to this repo instead of being fetched from `fonts.googleapis.com` /
  `fonts.gstatic.com` at request time).
- **Source css2 URL:** `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap`
  (this is the exact URL that was previously `@import`-ed from `src/assets/theme.css`)
- **Fetch date:** 2026-07-19
- **Subset vendored:** Latin only (`unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC,
  U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193,
  U+2212, U+2215, U+FEFF, U+FFFD`) — matches the `latin` block Google's css2 response returns for
  this family; the other subsets (latin-ext, greek, cyrillic, cyrillic-ext, vietnamese) were not
  loaded by the app before this change and are not vendored now.
- **Weights vendored:** 300, 400, 500, 600, 700 — all `font-style: normal` (no italic was
  requested by the original `@import`, so none is vendored).
- **Files:** `public/fonts/jetbrains-mono-{300,400,500,600,700}.woff2`

Note: JetBrains Mono is distributed by Google Fonts as a variable font. The css2 response above
returns the *same* underlying latin woff2 binary for all five requested weights — Google emits one
`@font-face` block per weight (differing only in the `font-weight` descriptor) that all point at
that one file, and the browser renders the correct weight from the variable font's `wght` axis.
The five files vendored here are therefore byte-identical (same SHA-256); this mirrors Google's own
`@font-face` structure exactly (one declaration per weight) rather than introducing a single
shared file, keeping a 1:1 mapping between weight and file for future maintenance.

The OFL-1.1 permits this kind of redistribution (bundling/embedding in software) provided the
license text accompanies the font and the font name isn't used to imply endorsement. The upstream
license text can be found alongside the project's source at the URL above
(`OFL.txt` in the JetBrains/JetBrainsMono repository).
