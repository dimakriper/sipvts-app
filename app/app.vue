<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'ru'
  }
})

useSeoMeta({
  title: 'SIPVTS',
  description: 'SIPVTS — система анализа и мониторинга репозиториев'
})
</script>

<template>
  <UApp>
    <UMain>
      <Navbar />
      <NuxtPage />
    </UMain>
  </UApp>
</template>
