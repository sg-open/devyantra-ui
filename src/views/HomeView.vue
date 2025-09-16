<template>
  <div class="home-view">
    <!-- Elegant Tools Navigation -->
    <div class="elegant-navigation">
      <div class="nav-container">
        <div class="nav-tabs" role="tablist" aria-label="Developer tools navigation">
          <router-link
            v-for="(tool, index) in tools"
            :key="index"
            :to="tool.route"
            @keydown.arrow-right="navigateTab(index + 1)"
            @keydown.arrow-left="navigateTab(index - 1)"
            @keydown.home="navigateTab(0)"
            @keydown.end="navigateTab(tools.length - 1)"
            :class="['nav-tab', { active: $route.path === tool.route }]"
            :aria-selected="$route.path === tool.route"
            :aria-controls="`panel-${index}`"
            :id="`tab-${index}`"
            role="tab"
          >
            <div class="tab-content">
              <div class="tab-text">
                <span class="tab-title">{{ tool.title }}</span>
                <span class="tab-subtitle">{{ tool.subtitle }}</span>
              </div>
            </div>
            <div class="tab-glow"></div>
          </router-link>
        </div>
      </div>

      <!-- Active Tool Content -->
      <div class="tool-content">
        <router-view v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSEO } from '@/composables/useSEO'
import { SEO_CONFIG } from '@/config/seo'

const router = useRouter()

const { setMetaTags, addOrganizationSchema } = useSEO()

onMounted(() => {
  // Set homepage SEO
  setMetaTags({
    title: SEO_CONFIG.site.title,
    description: SEO_CONFIG.site.description,
    keywords: SEO_CONFIG.site.keywords,
    canonical: '/',
    ogTitle: SEO_CONFIG.site.title,
    ogDescription: SEO_CONFIG.site.description,
    ogType: 'website',
    ogImage: `${window.location.origin}/og-image.png`,
    twitterTitle: SEO_CONFIG.site.title,
    twitterDescription: SEO_CONFIG.site.description,
    twitterCard: 'summary_large_image',
    twitterImage: `${window.location.origin}/twitter-image.png`
  })

  // Add organization schema for homepage
  addOrganizationSchema()

  // If on home page, redirect to first tool
  if (router.currentRoute.value.path === '/') {
    router.push('/tools/text-compare')
  }
})

// Keyboard navigation for tabs
const navigateTab = (targetIndex: number) => {
  const maxIndex = tools.length - 1
  let newIndex = targetIndex
  if (targetIndex < 0) {
    newIndex = maxIndex
  } else if (targetIndex > maxIndex) {
    newIndex = 0
  }

  // Navigate to the tool route
  router.push(tools[newIndex].route)

  // Focus the newly active tab
  nextTick(() => {
    const activeTabElement = document.querySelector(`#tab-${newIndex}`) as HTMLElement
    activeTabElement?.focus()
  })
}

const tools = [
  {
    title: 'Text Compare',
    subtitle: 'Compare & Format',
    icon: 'pi pi-sync',
    route: '/tools/text-compare'
  },
  {
    title: 'Delimiter',
    subtitle: 'Split & Join',
    icon: 'pi pi-arrows-h',
    route: '/tools/delimiter'
  },
  {
    title: 'Code Formatter',
    subtitle: 'JSON, SQL & More',
    icon: 'pi pi-file-edit',
    route: '/tools/format-text'
  },
  {
    title: 'JWT Decoder',
    subtitle: 'Token Analysis',
    icon: 'pi pi-shield',
    route: '/tools/jwt-decoder'
  },
  {
    title: 'Hash Generator',
    subtitle: 'MD5, SHA1, SHA256',
    icon: 'pi pi-key',
    route: '/tools/hash-generator'
  },
  {
    title: 'Base64 Tools',
    subtitle: 'Encode & Decode',
    icon: 'pi pi-code',
    route: '/tools/base64-tools'
  },
  {
    title: 'Timestamp',
    subtitle: 'Unix & ISO Converter',
    icon: 'pi pi-calendar',
    route: '/tools/timestamp-converter'
  },
  {
    title: 'Character Count',
    subtitle: 'Text Analytics',
    icon: 'pi pi-hashtag',
    route: '/tools/character-count'
  }
]
</script>

<style scoped>
.home-view {
  width: 100%;
}


/* Baseline Grid Navigation */
.elegant-navigation {
  width: 100%;
  margin-bottom: var(--space-2xl); /* 32px = 4 baseline */
}

.nav-container {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-2xl); /* 16px = 2 baseline */
  padding: var(--space-lg); /* 16px = 2 baseline */
  backdrop-filter: blur(12px);
  margin-bottom: var(--space-2xl); /* 32px = 4 baseline */
  box-shadow: var(--elevation-1);
}

.nav-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-sm); /* 8px = 1 baseline */
}

.nav-tab {
  position: relative;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-lg); /* 10px - same as buttons */
  /* Standardized padding aligned to grid */
  padding: var(--space-md) var(--space-lg); /* 12px 16px */
  min-height: var(--button-height); /* 40px = 5 baseline - same as buttons */

  cursor: pointer;
  transition: all var(--transition-normal);
  overflow: hidden;
  backdrop-filter: blur(10px);
  text-decoration: none;

  /* Center content vertically */
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-tab:hover {
  border-color: var(--dt-brand);
  background: var(--dt-brand-light);
  transform: translateY(-1px);
  box-shadow: var(--elevation-1);
}

.nav-tab.active {
  background: var(--dt-brand);
  border-color: var(--dt-brand);
  color: white;
  box-shadow: var(--elevation-2);
  transform: translateY(-1px);
}

/* Focus state for accessibility */
.nav-tab:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.tab-content {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}


.tab-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-xs); /* 4px spacing between title and subtitle */
}

.tab-title {
  font-family: var(--font-sans);
  font-size: var(--text-sm); /* 14px - aligned to grid */
  font-weight: var(--font-weight-semibold); /* 600 */
  color: var(--dt-text-primary);
  line-height: 1; /* Tight line height for compact tabs */
  margin: 0;
  transition: color var(--transition-normal);
}

.nav-tab.active .tab-title {
  color: white;
  font-weight: var(--font-weight-semibold);
}

.tab-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-xs); /* 12px - aligned to grid */
  font-weight: var(--font-weight-medium); /* 500 */
  color: var(--dt-text-secondary);
  line-height: 1; /* Tight line height for compact tabs */
  letter-spacing: var(--letter-spacing-wide); /* 0.025em */
  text-transform: uppercase;
  margin: 0;
  transition: color var(--transition-normal);
}

.nav-tab.active .tab-subtitle {
  color: rgba(255, 255, 255, 0.9);
}

.nav-tab:hover .tab-title {
  color: var(--dt-brand);
}

.nav-tab:hover .tab-subtitle {
  color: var(--dt-brand);
}

.nav-tab.active:hover .tab-title,
.nav-tab.active:hover .tab-subtitle {
  color: white;
}

.tab-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--gradient-accent);
  opacity: 0;
  border-radius: 12px;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.nav-tab.active .tab-glow {
  opacity: 1;
}

/* Content Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.tool-content {
  min-height: 600px; /* 75 baseline = good minimum height */
  padding: var(--space-lg); /* 16px = 2 baseline */
  margin-top: var(--space-lg); /* 16px = 2 baseline */
}

@media (max-width: 768px) {

  .nav-tabs {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .nav-tab {
    padding: 0.7rem 0.75rem;
  }


  .tab-title {
    font-size: 0.8rem;
  }

  .tab-subtitle {
    font-size: 0.6rem;
  }
}
</style>
