export const SEO_CONFIG = {
  site: {
    name: 'DEVYANTRA',
    url: 'https://devyantra.app',
    title: 'DEVYANTRA - Professional Developer Tools Collection',
    description: 'Free online developer tools for text comparison, JSON formatting, hash generation, Base64 encoding, JWT decoding, and more. Professional-grade web tools.',
    keywords: 'developer tools, online tools, json formatter, text compare, hash generator, base64, jwt decoder, timestamp converter',
    author: 'DEVYANTRA Development Team',
    language: 'en-US',
    type: 'website'
  },

  social: {
    twitter: {
      site: '@devyantra',
      creator: '@devyantra'
    },
    facebook: {
      appId: ''
    },
    linkedin: {
      company: 'devyantra'
    }
  },

  organization: {
    name: 'DEVYANTRA',
    url: 'https://devyantra.app',
    logo: 'https://devyantra.app/logo.png',
    description: 'Professional developer tools collection offering free online utilities for text processing, encoding, hashing, and data manipulation.',
    email: 'contact@devyantra.app',
    sameAs: [
      // Add social media URLs when available
    ]
  },

  tools: {
    'text-compare': {
      name: 'Text Compare Online',
      description: 'Compare and format JSON, SQL, or text files online with intelligent diff highlighting.',
      category: 'Text Processing',
      features: ['Text comparison', 'JSON/SQL formatting', 'Side-by-side diff view', 'Syntax highlighting']
    },
    'format-text': {
      name: 'JSON & SQL Formatter',
      description: 'Format and beautify JSON, SQL, XML, and other code online with syntax highlighting.',
      category: 'Code Formatting',
      features: ['Multi-language formatting', 'Syntax highlighting', 'Error detection', 'Minify/beautify']
    },
    'hash-generator': {
      name: 'Hash Generator',
      description: 'Generate secure cryptographic hashes with MD5, SHA1, SHA256, SHA512 algorithms.',
      category: 'Security',
      features: ['Multiple hash algorithms', 'Password hashing', 'Data integrity verification', 'Local processing']
    },
    'base64-tools': {
      name: 'Base64 Encoder/Decoder',
      description: 'Encode and decode Base64 strings with support for text, URLs, and binary data.',
      category: 'Encoding',
      features: ['Base64 encoding/decoding', 'URL-safe Base64', 'Real-time conversion', 'Multi-format support']
    },
    'jwt-decoder': {
      name: 'JWT Decoder',
      description: 'Decode and analyze JWT tokens with header, payload, and signature verification.',
      category: 'Authentication',
      features: ['JWT token decoding', 'Claims inspection', 'Expiration checking', 'Security analysis']
    },
    'timestamp-converter': {
      name: 'Timestamp Converter',
      description: 'Convert Unix timestamps to dates and vice versa with timezone support.',
      category: 'Date & Time',
      features: ['Unix timestamp conversion', 'Multiple timezone support', 'Various date formats', 'Real-time conversion']
    },
    'character-count': {
      name: 'Character Counter',
      description: 'Count characters, words, lines, and paragraphs with detailed text analytics.',
      category: 'Text Analysis',
      features: ['Character/word counting', 'Text analytics', 'Platform limits', 'Reading time estimation']
    }
  },

  meta: {
    robots: 'index,follow',
    googlebot: 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
    bingbot: 'index,follow',
    viewport: 'width=device-width,initial-scale=1',
    'format-detection': 'telephone=no',
    'theme-color': '#3b82f6',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'DEVYANTRA',
    'application-name': 'DEVYANTRA',
    'msapplication-TileColor': '#3b82f6',
    'msapplication-config': '/browserconfig.xml'
  },

  structured: {
    breadcrumb: true,
    organization: true,
    website: true,
    tool: true,
    faq: true
  }
}

export const getToolSEO = (toolKey: string) => {
  const tool = SEO_CONFIG.tools[toolKey as keyof typeof SEO_CONFIG.tools]
  if (!tool) return null

  return {
    title: `${tool.name} | ${SEO_CONFIG.site.name}`,
    description: tool.description,
    canonical: `/tools/${toolKey}`,
    type: 'website',
    tool,
    breadcrumb: [
      { name: 'Home', url: '/' },
      { name: tool.name, url: `/tools/${toolKey}` }
    ]
  }
}