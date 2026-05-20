<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <nav class="bg-white dark:bg-gray-900 shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Title row -->
      <div class="flex justify-between items-center py-3">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          Сисема информационой поддержки выбора стека технологий (СИПВТС)
        </h1>
        <div class="hidden sm:flex sm:items-center">
          <UColorModeButton />
        </div>
        <div class="-mr-2 flex items-center sm:hidden">
          <UButton
            variant="ghost"
            size="sm"
            icon="i-lucide-menu"
            @click="mobileMenuOpen = !mobileMenuOpen"
          />
        </div>
      </div>
      <!-- Nav links row -->
      <div class="hidden sm:flex sm:space-x-8 border-t border-gray-200 dark:border-gray-700">
        <NuxtLink
          to="/analytics"
          class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white px-1 py-2 border-b-2 text-sm font-medium"
          active-class="border-indigo-500 text-gray-900 dark:text-gray-100"
        >
          Аналитика
        </NuxtLink>
        <NuxtLink
          to="/ahp"
          class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white px-1 py-2 border-b-2 text-sm font-medium"
          active-class="border-indigo-500 text-gray-900 dark:text-gray-100"
        >
          МАИ
        </NuxtLink>
        <NuxtLink
          to="/stack"
          class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white px-1 py-2 border-b-2 text-sm font-medium"
          active-class="border-indigo-500 text-gray-900 dark:text-gray-100"
        >
          Поиск стека
        </NuxtLink>
      </div>
    </div>

    <div
      v-if="mobileMenuOpen"
      class="sm:hidden"
    >
      <div class="pt-2 pb-3 space-y-1">
        <NuxtLink
          to="/analytics"
          class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
          active-class="border-indigo-500 text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900"
          @click="mobileMenuOpen = false"
        >
          Аналитика
        </NuxtLink>
        <NuxtLink
          to="/ahp"
          class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
          active-class="border-indigo-500 text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900"
          @click="mobileMenuOpen = false"
        >
          МАИ
        </NuxtLink>
        <NuxtLink
          to="/stack"
          class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
          active-class="border-indigo-500 text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900"
          @click="mobileMenuOpen = false"
        >
          Поиск стека
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'

const mobileMenuOpen = ref(false)
</script>
