<template>
  <Base64Tools />
</template>

<script setup lang="ts">
import Base64Tools from '@/components/Base64Tools.vue'
import { onMounted } from 'vue'
import { useSEO } from '@/composables/useSEO'
import { getToolSEO } from '@/config/seo'

const { setMetaTags, addToolSchema, addBreadcrumbSchema, addFAQSchema, addHowToSchema } = useSEO()

onMounted(() => {
  const seo = getToolSEO('base64-tools')
  if (seo) {
    setMetaTags({
      title: seo.title,
      description: seo.description,
      canonical: seo.canonical,
      ogType: seo.type
    })
    addToolSchema({
      name: seo.tool.name,
      description: seo.tool.description,
      url: `${window.location.origin}${seo.canonical}`,
      category: seo.tool.category,
      features: seo.tool.features,
      toolKey: 'base64-tools'
    })
    addBreadcrumbSchema(seo.breadcrumb)
    addFAQSchema(seo.faqs)
    if (seo.howToSteps?.length) {
      addHowToSchema({
        name: `How to Use ${seo.tool.name}`,
        description: seo.tool.description,
        steps: seo.howToSteps,
        toolKey: 'base64-tools'
      })
    }
  }
})
</script>
