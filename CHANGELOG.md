# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Offline PWA — a service worker precaches the app shell so every tool keeps working with no network connection at all; an "Install" prompt appears once the browser's `beforeinstallprompt` criteria are met, and an "Offline" pill shows when connectivity drops
- `/privacy` proof page — walks through exactly what DevYantra does (and doesn't do) with your data, with devtools steps so you can verify it yourself
- Command palette: fuzzy matching (dependency-free subsequence scorer) instead of plain substring filtering, plus a "Recent" section (last 5 tools, localStorage-backed) shown ahead of the full list when the query is empty
- Per-tool session persistence — all 8 tools now restore their last input after a reload (7 via a new `useToolState` composable; Text Compare already had this via `useShareState`)
- Standard Copy / Clear actions (`ToolActions`) shared across Format Text, Hash Generator, Base64 Tools, JWT Decoder, Character Count, and Delimiter Tool, with Clear always undoable via a toast

### Changed

- Text Compare: the diff engine was rewritten from an HTML-string-reparse renderer (`v-html` over regenerated diff2html markup) to a structured, typed diff model (`DiffRow[]`) rendered directly — no HTML re-parsing
- Text Compare: diff computation now runs in a Web Worker with cancel (available once a compute passes 300ms) and live elapsed-time progress, plus a 10-second compute cap so pathologically large/dissimilar inputs fail fast with a clear message instead of hanging indefinitely
- Text Compare: rendering is virtualized, with published input limits enforced up front — 5 MB per side — instead of an unbounded input that could hang or crash the tab
- Text Compare: EOL, BOM, and trailing-newline mismatches now surface as explicit indicator pills (e.g. "Line endings differ: left CRLF, right LF") instead of rendering as a phantom "everything changed" diff
- Text Compare: word/character-level highlighting is grapheme-cluster-safe (`Intl.Segmenter`) — emoji ZWJ sequences (e.g. family emoji) and combining-mark characters are treated as one unit and are no longer split mid-character
- Text Compare: Copy and Export always rebuild from the original (unfolded) text at the currently displayed context setting, and use the real uploaded filenames in both the patch headers and the downloaded filename, instead of a fixed context and generic "original"/"modified" placeholders
- Text Compare: split-view diff navigation (Prev/Next) now reaches change blocks that are pure insertions (nothing on the left/original side) — navigation is computed from the diff model instead of scanning the rendered left-side DOM, which had nothing to find for insertion-only blocks
- Dependencies: removes `diff2html` (and its transitive `hogan.js`) from the shipped app — `jsdiff` is now the only diff dependency; a dependency-hygiene cleanup rather than a bundle-size reduction (diff2html was already unused, so this is 0 KB change to `dist/`, but 6 fewer packages in `node_modules` and 69 fewer lines in `package-lock.json`)
- Tool registry (`src/tools/registry.ts`) is now the single source of truth the router, tab bar, command palette, footer, sitemap, and prerender list all derive from — adding a new tool is one registry entry plus one component instead of touching every call site individually
- Fonts (JetBrains Mono) are self-hosted instead of loaded from Google Fonts — removes that third-party request on every page load
- The feedback form was replaced with static links to GitHub Issues/Discussions — removes the Formspree submission, the app's last third-party request

### Fixed

- Text Compare: "Ignore Whitespace" and "Ignore Case" toggles now actually affect the diff (they were wired to nothing)
- Text Compare: opening a share link no longer overwrites your autosaved work, and the URL hash is cleaned after restore
- Text Compare: Share reports success and failure (including the 8,000-character URL cap) instead of doing nothing silently
- Text Compare: Copy/Export are disabled when no differences are shown (previously exported a stale patch) and always contain the original, unmodified text
- Text Compare: exports/copies now confirm via toast everywhere; clipboard failures are reported
- Text Compare: keyboard shortcuts fire on real keyboards (event.code matching); destructive clear shortcuts removed (⌘⇧R was browser hard-reload), Swap is ⌘⇧X, Sample is ⌘⇧U; all Clear actions are undoable for 10 seconds
- Text Compare: Alt+Arrow diff navigation no longer hijacks word-navigation while typing
- Text Compare: one-sided comparisons allowed (empty vs content = everything added/removed)
- Text Compare: extensionless files (Makefile), dotfiles, and UTF-16 text files upload correctly; empty files give feedback
- Code Formatter: truncated JSON shows the real parse error instead of silently echoing the input
- Timestamp Converter: epoch `0` converts correctly
- Base64: decode errors clear the previous output instead of showing both
- Removed deprecated router `next()` callback (console warnings on every navigation)

### Removed

- Dead code: unshipped `DiffView.vue` and its test suite, Vue starter scaffolding (`TheWelcome`, `WelcomeItem`, icon set)
- References to never-existing assets (`twitter-image.png`, `logo.png`) and stale pre-rebrand blue theme colors

### Security

- Content-Security-Policy header restricts the deployed app to same-origin requests (`default-src 'self'`, `frame-ancestors 'none'`, `form-action 'none'`) — see the `/privacy` page for how to verify this yourself in your browser's devtools

## [1.0.0] - 2025-01-16

### Added

- **Text Compare** — Side-by-side and unified diff views with word/character granularity, syntax highlighting, file upload, and export
- **Code Formatter** — Beautify and minify JSON, SQL, XML, CSS, and JavaScript with auto-detection (powered by js-beautify and sql-formatter)
- **Hash Generator** — MD5, SHA-1, SHA-256, SHA-384, SHA-512 via the Web Crypto API
- **Base64 Tools** — Encode and decode with standard and URL-safe variants
- **JWT Decoder** — Decode tokens, inspect header/payload/signature, check expiration
- **Timestamp Converter** — Unix timestamp and date conversion with live clock and relative time
- **Character Counter** — Characters, words, lines, paragraphs, sentences, reading time, and social media limits
- **Delimiter Tool** — Split and join text with configurable delimiters
- **Command palette** (Cmd+K / Ctrl+K) for quick tool switching
- **Dark / light theme** with system preference detection and localStorage persistence
- **URL state sharing** with LZ-string compression for Text Compare
- **Keyboard shortcuts** across all tools
- **Responsive design** for desktop, tablet, and mobile
- **SEO** — Structured data (JSON-LD), meta tags, sitemap, and Open Graph tags for every tool
- **CI/CD** — GitHub Actions for lint, type-check, unit tests, build, and E2E tests
- **E2E testing** — Playwright across Chromium, Firefox, WebKit, and mobile viewports
- **Vercel deployment** with security headers and SPA routing
