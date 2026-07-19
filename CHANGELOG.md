# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
