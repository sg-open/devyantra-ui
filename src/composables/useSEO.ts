import { useRoute } from 'vue-router'

interface SEOMetadata {
  title?: string
  description?: string
  keywords?: string
  canonical?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  robotsMeta?: string
}

interface OrganizationSchema {
  "@context": string
  "@type": string
  "@id": string
  name: string
  url: string
  logo: {
    "@type": string
    url: string
  }
  description: string
  sameAs: string[]
  contactPoint: {
    "@type": string
    contactType: string
    email: string
  }
}

interface BreadcrumbSchema {
  "@context": string
  "@type": string
  itemListElement: Array<{
    "@type": string
    position: number
    name: string
    item: string
  }>
}

export function useSEO() {
  const route = useRoute()

  const currentYear = new Date().getFullYear()

  // Base organization schema
  const organizationSchema: OrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${window.location.origin}/#organization`,
    name: "DEVYANTRA",
    url: window.location.origin,
    logo: {
      "@type": "ImageObject",
      url: `${window.location.origin}/logo.png`
    },
    description: "Professional developer tools collection offering free online utilities for text processing, encoding, hashing, and data manipulation.",
    sameAs: [
      // Add social media URLs here when available
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "contact@devyantra.app"
    }
  }

  function setMetaTags(metadata: SEOMetadata) {
    // Set title
    if (metadata.title) {
      document.title = `${metadata.title} | ${currentYear}`
    }

    // Set meta description
    updateMetaTag('name', 'description', metadata.description)

    // Set meta keywords
    updateMetaTag('name', 'keywords', metadata.keywords)

    // Set robots meta
    updateMetaTag('name', 'robots', metadata.robotsMeta || 'index,follow')

    // Set canonical link
    updateCanonicalLink(metadata.canonical)

    // Set Open Graph tags
    updateMetaTag('property', 'og:title', metadata.ogTitle || metadata.title)
    updateMetaTag('property', 'og:description', metadata.ogDescription || metadata.description)
    updateMetaTag('property', 'og:type', metadata.ogType || 'website')
    updateMetaTag('property', 'og:url', `${window.location.origin}${metadata.canonical || route.path}`)
    updateMetaTag('property', 'og:image', metadata.ogImage || `${window.location.origin}/og-image.png`)
    updateMetaTag('property', 'og:site_name', 'DEVYANTRA')

    // Set Twitter Card tags
    updateMetaTag('name', 'twitter:card', metadata.twitterCard || 'summary_large_image')
    updateMetaTag('name', 'twitter:title', metadata.twitterTitle || metadata.title)
    updateMetaTag('name', 'twitter:description', metadata.twitterDescription || metadata.description)
    updateMetaTag('name', 'twitter:image', metadata.twitterImage || metadata.ogImage || `${window.location.origin}/twitter-image.png`)

    // Additional SEO meta tags
    updateMetaTag('name', 'author', 'DEVYANTRA Development Team')
    updateMetaTag('name', 'generator', 'Vue.js')
    updateMetaTag('name', 'language', 'English')
    updateMetaTag('name', 'revisit-after', '7 days')
    updateMetaTag('name', 'distribution', 'global')
    updateMetaTag('name', 'rating', 'general')
  }

  function updateMetaTag(attribute: string, name: string, content?: string) {
    if (!content) return

    let tag = document.querySelector(`meta[${attribute}="${name}"]`)

    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute(attribute, name)
      document.head.appendChild(tag)
    }

    tag.setAttribute('content', content)
  }

  function updateCanonicalLink(href?: string) {
    if (!href) return

    let link = document.querySelector('link[rel="canonical"]')

    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }

    link.setAttribute('href', `${window.location.origin}${href}`)
  }

  function addStructuredData(schema: object, id?: string) {
    // Remove existing schema with same ID
    if (id) {
      const existing = document.querySelector(`script[data-schema-id="${id}"]`)
      if (existing) {
        existing.remove()
      }
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    if (id) {
      script.setAttribute('data-schema-id', id)
    }
    script.textContent = JSON.stringify(schema, null, 2)
    document.head.appendChild(script)
  }

  function addOrganizationSchema() {
    addStructuredData(organizationSchema, 'organization')
  }

  function addBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
    const breadcrumbSchema: BreadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `${window.location.origin}${item.url}`
      }))
    }

    addStructuredData(breadcrumbSchema, 'breadcrumb')
  }

  function addToolSchema(toolData: {
    name: string
    description: string
    url: string
    category: string
    features: string[]
  }) {
    const toolSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: toolData.name,
      description: toolData.description,
      url: toolData.url,
      applicationCategory: toolData.category,
      operatingSystem: "Web Browser",
      permissions: "None required",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock"
      },
      creator: {
        "@type": "Organization",
        "@id": `${window.location.origin}/#organization`
      },
      provider: {
        "@type": "Organization",
        "@id": `${window.location.origin}/#organization`
      },
      featureList: toolData.features,
      softwareVersion: "2.0.0",
      datePublished: "2024-01-01",
      dateModified: new Date().toISOString().split('T')[0],
      inLanguage: "en-US",
      isAccessibleForFree: true,
      screenshot: `${window.location.origin}/screenshots/${toolData.name.toLowerCase().replace(/\s+/g, '-')}.png`
    }

    addStructuredData(toolSchema, 'tool')
  }

  function addFAQSchema(faqs: Array<{ question: string; answer: string }>) {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(faq => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer
        }
      }))
    }

    addStructuredData(faqSchema, 'faq')
  }

  function generateSitemap() {
    const routes = [
      { url: '/', priority: '1.0', changefreq: 'weekly' },
      { url: '/tools/text-compare', priority: '0.9', changefreq: 'monthly' },
      { url: '/tools/format-text', priority: '0.9', changefreq: 'monthly' },
      { url: '/tools/hash-generator', priority: '0.9', changefreq: 'monthly' },
      { url: '/tools/base64-tools', priority: '0.9', changefreq: 'monthly' },
      { url: '/tools/jwt-decoder', priority: '0.9', changefreq: 'monthly' },
      { url: '/tools/timestamp-converter', priority: '0.9', changefreq: 'monthly' },
      { url: '/tools/character-count', priority: '0.9', changefreq: 'monthly' }
    ]

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${window.location.origin}${route.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    return sitemap
  }

  function generateRobotsTxt() {
    return `User-agent: *
Allow: /

Sitemap: ${window.location.origin}/sitemap.xml

# Block access to admin areas (if any in future)
Disallow: /admin/
Disallow: /api/

# Allow all content and tools
Allow: /tools/`
  }

  // Track Core Web Vitals
  function trackCoreWebVitals() {
    if ('web-vital' in window) {
      // This would integrate with web-vitals library
      console.log('Core Web Vitals tracking initialized')
    }
  }

  // Preload critical resources
  function preloadCriticalResources() {
    // Preload fonts
    const fontLink = document.createElement('link')
    fontLink.rel = 'preload'
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
    fontLink.as = 'style'
    fontLink.onload = () => {
      fontLink.rel = 'stylesheet'
    }
    document.head.appendChild(fontLink)

    // Preconnect to external domains
    const preconnectLinks = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ]

    preconnectLinks.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = url
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })
  }

  return {
    setMetaTags,
    addStructuredData,
    addOrganizationSchema,
    addBreadcrumbSchema,
    addToolSchema,
    addFAQSchema,
    generateSitemap,
    generateRobotsTxt,
    trackCoreWebVitals,
    preloadCriticalResources
  }
}

// Export types for use in components
export type { SEOMetadata }