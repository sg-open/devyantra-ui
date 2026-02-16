# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

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
