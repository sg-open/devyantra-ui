import type { Directive, DirectiveBinding } from 'vue'

function update(el: HTMLElement, binding: DirectiveBinding) {
  const text = typeof binding.value === 'string' ? binding.value : ''
  if (!text) {
    el.removeAttribute('data-tooltip')
    el.removeAttribute('data-tooltip-pos')
    return
  }

  el.setAttribute('data-tooltip', text)

  // Position from modifiers: v-tooltip.bottom, v-tooltip.left, v-tooltip.right
  // Default is top
  const pos = binding.modifiers.bottom
    ? 'bottom'
    : binding.modifiers.left
      ? 'left'
      : binding.modifiers.right
        ? 'right'
        : 'top'
  el.setAttribute('data-tooltip-pos', pos)
}

export const tooltip: Directive = {
  mounted: update,
  updated: update,
  beforeUnmount(el: HTMLElement) {
    el.removeAttribute('data-tooltip')
    el.removeAttribute('data-tooltip-pos')
  }
}
