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
    metaTitle: 'Character Counter - Word Count & Text Analytics | DEVYANTRA',
    metaDescription: 'Count characters, words, lines, and paragraphs in text. Free character counter with detailed text analytics and statistics.',
    metaKeywords: 'character counter, word counter, text analytics, line counter, text statistics',
    toolCategory: 'Text Analysis',
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
    changefreq: 'yearly'
  },
  {
    slug: 'privacy',
    path: '/privacy',
    name: 'Privacy',
    metaTitle: 'Privacy - Nothing Leaves Your Browser | DEVYANTRA',
    metaDescription: 'DevYantra runs entirely in your browser: no backend, no telemetry, no third-party requests. Verify it yourself in devtools.',
    sitemapPriority: '0.3',
    changefreq: 'yearly'
  }
]

export const toolPath = (t: ToolDef) => `/tools/${t.slug}`
