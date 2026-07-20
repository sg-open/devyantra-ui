# Contributing to DevYantra

First off, thank you for considering contributing to DevYantra! Every contribution matters -- whether it's fixing a typo, reporting a bug, suggesting a feature, or building an entirely new tool. This project thrives because of people like you.

DevYantra is a collection of browser-based developer tools where **all processing happens client-side**. No data ever leaves the user's browser. This privacy-first principle is non-negotiable and applies to every contribution.

---

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Adding a New Tool](#adding-a-new-tool)
- [Branch Naming](#branch-naming)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Code Style & Linting](#code-style--linting)
- [Testing Guidelines](#testing-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Code of Conduct](#code-of-conduct)

---

## Ways to Contribute

There is no contribution too small. Here are some ways you can help:

- **Report bugs** -- Found something broken? [Open an issue](#reporting-bugs).
- **Suggest features** -- Have an idea for a new tool or improvement? [Let us know](#requesting-features).
- **Fix bugs** -- Browse [open issues](https://github.com/sg-open/devyantra-ui/issues) labeled `bug`.
- **Build a new tool** -- This is the most common contribution. See the [detailed guide below](#adding-a-new-tool).
- **Improve documentation** -- Clarify instructions, fix typos, add examples.
- **Write tests** -- Increase coverage with unit or E2E tests.
- **Improve accessibility** -- Help make tools usable for everyone.
- **Optimize performance** -- Faster is always better.

If this is your first time contributing to open source, look for issues labeled [`good first issue`](https://github.com/sg-open/devyantra-ui/issues?q=label%3A%22good+first+issue%22). We are happy to help you through the process.

---

## Development Setup

### Prerequisites

| Tool | Version |
|------|---------|
| **Node.js** | `^20.19.0` or `>=22.12.0` (see `.nvmrc` for the pinned version) |
| **npm** | Bundled with Node.js |
| **Git** | Any recent version |

### Getting Started

1. **Fork the repository** on GitHub:

   ```
   https://github.com/sg-open/devyantra-ui
   ```

2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/<your-username>/devyantra-ui.git
   cd devyantra-ui
   ```

3. **Add the upstream remote** (for keeping your fork in sync):

   ```bash
   git remote add upstream https://github.com/sg-open/devyantra-ui.git
   ```

4. **Set the correct Node version** (if you use nvm):

   ```bash
   nvm use
   ```

5. **Install dependencies**:

   ```bash
   npm install
   ```

6. **Start the dev server**:

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:5173](http://localhost:5173).

7. **Verify everything works**:

   ```bash
   npm run type-check   # TypeScript -- must pass with zero errors
   npm run lint          # ESLint with auto-fix
   npm run test:run      # Vitest unit tests (single run)
   npm run build         # Production build
   ```

### Available Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server at localhost:5173 |
| `npm run build` | Run type-check, then production build |
| `npm run type-check` | Run `vue-tsc --build` -- **must pass with zero errors** |
| `npm run lint` | ESLint with auto-fix |
| `npm run format` | Prettier formatting on `src/` |
| `npm run test:run` | Vitest unit tests (single run, no watch) |
| `npm run test` | Vitest unit tests (watch mode) |
| `npm run test:e2e` | Playwright E2E tests (all browsers) |
| `npm run test:e2e -- --project=chromium` | Playwright E2E tests (Chromium only) |
| `npm run test:e2e -- tests/e2e/core.spec.ts` | Run a single E2E test file |

---

## Project Architecture

DevYantra is a **single-page app** built with Vue 3 Composition API, TypeScript, and Vite.

```
src/
├── assets/
│   └── theme.css                # Design tokens & CSS custom properties
├── components/
│   ├── CompareText.vue          # Tool implementations (logic + UI)
│   ├── FormatText.vue
│   ├── HashGenerator.vue
│   ├── Base64Tools.vue
│   ├── JwtDecoder.vue
│   ├── TimestampTools.vue
│   ├── CharacterCount.vue
│   └── __tests__/               # Unit tests for components
├── composables/
│   ├── useDiff.ts               # Diff computation (jsdiff + diff2html)
│   ├── useDiffEngine.ts         # Low-level diff engine
│   ├── useDiffNavigation.ts     # Diff navigation controls
│   ├── useShareState.ts         # URL/localStorage state sharing (LZ-string)
│   ├── useTextProcessor.ts      # Text formatting (JSON, SQL, CSS, XML)
│   ├── useSEO.ts                # Meta tags & structured data
│   └── __tests__/               # Unit tests for composables
├── config/
│   └── seo.ts                   # SEO configuration per tool
├── router/
│   └── index.ts                 # Route definitions (tools are child routes)
├── stores/
│   └── theme.ts                 # Pinia store for dark/light theme
├── views/
│   ├── HomeView.vue             # Tab navigation + <router-view>
│   └── tools/
│       ├── TextCompareView.vue  # Thin view wrappers (SEO + component import)
│       ├── FormatTextView.vue
│       └── ...
├── main.ts                      # App entry, PrimeVue setup, DevyantraPreset
└── App.vue                      # Root component
tests/
└── e2e/                         # Playwright E2E tests (all E2E tests go here)
```

### Key Architectural Concepts

- **All tools are child routes** of `HomeView.vue`. The home view renders a tab navigation bar and a `<router-view>` for the active tool. The root path `/` redirects to `/tools/text-compare`.

- **Views are thin wrappers.** They import the tool component and call `useSEO()` on mount. All real logic lives in the component, not the view.

- **Components are the tool implementations.** Each tool is a self-contained `.vue` file using `<script setup lang="ts">`.

- **Composables hold shared logic.** Text processing, diff computation, state sharing, and SEO are extracted into reusable composables in `src/composables/`.

- **PrimeVue 4** provides UI components, registered globally via a custom Aura-based preset (`DevyantraPreset` in `src/main.ts`).

- **TailwindCSS 4** handles utility styling. Design tokens live in `src/assets/theme.css` (8px baseline grid, spacing scale, color tokens).

- **Dark mode** uses the `.app-dark` class on `<html>`, managed by the Pinia theme store (`src/stores/theme.ts`), persisted to localStorage as `devyantra-theme`.

- **Path alias:** `@` maps to `src/` (e.g., `import Foo from '@/components/Foo.vue'`).

---

## Adding a New Tool

This is the number-one contributor activity. `src/tools/registry.ts` is the single source of truth: the router, tab bar, command palette, footer, sitemap, and prerender list all derive from it automatically. Adding a new tool means creating its component and view, then wiring ONE registry entry -- there is no separate step to touch navigation, the footer, or the sitemap by hand. Follow these steps carefully -- each one is required.

### Step 1: Create the component

**File:** `src/components/NewTool.vue`

This is where all the logic and UI lives. Use Vue 3 `<script setup lang="ts">`, PrimeVue components, and design tokens from `theme.css`.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// Your tool logic here
// ALL processing must happen client-side -- no external API calls
const input = ref('')
const output = computed(() => {
  // Transform input
  return input.value
})
</script>

<template>
  <div class="tool-container">
    <!-- Use PrimeVue components: InputText, Button, Textarea, Select, etc. -->
    <!-- Use CSS custom properties from theme.css for spacing and colors -->
  </div>
</template>

<style scoped>
/* Use design tokens from src/assets/theme.css for consistency */
/* Example: var(--surface-card), var(--text-color), var(--spacing-md) */
</style>
```

Guidelines:
- No `any` types without strong justification.
- Handle edge cases: empty input, malformed data, very large input.
- Provide clear user feedback for errors (use PrimeVue's Toast or inline messages).

### Step 2: Create the view wrapper

**File:** `src/views/tools/NewToolView.vue`

This is a thin wrapper that imports the component and wires up SEO on mount. Every tool view follows the same pattern -- copy it verbatim from any existing view (e.g. `src/views/tools/CharacterCountView.vue`) and adapt the key and component name:

```vue
<template>
  <NewTool />
</template>

<script setup lang="ts">
import NewTool from '@/components/NewTool.vue'
import { onMounted } from 'vue'
import { useSEO } from '@/composables/useSEO'
import { getToolSEO } from '@/config/seo'

const { setMetaTags, addToolSchema, addBreadcrumbSchema, addFAQSchema, addHowToSchema } = useSEO()

onMounted(() => {
  const seo = getToolSEO('new-tool') // Must match the key you add in seo.ts (Step 3)
  if (seo) {
    setMetaTags({
      title: seo.title,
      description: seo.description,
      canonical: seo.canonical,
      ogType: seo.type
    })
    addToolSchema({
      name: seo.tool.name,
      description: seo.tool.description,
      url: `${window.location.origin}${seo.canonical}`,
      category: seo.tool.category,
      features: seo.tool.features,
      toolKey: 'new-tool'
    })
    addBreadcrumbSchema(seo.breadcrumb)
    addFAQSchema(seo.faqs)
    if (seo.howToSteps?.length) {
      addHowToSchema({
        name: `How to Use ${seo.tool.name}`,
        description: seo.tool.description,
        steps: seo.howToSteps,
        toolKey: 'new-tool'
      })
    }
  }
})
</script>
```

### Step 3: Add the SEO configuration

**File:** `src/config/seo.ts`

Add an entry to the `tools` map keyed by the same string you used in Step 2 (`getToolSEO('new-tool')`), including:
- Tool name and description
- Key features list
- FAQs (at least 2--3 question-answer pairs)
- How-to steps for structured data

### Step 4: Register the tool

**File:** `src/tools/registry.ts`

Add ONE `ToolDef` entry to the `TOOLS` array:

```ts
{
  slug: 'new-tool',
  name: 'New Tool',
  shortName: 'New Tool',
  description: 'Short palette subtitle',
  icon: 'pi pi-wrench',           // any PrimeIcons class ('pi pi-*')
  category: 'Text',               // 'Text' | 'Code' | 'Encoding' | 'Security' | 'Time'
  keywords: ['new tool', 'related search terms'],
  seoKey: 'new-tool',             // must match the key from Step 3
  footerGroup: 'text',            // 'text' | 'encoding' -- which footer column it lists under
  // footerName: 'New Tool Name', // optional: longer display name for the footer link only;
                                   // omit it and the footer falls back to `name`
  metaTitle: 'New Tool - Do The Thing Online | DEVYANTRA',
  metaDescription: 'A concise, keyword-rich description of what the tool does.',
  metaKeywords: 'new tool, related search terms',
  toolCategory: 'Text Processing',
  sitemapPriority: '0.9'
}
```

**File:** `src/router/index.ts`

Add one loader line to the `toolComponents` map, keyed by the same `slug`:

```ts
'new-tool': () => import('../views/tools/NewToolView.vue'),
```

### Step 5: That's it -- everything else derives automatically

The route, page title/description/canonical, tab bar entry, command palette entry, footer link, sitemap URL, and prerendered page all come from the registry entry you just added in Step 4. There is nothing else to hand-wire in `HomeView.vue`, `AppFooter.vue`, `CommandPalette.vue`, `vite.config.ts`, or `scripts/prerender.js`.

A `registry-drift.spec.ts` test enforces this pairing: it fails if a `ToolDef` has no matching route, or a route exists that isn't backed by a `ToolDef`. A typo'd slug or a missing loader line shows up as a failing test, not a silent gap.

### Step 6: Run quality gates

Before opening a PR, all of these must pass:

```bash
npm run type-check    # Zero TypeScript errors -- non-negotiable
npm run lint          # ESLint must pass
npm run build         # Production build must succeed
npm run test:run      # All unit tests must pass
```

### Checklist for new tools

Use this checklist to make sure you have not missed anything:

- [ ] Component created in `src/components/`
- [ ] View wrapper created in `src/views/tools/` (SEO wired via `getToolSEO`, matching an existing view's pattern)
- [ ] SEO config entry added in `src/config/seo.ts`
- [ ] `ToolDef` entry added in `src/tools/registry.ts`
- [ ] Loader line added in `src/router/index.ts`'s `toolComponents` map
- [ ] All processing is client-side (no external API calls)
- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Tests written and passing (unit tests for non-trivial logic in `src/components/__tests__/`; E2E tests in `tests/e2e/` for the primary workflow)

---

## Branch Naming

Create your branch from `main` using one of these prefixes:

| Prefix | Use for |
|--------|---------|
| `feat/` | New features or tools |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code restructuring (no behavior change) |
| `test/` | Adding or updating tests |

Examples:

```
feat/url-encoder-tool
fix/diff-view-scroll-sync
docs/update-contributing-guide
refactor/extract-format-composable
test/add-hash-generator-e2e
```

---

## Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard. Every commit message must use this format:

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to use |
|------|------------|
| `feat` | A new feature or tool |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace, semicolons (no logic change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or correcting tests |
| `chore` | Build process, dependencies, CI/CD, tooling |

### Examples

```
feat(tools): add URL encoder/decoder tool
fix(diff-view): resolve scroll sync issue in side-by-side mode
docs: update development setup instructions
refactor(composables): extract shared text processing logic
test(hash-generator): add unit tests for SHA-256 output
chore(deps): upgrade PrimeVue to 4.3.0
```

### Rules

- Use the **imperative mood** in the description: "add feature", not "added feature" or "adds feature".
- Keep the first line under **72 characters**.
- Reference related issues in the footer: `Closes #42` or `Fixes #42`.

---

## Pull Request Process

### 1. Sync your fork

Before starting work, make sure your fork is up to date:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### 2. Create a branch

```bash
git checkout -b feat/your-feature-name
```

### 3. Make your changes

Follow the coding standards and architecture patterns described in this guide.

### 4. Run all quality gates locally

Every one of these must pass before you open a PR:

```bash
npm run type-check    # Zero TypeScript errors
npm run lint          # ESLint passes
npm run test:run      # All unit tests pass
npm run build         # Production build succeeds
```

If any of these fail, fix the issues first. Do not open a PR with failing checks.

### 5. Push and open a PR

```bash
git push origin feat/your-feature-name
```

Open a pull request against the `main` branch of [sg-open/devyantra-ui](https://github.com/sg-open/devyantra-ui).

### PR description

Your PR description should include:

- **What changed**: A clear summary of the changes.
- **Why**: The motivation or issue being addressed.
- **Type of change**: Bug fix, new feature, refactor, docs, etc.
- **How it was tested**: Steps you took to verify correctness.
- **Screenshots**: Required for any UI changes.

### PR checklist

Before requesting review, confirm all of the following:

- [ ] Description clearly explains the changes and motivation
- [ ] Type of change is identified (bug fix / feature / refactor / docs)
- [ ] Changes have been tested locally
- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] `npm run test:run` -- all unit tests pass
- [ ] No breaking changes (or they are clearly documented in the PR)
- [ ] Screenshots attached for any UI changes
- [ ] All data processing is client-side (no external API calls)

### What happens after you open a PR

- A maintainer will review your PR, usually within a few days.
- You may be asked to make changes -- this is normal and collaborative, not a criticism of your work.
- Once approved, a maintainer will merge your PR.
- If your PR goes stale (no activity for 2 weeks), it may be closed. You can always reopen it.

---

## Code Style & Linting

### Automated tools

The project uses three automated tools to enforce consistency:

| Tool | Command | Purpose |
|------|---------|---------|
| **ESLint** | `npm run lint` | Code quality rules with auto-fix |
| **Prettier** | `npm run format` | Code formatting on `src/` |
| **vue-tsc** | `npm run type-check` | TypeScript type checking -- **must pass with zero errors** |

Run all three before committing. If you are unsure, `npm run build` runs type-check as part of the build.

### Style guidelines

**Vue components:**
- Always use `<script setup lang="ts">` with the Composition API. Do not use the Options API.
- Define TypeScript interfaces for props and emitted events.
- Extract reusable logic into composables.

**TypeScript:**
- No `any` types without a clear, documented justification.
- Prefer `ref()` and `computed()` for reactive state.
- Use proper type annotations for function parameters and return types.

**CSS:**
- Use design tokens from `src/assets/theme.css` (CSS custom properties) rather than hardcoded color or spacing values.
- Use scoped styles in components (`<style scoped>`).
- Follow the 8px baseline grid defined in the theme.

**UI components:**
- Use PrimeVue components for interactive elements (Button, InputText, Textarea, Select, Dialog, Toast, etc.).
- This ensures visual consistency across all tools.

**Imports:**
- Always use the `@/` path alias for imports from `src/` (e.g., `import Foo from '@/components/Foo.vue'`).

**Naming conventions:**

| Kind | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `HashGenerator.vue` |
| Views | PascalCase + View suffix | `TextCompareView.vue` |
| Composables | camelCase with `use` prefix | `useDiff.ts` |
| Stores | camelCase | `theme.ts` |
| Test files | mirror source file + `.spec.ts` | `DiffView.spec.ts` |

---

## Testing Guidelines

### Unit Tests (Vitest)

- **Location:** Colocated `__tests__/` directories (e.g., `src/components/__tests__/`, `src/composables/__tests__/`).
- **Run:** `npm run test:run` (single run) or `npm run test` (watch mode).
- **What to test:** Logic, computed values, edge cases, error handling.

```ts
import { describe, it, expect } from 'vitest'

describe('MyTool', () => {
  it('should handle empty input gracefully', () => {
    // Arrange
    const input = ''

    // Act
    const result = processInput(input)

    // Assert
    expect(result).toBe('')
  })

  it('should correctly transform valid input', () => {
    // ...
  })
})
```

### E2E Tests (Playwright)

- **Location:** `tests/e2e/` -- all E2E tests must go here (not in the root or an `e2e/` folder).
- **Run:** `npm run test:e2e` (all browsers) or `npm run test:e2e -- --project=chromium` (Chromium only).
- **What to test:** User-facing workflows -- navigation, input, output, error states.
- **Artifacts:** Screenshots go in `temp/screenshots/`, reports in `temp/reports/` (both git-ignored).

### What to test for each type of contribution

| Contribution | Minimum testing |
|-------------|----------------|
| New tool | Unit tests for core logic + E2E test for the primary workflow |
| Bug fix | A test that reproduces the bug, then verifies the fix |
| Refactor | Existing tests still pass; add tests if coverage gaps are found |
| UI change | E2E test verifying the visual/behavioral change |

### Edge cases to always consider

- Empty input
- Very large input
- Special characters and Unicode
- Malformed or invalid data
- Rapid repeated interactions (debouncing)

---

## Reporting Bugs

Found a bug? Please [open an issue](https://github.com/sg-open/devyantra-ui/issues/new) with the following information:

1. **Title:** A short, descriptive summary (e.g., "JSON formatter crashes on deeply nested objects").
2. **Environment:** Browser name and version, OS, screen size (if relevant).
3. **Steps to reproduce:** Numbered steps someone else can follow to see the bug.
4. **Expected behavior:** What should happen.
5. **Actual behavior:** What actually happens.
6. **Screenshots or recordings:** If the bug is visual, a screenshot or screen recording helps enormously.
7. **Console errors:** Open your browser's developer console and include any error messages.

A good bug report saves everyone time. The more specific you are, the faster we can fix it.

---

## Requesting Features

Have an idea? [Open an issue](https://github.com/sg-open/devyantra-ui/issues/new) with:

1. **Title:** A concise name for the feature (e.g., "Add URL encoder/decoder tool").
2. **Problem:** What problem does this solve? Who benefits?
3. **Proposed solution:** How should it work? Include mockups, examples, or references to similar tools if you can.
4. **Alternatives considered:** Other approaches you thought about and why you prefer this one.

Feature requests for **new developer tools** are especially welcome. Remember: all tools must process data entirely in the browser -- no server-side processing, no external API calls.

For major features, please open an issue to discuss the approach **before** starting implementation. This helps avoid wasted effort and ensures the feature aligns with the project's direction.

---

## Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. By participating in this project, you agree to abide by our [Code of Conduct](https://github.com/sg-open/devyantra-ui/blob/main/CODE_OF_CONDUCT.md).

In short: be kind, be respectful, assume good intentions, and help make this a community where everyone feels welcome.

---

## Questions?

If something in this guide is unclear, or you need help with your contribution, feel free to:

- [Open a discussion](https://github.com/sg-open/devyantra-ui/discussions) for general questions.
- Comment on the relevant issue if your question is about a specific task.
- Tag a maintainer in your PR if you are stuck on a review comment.

We would rather answer a question than have you struggle in silence. Do not hesitate to ask.

---

Thank you for helping make DevYantra better for developers everywhere.
