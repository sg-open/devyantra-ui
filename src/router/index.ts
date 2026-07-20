import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { TOOLS, toolPath } from '@/tools/registry'

// Component loaders keyed by slug — the only hand-maintained part of the
// tool-route table now; everything else (path/name/meta) is generated from
// the registry so the two can never drift.
const toolComponents: Record<string, () => Promise<unknown>> = {
  'text-compare': () => import('../views/tools/TextCompareView.vue'),
  'delimiter': () => import('../views/tools/DelimiterView.vue'),
  'format-text': () => import('../views/tools/FormatTextView.vue'),
  'jwt-decoder': () => import('../views/tools/JwtDecoderView.vue'),
  'hash-generator': () => import('../views/tools/HashGeneratorView.vue'),
  'base64-tools': () => import('../views/tools/Base64ToolsView.vue'),
  'timestamp-converter': () => import('../views/tools/TimestampConverterView.vue'),
  'character-count': () => import('../views/tools/CharacterCountView.vue')
}

// SEO-optimized tool routes, generated from the registry
const toolRoutes: RouteRecordRaw[] = TOOLS.map((t) => ({
  path: toolPath(t),
  name: t.slug,
  component: toolComponents[t.slug]!,
  meta: {
    title: t.metaTitle,
    description: t.metaDescription,
    keywords: t.metaKeywords,
    canonical: toolPath(t),
    toolName: t.name,
    toolCategory: t.toolCategory,
    breadcrumb: t.name
  }
}))

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
        title: 'DevYantra - Free Online Developer Tools | DEVYANTRA',
        description: 'Free browser-based developer tools: text diff, JSON formatter, hash generator, Base64, JWT decoder, timestamps, and more. No signup, no data sent to servers.',
        keywords: 'developer tools, online tools, json formatter, text compare, hash generator, base64',
        canonical: '/tools/text-compare'
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
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('../views/PrivacyView.vue'),
      meta: {
        // Verbatim from the registry's PAGES 'privacy' entry
        title: 'Privacy - Nothing Leaves Your Browser | DEVYANTRA',
        description: 'DevYantra runs entirely in your browser: no backend, no telemetry, no third-party requests. Verify it yourself in devtools.',
        canonical: '/privacy'
      }
    },
    // 404 page for unmatched routes
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: {
        title: 'Page Not Found | DEVYANTRA',
        description: 'The page you are looking for does not exist.',
        canonical: '/404'
      }
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

// Helper to update or create a meta tag
function updateMeta(attribute: string, name: string, content: string) {
  let tag = document.querySelector(`meta[${attribute}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

// Global navigation guard for SEO meta updates
router.beforeEach((to) => {
  const title = to.meta?.title as string | undefined
  const description = to.meta?.description as string | undefined
  const canonical = to.meta?.canonical as string | undefined

  // Update document title
  if (title) {
    document.title = title
  }

  // Update meta description
  if (description) {
    updateMeta('name', 'description', description)
  }

  // Update canonical link
  if (canonical) {
    let link = document.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', `${window.location.origin}${canonical}`)
  }

  // Update Open Graph tags
  if (title) {
    updateMeta('property', 'og:title', title)
  }
  if (description) {
    updateMeta('property', 'og:description', description)
  }
  if (canonical) {
    updateMeta('property', 'og:url', `${window.location.origin}${canonical}`)
  }

  // Update Twitter Card tags
  if (title) {
    updateMeta('name', 'twitter:title', title)
  }
  if (description) {
    updateMeta('name', 'twitter:description', description)
  }

  // Ensure robots meta is present
  updateMeta('name', 'robots', 'index,follow,max-snippet:-1,max-image-preview:large')
})

export default router
