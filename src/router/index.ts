import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'

// SEO-optimized tool routes
const toolRoutes: RouteRecordRaw[] = [
  {
    path: '/tools/text-compare',
    name: 'text-compare',
    component: () => import('../views/tools/TextCompareView.vue'),
    meta: {
      title: 'Text Compare Online - Compare JSON, SQL & Text | DEVYANTRA',
      description: 'Compare and format JSON, SQL, or text files online with intelligent diff highlighting. Free text comparison tool with side-by-side view and syntax formatting.',
      keywords: 'text compare, json compare, sql compare, diff tool, text difference, online compare',
      canonical: '/tools/text-compare',
      toolName: 'Text Compare',
      toolCategory: 'Text Processing',
      breadcrumb: 'Text Compare'
    }
  },
  {
    path: '/tools/format-text',
    name: 'format-text',
    component: () => import('../views/tools/FormatTextView.vue'),
    meta: {
      title: 'Code Formatter - JSON, SQL, XML & More | DEVYANTRA',
      description: 'Format and beautify JSON, SQL, XML, and other code online. Professional code formatter with syntax highlighting and error detection.',
      keywords: 'code formatter, json formatter, sql formatter, xml formatter, code beautifier, online formatter',
      canonical: '/tools/format-text',
      toolName: 'Code Formatter',
      toolCategory: 'Code Formatting',
      breadcrumb: 'Code Formatter'
    }
  },
  {
    path: '/tools/hash-generator',
    name: 'hash-generator',
    component: () => import('../views/tools/HashGeneratorView.vue'),
    meta: {
      title: 'Hash Generator - MD5, SHA1, SHA256, SHA512 | DEVYANTRA',
      description: 'Generate secure hashes online with MD5, SHA1, SHA256, SHA512 algorithms. Free cryptographic hash generator for passwords and data integrity.',
      keywords: 'hash generator, md5 generator, sha256 generator, cryptographic hash, password hash',
      canonical: '/tools/hash-generator',
      toolName: 'Hash Generator',
      toolCategory: 'Security',
      breadcrumb: 'Hash Generator'
    }
  },
  {
    path: '/tools/base64-tools',
    name: 'base64-tools',
    component: () => import('../views/tools/Base64ToolsView.vue'),
    meta: {
      title: 'Base64 Encoder Decoder Online - Encode & Decode | DEVYANTRA',
      description: 'Encode and decode Base64 strings online. Free Base64 converter tool with support for text, URLs, and binary data encoding.',
      keywords: 'base64 encoder, base64 decoder, base64 converter, encode decode online',
      canonical: '/tools/base64-tools',
      toolName: 'Base64 Tools',
      toolCategory: 'Encoding',
      breadcrumb: 'Base64 Tools'
    }
  },
  {
    path: '/tools/jwt-decoder',
    name: 'jwt-decoder',
    component: () => import('../views/tools/JwtDecoderView.vue'),
    meta: {
      title: 'JWT Decoder Online - Decode JSON Web Tokens | DEVYANTRA',
      description: 'Decode and analyze JWT tokens online. Free JWT decoder with header, payload, and signature verification for debugging authentication.',
      keywords: 'jwt decoder, json web token decoder, jwt analyzer, token decoder online',
      canonical: '/tools/jwt-decoder',
      toolName: 'JWT Decoder',
      toolCategory: 'Authentication',
      breadcrumb: 'JWT Decoder'
    }
  },
  {
    path: '/tools/timestamp-converter',
    name: 'timestamp-converter',
    component: () => import('../views/tools/TimestampConverterView.vue'),
    meta: {
      title: 'Timestamp Converter - Unix Time to Date | DEVYANTRA',
      description: 'Convert Unix timestamps to human-readable dates and vice versa. Free timestamp converter supporting multiple formats and timezones.',
      keywords: 'timestamp converter, unix timestamp, epoch converter, date converter, time converter',
      canonical: '/tools/timestamp-converter',
      toolName: 'Timestamp Converter',
      toolCategory: 'Date & Time',
      breadcrumb: 'Timestamp Converter'
    }
  },
  {
    path: '/tools/character-count',
    name: 'character-count',
    component: () => import('../views/tools/CharacterCountView.vue'),
    meta: {
      title: 'Character Counter - Word Count & Text Analytics | DEVYANTRA',
      description: 'Count characters, words, lines, and paragraphs in text. Free character counter with detailed text analytics and statistics.',
      keywords: 'character counter, word counter, text analytics, line counter, text statistics',
      canonical: '/tools/character-count',
      toolName: 'Character Counter',
      toolCategory: 'Text Analysis',
      breadcrumb: 'Character Counter'
    }
  },
  {
    path: '/tools/delimiter',
    name: 'delimiter',
    component: () => import('../views/DelimiterView.vue'),
    meta: {
      title: 'Delimiter Tool - Split & Join Text Online | DEVYANTRA',
      description: 'Convert between delimited and newline-separated text formats. Split comma-separated values to lines or join lines with custom delimiters.',
      keywords: 'delimiter tool, split text, join text, csv converter, comma separator, text splitter',
      canonical: '/tools/delimiter',
      toolName: 'Delimiter Tool',
      toolCategory: 'Text Processing',
      breadcrumb: 'Delimiter'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      children: toolRoutes,
      redirect: '/tools/text-compare',
      meta: {
        title: 'DevYantra - free dev tools',
        description: 'Free online developer tools for text comparison, JSON formatting, hash generation, Base64 encoding, JWT decoding, and more. Professional-grade web tools.',
        keywords: 'developer tools, online tools, json formatter, text compare, hash generator, base64',
        canonical: '/'
      }
    },
    {
      path: '/feedback',
      name: 'feedback',
      component: () => import('../views/FeedbackView.vue'),
      meta: {
        title: 'Feedback - Help Improve DevYantra | DEVYANTRA',
        description: 'Share your feedback and help make DevYantra better for developers. Report bugs, request features, or share general thoughts.',
        keywords: 'feedback, bug report, feature request, developer feedback, devyantra feedback',
        canonical: '/feedback'
      }
    },
    // Redirect old hash-based routes to clean URLs
    {
      path: '/:pathMatch(.*)*',
      redirect: '/tools/text-compare'
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Global navigation guard for SEO meta updates
router.beforeEach((to, from, next) => {
  // Update document title
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }

  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription && to.meta?.description) {
    metaDescription.setAttribute('content', to.meta.description as string)
  }

  // Update canonical link
  const canonicalLink = document.querySelector('link[rel="canonical"]')
  if (canonicalLink && to.meta?.canonical) {
    canonicalLink.setAttribute('href', `${window.location.origin}${to.meta.canonical}`)
  }

  next()
})

export default router
