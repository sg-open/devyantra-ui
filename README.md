<!-- If you have a banner image, add it here: ![DevYantra Banner](docs/banner.png) -->

<div align="center">

# DevYantra

**Free, open-source developer tools that run entirely in your browser — no data ever leaves your device.**

[![License: MIT](https://img.shields.io/github/license/sg-open/devyantra-ui?style=flat-square)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/sg-open/devyantra-ui?style=flat-square)](https://github.com/sg-open/devyantra-ui/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sg-open/devyantra-ui?style=flat-square)](https://github.com/sg-open/devyantra-ui/network/members)
[![Last commit](https://img.shields.io/github/last-commit/sg-open/devyantra-ui?style=flat-square)](https://github.com/sg-open/devyantra-ui/commits/main)
[![CI](https://img.shields.io/github/actions/workflow/status/sg-open/devyantra-ui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/sg-open/devyantra-ui/actions/workflows/ci.yml)
[![Open issues](https://img.shields.io/github/issues/sg-open/devyantra-ui?style=flat-square)](https://github.com/sg-open/devyantra-ui/issues)
[![Node](https://img.shields.io/badge/node-%5E20.19%20%7C%7C%20%E2%89%A522.12-brightgreen?style=flat-square)](https://nodejs.org/)

<!-- Add a screenshot here: ![DevYantra Screenshot](docs/screenshot.png) -->
<!-- Show both light and dark mode if possible -->

[**Live App**](https://devyantra.app) · [**Report Bug**](https://github.com/sg-open/devyantra-ui/issues/new?template=bug_report.yml) · [**Request Feature**](https://github.com/sg-open/devyantra-ui/issues/new?template=feature_request.yml) · [**Discussions**](https://github.com/sg-open/devyantra-ui/discussions)

</div>

---

## About

DevYantra is a suite of everyday developer utilities — the kind you reach for dozens of times a week — packaged into a single, fast, privacy-respecting web app. Every computation happens in your browser. There is no backend, no API calls, and no telemetry. Your data stays on your machine.

The project exists because most online developer tools either plaster you with ads, silently ship your input to a server, or both. DevYantra takes a different approach: it's open source, self-hostable, and designed to earn your trust by having nothing to hide.

Built with Vue 3, TypeScript, and modern web APIs (Web Crypto, Compression Streams), DevYantra aims to be the developer toolbox that respects both your time and your data.

## Features

- [x] **Text Compare** — Side-by-side and unified diff views with word/character granularity, syntax highlighting, EOL/BOM/trailing-newline indicators instead of phantom "everything changed" diffs, diffing computed off the main thread in a Web Worker so large files (up to 5 MB per side) never freeze the UI, file upload, shareable URLs (LZ-string compression), and `.patch` exports/copies that honor the displayed context and the real uploaded filenames
- [x] **Code Formatter** — Beautify and minify JSON, SQL, XML, CSS, and JavaScript with automatic language detection
- [x] **Hash Generator** — MD5, SHA-1, SHA-256, SHA-384, SHA-512 via the Web Crypto API with one-click copy
- [x] **Base64 Tools** — Encode and decode with standard and URL-safe variants, real-time conversion
- [x] **JWT Decoder** — Decode tokens, inspect header/payload/signature, check expiration
- [x] **Timestamp Converter** — Convert between Unix timestamps and dates with live clock, relative time, seconds/milliseconds toggle
- [x] **Character Counter** — Characters, words, lines, paragraphs, sentences, reading time, and social media limits (Twitter, LinkedIn, Instagram, TikTok)
- [x] **Delimiter Tool** — Split and join text with any delimiter (comma, pipe, semicolon, tab, custom) with trim and empty-line removal

### Extras

- **Command palette** (<kbd>Cmd</kbd>+<kbd>K</kbd> / <kbd>Ctrl</kbd>+<kbd>K</kbd>) for instant tool switching
- **Dark / light theme** with system preference detection
- **Keyboard shortcuts** — ⌘K command palette; in Text Compare: ⌘⇧1/⌘⇧2 copy panes, ⌘⇧X swap, ⌘⇧U sample, Alt+↑/↓ jump between changes
- **Responsive design** for desktop, tablet, and mobile
- **Shareable URLs** with compressed state

## Tech Stack

| Technology | Purpose |
|---|---|
| [Vue 3](https://vuejs.org/) | UI framework (Composition API) |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Vite](https://vite.dev/) | Build tool and dev server |
| [TailwindCSS 4](https://tailwindcss.com/) | Utility-first styling |
| [PrimeVue 4](https://primevue.org/) | UI component library |
| [Pinia](https://pinia.vuejs.org/) | State management |
| [Vue Router](https://router.vuejs.org/) | Client-side routing with SEO metadata |
| [jsdiff](https://github.com/kpdecker/jsdiff) | Diff computation (Myers diff, run in a Web Worker) |
| [js-beautify](https://beautifier.io/) | JS, CSS, and HTML formatting |
| [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) | SQL formatting |
| [LZ-String](https://github.com/pieroxy/lz-string) | URL state compression |
| [Vitest](https://vitest.dev/) | Unit testing |
| [Playwright](https://playwright.dev/) | E2E testing (Chromium, Firefox, WebKit, mobile) |

## Getting Started

### Prerequisites

- **Node.js** `^20.19.0` or `>=22.12.0` — the repo includes an `.nvmrc`, so `nvm use` works
- **npm** (ships with Node)

### Install and Run

```bash
git clone https://github.com/sg-open/devyantra-ui.git
cd devyantra-ui
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). No environment variables required.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server on localhost:5173 |
| `npm run build` | Type-check + production build |
| `npm run type-check` | TypeScript checking (`vue-tsc --build`) |
| `npm run lint` | ESLint with auto-fix |
| `npm run format` | Prettier on `src/` |
| `npm run test:run` | Vitest unit tests (single run) |
| `npm run test:e2e` | Playwright E2E tests (all browsers) |

### Build for Production

```bash
npm run build
```

Output goes to `dist/` — serve it with any static file host.

## Project Structure

```
src/
├── components/        # Tool implementations (CompareText, FormatText, HashGenerator, etc.)
├── views/             # Page-level views
│   └── tools/         # Thin wrappers — import component + init SEO
├── composables/       # Shared logic (useShareState, useTextProcessor, useSEO, useDiffNavigation, useToast)
├── stores/            # Pinia stores (theme: dark/light mode)
├── directives/        # Custom Vue directives (v-tooltip)
├── config/            # SEO configuration per tool
├── router/            # Route definitions with meta
└── assets/            # Design tokens (theme.css — 8px grid, spacing scale, color tokens)

tests/
└── e2e/               # Playwright E2E tests

.github/
└── workflows/         # CI (lint + type-check + test + build) and E2E (3 browsers + mobile + a11y)
```

All tools are **child routes** of `HomeView.vue`, which renders a tab navigation bar and a `<router-view>`. The root `/` redirects to `/tools/text-compare`.

## Contributing

Contributions are welcome — whether it's a bug fix, a new tool, better docs, or improved accessibility.

1. Fork the repository
2. Create a branch (`git checkout -b feat/your-feature`)
3. Make your changes
4. Run quality gates: `npm run type-check && npm run lint && npm run test:run && npm run build`
5. Open a pull request

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for detailed guidelines, including a step-by-step guide for adding a new tool.

## Self-Hosting / Deployment

### Vercel (recommended)

The repo includes a `vercel.json` for zero-config deployment:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsg-open%2Fdevyantra-ui)

### Any Static Host

DevYantra builds to a static `dist/` folder. Deploy it anywhere — Netlify, Cloudflare Pages, GitHub Pages, S3 + CloudFront, or any web server.

```bash
npm run build
# Serve dist/ with your preferred static host
```

### Docker

No official image yet, but a static build + Nginx is straightforward:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

## Community & Support

- **Bug reports & feature requests** — [GitHub Issues](https://github.com/sg-open/devyantra-ui/issues)
- **Questions & discussions** — [GitHub Discussions](https://github.com/sg-open/devyantra-ui/discussions)
- **Security vulnerabilities** — see [SECURITY.md](SECURITY.md) for private disclosure instructions

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

DevYantra is built on excellent open-source projects:

- [Vue.js](https://vuejs.org/) and the Vue ecosystem (Vue Router, Pinia, Vite)
- [PrimeVue](https://primevue.org/) for UI components
- [TailwindCSS](https://tailwindcss.com/) for styling
- [jsdiff](https://github.com/kpdecker/jsdiff) for diff computation
- [js-beautify](https://beautifier.io/) and [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) for code formatting
- [LZ-String](https://github.com/pieroxy/lz-string) for compression
- [Playwright](https://playwright.dev/) and [Vitest](https://vitest.dev/) for testing

---

<div align="center">

Built with care for developers who value their privacy.

[devyantra.app](https://devyantra.app)

</div>
