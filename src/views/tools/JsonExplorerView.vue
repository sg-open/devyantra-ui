<template>
  <JsonExplorer />
</template>

<script setup lang="ts">
import JsonExplorer from '@/components/JsonExplorer.vue'
import { onMounted } from 'vue'
import { useSEO } from '@/composables/useSEO'
import { getToolSEO } from '@/config/seo'

const { setMetaTags, addToolSchema, addBreadcrumbSchema, addFAQSchema, addHowToSchema } = useSEO()

onMounted(() => {
  const seo = getToolSEO('json-explorer')
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
      toolKey: 'json-explorer'
    })
    addBreadcrumbSchema(seo.breadcrumb)
    addFAQSchema(seo.faqs)
    if (seo.howToSteps?.length) {
      addHowToSchema({
        name: `How to Use ${seo.tool.name}`,
        description: seo.tool.description,
        steps: seo.howToSteps,
        toolKey: 'json-explorer'
      })
    }
  }
})
</script>
