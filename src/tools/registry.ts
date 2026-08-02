// Central tool registry — pure data, no side effects.
//
// This module is imported by the Vue app AND by vite.config.ts at build time
// (sitemap/prerender generation), so it MUST stay free of:
//   - `vue` / `vue-router` imports
//   - Vite build-time env-variable reads
//   - any other runtime/browser-only API
//
// metaTitle / metaDescription / metaKeywords / toolCategory are copied
// VERBATIM from today's src/router/index.ts `toolRoutes` meta blocks — do
// not paraphrase them; downstream tasks rely on byte-identical SEO output.

export interface ToolDef {
  slug: string
  name: string
  shortName: string
  description: string          // palette subtitle / short marketing line
  icon: string                 // 'pi pi-*'
  category: 'Text' | 'Code' | 'Encoding' | 'Security' | 'Time'
  keywords: string[]
  seoKey: string
  footerGroup: 'text' | 'encoding'
  footerName?: string          // custom name for footer; falls back to name
  metaTitle: string            // verbatim from today's router meta
  metaDescription: string      // verbatim
  metaKeywords: string         // verbatim
  toolCategory: string         // verbatim router meta toolCategory
  sitemapPriority: string      // '1.0' | '0.9'
}

export interface PageDef {
  slug: string                 // 'feedback' | 'privacy'
  path: string                 // '/feedback' | '/privacy'
  name: string
  metaTitle: string
  metaDescription: string
  sitemapPriority: string
  changefreq: string
  routed: boolean               // true once a real route exists; sitemap/prerender
                                 // MUST filter on this — both pages are routed
                                 // as of Task 14 (privacy's route landed then)
}

export const TOOLS: readonly ToolDef[] = [
  {
    slug: 'text-compare',
    name: 'Text Compare',
    shortName: 'Text Compare',
    description: 'Compare & diff text',
    icon: 'pi pi-arrows-alt',
    category: 'Text',
    keywords: ['text compare', 'json compare', 'sql compare', 'diff tool', 'text difference', 'online compare'],
    seoKey: 'text-compare',
    footerGroup: 'text',
    metaTitle: 'Text Compare Online - Compare JSON, SQL & Text | DEVYANTRA',
    metaDescription: 'Compare and format JSON, SQL, or text files online with intelligent diff highlighting. Free text comparison tool with side-by-side view and syntax formatting.',
    metaKeywords: 'text compare, json compare, sql compare, diff tool, text difference, online compare',
    toolCategory: 'Text Processing',
    sitemapPriority: '1.0'
  },
  {
    slug: 'delimiter',
    name: 'Delimiter',
    shortName: 'Delimiter',
    description: 'Split & join text',
    icon: 'pi pi-arrows-h',
    category: 'Text',
    keywords: ['delimiter tool', 'split text', 'join text', 'csv converter', 'comma separator', 'text splitter'],
    seoKey: 'delimiter',
    footerGroup: 'text',
    footerName: 'Delimiter Tool',
    metaTitle: 'Delimiter Tool - Split & Join Text Online | DEVYANTRA',
    metaDescription: 'Convert between delimited and newline-separated text formats. Split comma-separated values to lines or join lines with custom delimiters.',
    metaKeywords: 'delimiter tool, split text, join text, csv converter, comma separator, text splitter',
    toolCategory: 'Text Processing',
    sitemapPriority: '0.9'
  },
  {
    slug: 'format-text',
    name: 'Code Formatter',
    shortName: 'Code Formatter',
    description: 'JSON, SQL & more',
    icon: 'pi pi-file-edit',
    category: 'Code',
    keywords: ['code formatter', 'json formatter', 'sql formatter', 'xml formatter', 'code beautifier', 'online formatter'],
    seoKey: 'format-text',
    footerGroup: 'text',
    metaTitle: 'Code Formatter - JSON, SQL, XML & More | DEVYANTRA',
    metaDescription: 'Format and beautify JSON, SQL, XML, and other code online. Professional code formatter with syntax highlighting and error detection.',
    metaKeywords: 'code formatter, json formatter, sql formatter, xml formatter, code beautifier, online formatter',
    toolCategory: 'Code Formatting',
    sitemapPriority: '0.9'
  },
  {
    slug: 'jwt-decoder',
    name: 'JWT Decoder',
    shortName: 'JWT Decoder',
    description: 'Decode & inspect tokens',
    icon: 'pi pi-shield',
    category: 'Security',
    keywords: ['jwt decoder', 'json web token decoder', 'jwt analyzer', 'token decoder online'],
    seoKey: 'jwt-decoder',
    footerGroup: 'encoding',
    metaTitle: 'JWT Decoder Online - Decode JSON Web Tokens | DEVYANTRA',
    metaDescription: 'Decode and analyze JWT tokens online. Free JWT decoder with header, payload, and signature verification for debugging authentication.',
    metaKeywords: 'jwt decoder, json web token decoder, jwt analyzer, token decoder online',
    toolCategory: 'Authentication',
    sitemapPriority: '0.9'
  },
  {
    slug: 'hash-generator',
    name: 'Hash Generator',
    shortName: 'Hash Generator',
    description: 'MD5, SHA1, SHA256',
    icon: 'pi pi-lock',
    category: 'Security',
    keywords: ['hash generator', 'md5 generator', 'sha256 generator', 'cryptographic hash', 'password hash'],
    seoKey: 'hash-generator',
    footerGroup: 'encoding',
    metaTitle: 'Hash Generator - MD5, SHA1, SHA256, SHA512 | DEVYANTRA',
    metaDescription: 'Generate secure hashes online with MD5, SHA1, SHA256, SHA512 algorithms. Free cryptographic hash generator for passwords and data integrity.',
    metaKeywords: 'hash generator, md5 generator, sha256 generator, cryptographic hash, password hash',
    toolCategory: 'Security',
    sitemapPriority: '0.9'
  },
  {
    slug: 'base64-tools',
    name: 'Base64 Tools',
    shortName: 'Base64 Tools',
    description: 'Encode & decode',
    icon: 'pi pi-arrow-right-arrow-left',
    category: 'Encoding',
    keywords: ['base64 encoder', 'base64 decoder', 'base64 converter', 'encode decode online'],
    seoKey: 'base64-tools',
    footerGroup: 'encoding',
    metaTitle: 'Base64 Encoder Decoder Online - Encode & Decode | DEVYANTRA',
    metaDescription: 'Encode and decode Base64 strings online. Free Base64 converter tool with support for text, URLs, and binary data encoding.',
    metaKeywords: 'base64 encoder, base64 decoder, base64 converter, encode decode online',
    toolCategory: 'Encoding',
    sitemapPriority: '0.9'
  },
  {
    slug: 'timestamp-converter',
    name: 'Timestamp',
    shortName: 'Timestamp',
    description: 'Unix & ISO converter',
    icon: 'pi pi-clock',
    category: 'Time',
    keywords: ['timestamp converter', 'unix timestamp', 'epoch converter', 'date converter', 'time converter'],
    seoKey: 'timestamp-converter',
    footerGroup: 'encoding',
    footerName: 'Timestamp Converter',
    metaTitle: 'Timestamp Converter - Unix Time to Date | DEVYANTRA',
    metaDescription: 'Convert Unix timestamps to human-readable dates and vice versa. Free timestamp converter supporting multiple formats and timezones.',
    metaKeywords: 'timestamp converter, unix timestamp, epoch converter, date converter, time converter',
    toolCategory: 'Date & Time',
    sitemapPriority: '0.9'
  },
  {
    slug: 'character-count',
    name: 'Character Count',
    shortName: 'Character Count',
    description: 'Text analytics',
    icon: 'pi pi-hashtag',
    category: 'Text',
    keywords: ['character counter', 'word counter', 'text analytics', 'line counter', 'text statistics'],
    seoKey: 'character-count',
    footerGroup: 'text',
    footerName: 'Character Counter',
    metaTitle: 'Character Counter - Word Count & Text Analytics | DEVYANTRA',
    metaDescription: 'Count characters, words, lines, and paragraphs in text. Free character counter with detailed text analytics and statistics.',
    metaKeywords: 'character counter, word counter, text analytics, line counter, text statistics',
    toolCategory: 'Text Analysis',
    sitemapPriority: '0.9'
  },
  {
    slug: 'regex-tester',
    name: 'Regex Tester',
    shortName: 'Regex Tester',
    description: 'Test & debug patterns',
    icon: 'pi pi-asterisk',
    category: 'Code',
    keywords: ['regex tester', 'regular expression tester', 'regex online', 'regex match', 'regex replace', 'redos safe regex'],
    seoKey: 'regex-tester',
    footerGroup: 'text',
    metaTitle: 'Regex Tester Online - Live Match Highlighting | DEVYANTRA',
    metaDescription: 'Test regular expressions online with live match highlighting, named groups, and replace preview. ReDoS-safe: patterns run in a worker and can never freeze your browser.',
    metaKeywords: 'regex tester, regular expression tester, regex online, regex match, regex replace, redos safe regex',
    toolCategory: 'Code Testing',
    sitemapPriority: '0.9'
  },
  {
    slug: 'json-explorer',
    name: 'JSON Explorer',
    shortName: 'JSON Explorer',
    description: 'Tree view & JSON paths',
    icon: 'pi pi-sitemap',
    category: 'Code',
    keywords: ['json viewer', 'json tree viewer', 'json explorer', 'json path finder', 'json parser online'],
    seoKey: 'json-explorer',
    footerGroup: 'text',
    metaTitle: 'JSON Explorer - Tree Viewer & Path Finder | DEVYANTRA',
    metaDescription: 'Explore JSON as a collapsible tree with click-to-copy JSON paths, search, and structure stats. Free, private, and entirely in your browser.',
    metaKeywords: 'json viewer, json tree viewer, json explorer, json path finder, json parser online',
    toolCategory: 'Data Inspection',
    sitemapPriority: '0.9'
  },
  {
    slug: 'cron-parser',
    name: 'Cron Parser',
    shortName: 'Cron Parser',
    description: 'Explain & preview schedules',
    icon: 'pi pi-stopwatch',
    category: 'Time',
    keywords: ['cron parser', 'cron expression', 'crontab explained', 'next cron run', 'cron schedule'],
    seoKey: 'cron-parser',
    footerGroup: 'encoding',
    metaTitle: 'Cron Expression Parser - Next Runs & Plain English | DEVYANTRA',
    metaDescription: 'Parse cron expressions into plain English and preview the next 10 run times in local time and UTC. Supports ranges, steps, lists, and day names.',
    metaKeywords: 'cron parser, cron expression, crontab explained, next cron run, cron schedule',
    toolCategory: 'Date & Time',
    sitemapPriority: '0.9'
  },
  {
    slug: 'uuid-generator',
    name: 'UUID Generator',
    shortName: 'UUID / ULID',
    description: 'Generate & inspect IDs',
    icon: 'pi pi-id-card',
    category: 'Security',
    keywords: ['uuid generator', 'uuid v4', 'uuid v7', 'ulid generator', 'guid generator', 'uuid decoder'],
    seoKey: 'uuid-generator',
    footerGroup: 'encoding',
    metaTitle: 'UUID & ULID Generator - v4, v7, Inspector | DEVYANTRA',
    metaDescription: 'Generate UUID v4, timestamp-ordered UUID v7, and ULIDs in bulk — and inspect any identifier to reveal its version, variant, and embedded timestamp.',
    metaKeywords: 'uuid generator, uuid v4, uuid v7, ulid generator, guid generator, uuid decoder',
    toolCategory: 'Identifiers',
    sitemapPriority: '0.9'
  },
  {
    slug: 'url-parser',
    name: 'URL Parser',
    shortName: 'URL Parser',
    description: 'Decompose & edit URLs',
    icon: 'pi pi-link',
    category: 'Encoding',
    keywords: ['url parser', 'query string parser', 'url decoder', 'url encoder', 'parse url online', 'query params editor'],
    seoKey: 'url-parser',
    footerGroup: 'encoding',
    metaTitle: 'URL Parser & Query String Editor | DEVYANTRA',
    metaDescription: 'Break any URL into scheme, host, path, and an editable query-parameter table that rebuilds the URL live. Encode or decode components instantly.',
    metaKeywords: 'url parser, query string parser, url decoder, url encoder, parse url online, query params editor',
    toolCategory: 'Encoding',
    sitemapPriority: '0.9'
  }
]

export const PAGES: readonly PageDef[] = [
  {
    slug: 'feedback',
    path: '/feedback',
    name: 'Feedback',
    metaTitle: 'Feedback - Help Improve DevYantra | DEVYANTRA',
    metaDescription: 'Share your feedback and help make DevYantra better for developers. Report bugs, request features, or share general thoughts.',
    sitemapPriority: '0.3',
    changefreq: 'yearly',
    routed: true
  },
  {
    slug: 'privacy',
    path: '/privacy',
    name: 'Privacy',
    metaTitle: 'Privacy - Nothing Leaves Your Browser | DEVYANTRA',
    metaDescription: 'DevYantra runs entirely in your browser: no backend, no telemetry, no third-party requests. Verify it yourself in devtools.',
    sitemapPriority: '0.3',
    changefreq: 'yearly',
    routed: true
  }
]

export const toolPath = (t: ToolDef) => `/tools/${t.slug}`
