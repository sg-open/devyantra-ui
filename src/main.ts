import 'primeicons/primeicons.css'
import './assets/theme.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { tooltip } from './directives/tooltip'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.directive('tooltip', tooltip)

app.mount('#app')
