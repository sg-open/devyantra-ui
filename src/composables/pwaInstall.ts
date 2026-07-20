import type { InjectionKey, Ref } from 'vue'

// Typed provide/inject contract for the PWA install prompt (spec D4).
// App.vue provides this; AppFooter.vue's "Install app" button consumes it.
// A Symbol key (vs. the previous 'pwa-install' string) prevents accidental
// collisions with other provide/inject keys and gives both sides compile-time
// checking of the shape below.
export interface PwaInstall {
  available: Ref<boolean>
  prompt: () => void
}

export const PWA_INSTALL_KEY: InjectionKey<PwaInstall> = Symbol('pwa-install')
