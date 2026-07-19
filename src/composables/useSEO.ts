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

  // Base organization schema
  const organizationSchema: OrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${window.location.origin}/#organization`,
    name: "DEVYANTRA",
    url: window.location.origin,
    logo: {
      "@type": "ImageObject",
      url: `${window.location.origin}/og-image.png`
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
    // Set title — use as-is (route titles already include brand)
    if (metadata.title) {
      document.title = metadata.title
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
    updateMetaTag('name', 'twitter:image', metadata.twitterImage || metadata.ogImage || `${window.location.origin}/og-image.png`)
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
    toolKey?: string
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
      isAccessibleForFree: true
    }

    // Use tool key for unique schema ID, fall back to generic 'tool'
    addStructuredData(toolSchema, `tool-${toolData.toolKey || 'default'}`)
  }

  function addFAQSchema(faqs: Array<{ question: string; answer: string }>) {
    if (!faqs.length) return

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

  function addWebSiteSchema() {
    const webSiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "DEVYANTRA",
      url: window.location.origin,
      description: "Free online developer tools for text comparison, JSON formatting, hash generation, Base64 encoding, JWT decoding, and more.",
      publisher: {
        "@type": "Organization",
        "@id": `${window.location.origin}/#organization`
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${window.location.origin}/tools/{search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    }

    addStructuredData(webSiteSchema, 'website')
  }

  function addHowToSchema(data: {
    name: string
    description: string
    steps: Array<{ name: string; text: string }>
    toolKey?: string
  }) {
    const howToSchema = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: data.name,
      description: data.description,
      step: data.steps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.name,
        text: step.text
      }))
    }

    addStructuredData(howToSchema, `howto-${data.toolKey || 'default'}`)
  }

  return {
    setMetaTags,
    addStructuredData,
    addOrganizationSchema,
    addBreadcrumbSchema,
    addToolSchema,
    addFAQSchema,
    addHowToSchema,
    addWebSiteSchema
  }
}

// Export types for use in components
export type { SEOMetadata }
