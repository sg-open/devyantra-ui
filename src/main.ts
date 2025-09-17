import './assets/theme.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'

import App from './App.vue'
import router from './router'

// PrimeVue Components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Card from 'primevue/card'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Badge from 'primevue/badge'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Divider from 'primevue/divider'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import Toolbar from 'primevue/toolbar'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'

// Enhanced Aura preset with comprehensive design tokens
const DevyantraPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    colorScheme: {
      light: {
        surface: {
          0: '#FFFFFF',
          50: '#F7F7FA',
          100: '#F0F2F6',
          200: '#E6E9F0',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#14161D',
          950: '#0F1419'
        },
        primary: {
          color: '#3b82f6',
          contrastColor: '#ffffff'
        }
      },
      dark: {
        surface: {
          0: '#0F1419',
          50: '#1A1F2B',
          100: '#252B39',
          200: '#2D3748',
          300: '#374151',
          400: '#4B5563',
          500: '#6B7280',
          600: '#9CA3AF',
          700: '#D1D5DB',
          800: '#E5E7EB',
          900: '#F7FAFC',
          950: '#FFFFFF'
        },
        primary: {
          color: '#60a5fa',
          contrastColor: '#ffffff'
        }
      }
    }
  },
  components: {
    button: {
      // Size variants - aligned to 8px baseline grid
      sm: {
        height: '32px',
        paddingX: '12px',
        paddingY: '8px',
        fontSize: '14px',
        fontWeight: '500',
        iconSize: '18px',
        gap: '8px',
        borderRadius: '10px'
      },
      md: {
        height: '40px',
        paddingX: '16px',
        paddingY: '10px',
        fontSize: '16px',
        fontWeight: '600',
        iconSize: '20px',
        gap: '8px',
        borderRadius: '10px'
      },
      lg: {
        height: '48px',
        paddingX: '20px',
        paddingY: '12px',
        fontSize: '18px',
        fontWeight: '600',
        iconSize: '20px',
        gap: '10px',
        borderRadius: '10px'
      },
      // Base button properties
      borderRadius: '10px',
      fontWeight: '600',
      lineHeight: '1',
      letterSpacing: '0',
      transition: '180ms cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      // Perfect text centering
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      verticalAlign: 'middle',
      // Unified focus ring system
      focusRing: {
        width: '2px',
        style: 'solid',
        color: '{primary.color}',
        offset: '1px',
        shadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
      },
      // Disabled state
      disabledBackground: '{surface.200}',
      disabledBorderColor: '{surface.200}',
      disabledColor: '{surface.500}',
      // Primary variant (solid brand)
      solid: {
        primary: {
          background: '{primary.color}',
          hoverBackground: '{primary.600}',
          activeBackground: '{primary.700}',
          borderColor: 'transparent',
          hoverBorderColor: 'transparent',
          activeBorderColor: 'transparent',
          color: '#ffffff',
          hoverColor: '#ffffff',
          activeColor: '#ffffff',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          hoverBoxShadow: '0 2px 6px 0 rgba(0, 0, 0, 0.12)',
          activeBoxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.08)',
          focusRing: {
            color: '{primary.color}',
            shadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
          }
        }
      },
      // Secondary variant (neutral glass)
      outlined: {
        primary: {
          background: 'transparent',
          hoverBackground: 'rgba(var(--surface-50-rgb), 0.8)',
          activeBackground: 'rgba(var(--surface-100-rgb), 0.9)',
          borderColor: 'rgba(var(--surface-300-rgb), 0.6)',
          hoverBorderColor: 'rgba(var(--surface-400-rgb), 0.8)',
          activeBorderColor: 'rgba(var(--surface-500-rgb), 0.9)',
          color: '{surface.700}',
          hoverColor: '{surface.800}',
          activeColor: '{surface.900}',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          hoverBoxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
          activeBoxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }
      },
      // Ghost variant (minimal)
      text: {
        primary: {
          background: 'transparent',
          hoverBackground: 'rgba(var(--surface-100-rgb), 0.6)',
          activeBackground: 'rgba(var(--surface-200-rgb), 0.7)',
          borderColor: 'transparent',
          hoverBorderColor: 'transparent',
          activeBorderColor: 'transparent',
          color: '{surface.600}',
          hoverColor: '{surface.700}',
          activeColor: '{surface.800}',
          boxShadow: 'none',
          hoverBoxShadow: 'none',
          activeBoxShadow: 'none'
        }
      }
    },
    inputtext: {
      paddingX: '12px',
      paddingY: '10px',
      borderRadius: '10px',
      fontSize: '14px',
      focusRing: {
        width: '2px',
        style: 'solid',
        color: '{primary.color}',
        offset: '1px',
        shadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.12)'
      },
      placeholderColor: '{surface.400}'
    },
    textarea: {
      paddingX: '12px',
      paddingY: '12px',
      borderRadius: '10px',
      fontSize: '14px',
      focusRing: {
        width: '2px',
        style: 'solid',
        color: '{primary.color}',
        offset: '1px',
        shadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.12)'
      },
      placeholderColor: '{surface.400}'
    },
    card: {
      borderRadius: '12px',
      body: {
        padding: '24px'
      }
    },
    tooltip: {
      background: {
        colorScheme: {
          light: '#2D3748',  // Dark background for light mode
          dark: '#FFFFFF'    // Light background for dark mode
        }
      },
      color: {
        colorScheme: {
          light: '#F7FAFC',  // Light text for light mode
          dark: '#14161D'    // Dark text for dark mode
        }
      },
      borderColor: {
        colorScheme: {
          light: '#4A5568',
          dark: '#E6E9F0'
        }
      }
    }
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: DevyantraPreset,
    options: {
      prefix: 'p',
      darkModeSelector: '.app-dark',
      cssLayer: false
    }
  }
})
app.use(ToastService)
app.directive('tooltip', Tooltip)

// Register PrimeVue components globally
// eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
app.component('Button', Button)
app.component('InputText', InputText)
// eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
app.component('Textarea', Textarea)
// eslint-disable-next-line vue/multi-word-component-names
app.component('Card', Card)
app.component('TabView', TabView)
app.component('TabPanel', TabPanel)
// eslint-disable-next-line vue/multi-word-component-names
app.component('Badge', Badge)
// eslint-disable-next-line vue/multi-word-component-names
app.component('Message', Message)
app.component('ProgressSpinner', ProgressSpinner)
// eslint-disable-next-line vue/multi-word-component-names
app.component('Divider', Divider)
// eslint-disable-next-line vue/multi-word-component-names
app.component('Tag', Tag)
app.component('ToggleSwitch', ToggleSwitch)
// eslint-disable-next-line vue/multi-word-component-names
app.component('Toolbar', Toolbar)
// eslint-disable-next-line vue/multi-word-component-names
app.component('Toast', Toast)

app.mount('#app')
