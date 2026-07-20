import 'primeicons/primeicons.css'
import './assets/theme.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'

import App from './App.vue'
import router from './router'

import { tooltip } from './directives/tooltip'
import { useToast } from './composables/useToast'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.directive('tooltip', tooltip)

app.mount('#app')

// Service worker only in production builds — `vite dev` has no precache
// manifest to serve from, so registering there would just be dead weight.
if (!import.meta.env.DEV) {
  registerSW({
    onOfflineReady() {
      useToast().add({
        severity: 'success',
        summary: 'DevYantra works offline now',
        life: 4000,
      })
    },
  })
}
