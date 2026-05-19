<template>
  <nav class="bg-white dark:bg-gray-900 shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="shrink-0 flex items-center">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">SIPVTS</h1>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <NuxtLink
              to="/"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white px-1 pt-1 border-b-2 text-sm font-medium"
              active-class="border-indigo-500 text-gray-900 dark:text-gray-100"
            >
              Dashboard
            </NuxtLink>
            <NuxtLink
              to="/cameras"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white px-1 pt-1 border-b-2 text-sm font-medium"
              active-class="border-indigo-500 text-gray-900 dark:text-gray-100"
            >
              Cameras
            </NuxtLink>
            <NuxtLink
              to="/reports"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white px-1 pt-1 border-b-2 text-sm font-medium"
              active-class="border-indigo-500 text-gray-900 dark:text-gray-100"
            >
              Reports
            </NuxtLink>
            <NuxtLink
              to="/settings"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white px-1 pt-1 border-b-2 text-sm font-medium"
              active-class="border-indigo-500 text-gray-900 dark:text-gray-100"
            >
              Settings
            </NuxtLink>
            <NuxtLink
              to="/ahp"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white px-1 pt-1 border-b-2 text-sm font-medium"
              active-class="border-indigo-500 text-gray-900 dark:text-gray-100"
            >
              AHP
            </NuxtLink>
            <NuxtLink
              to="/analytics"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white px-1 pt-1 border-b-2 text-sm font-medium"
              active-class="border-indigo-500 text-gray-900 dark:text-gray-100"
            >
              Analytics
            </NuxtLink>
          </div>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:items-center">
          <UColorModeButton />
        </div>
        <!-- Mobile menu button -->
        <div class="-mr-2 flex items-center sm:hidden">
          <UButton
            variant="ghost"
            size="sm"
            icon="i-lucide-menu"
            @click="mobileMenuOpen = !mobileMenuOpen"
          />
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <div v-if="mobileMenuOpen" class="sm:hidden">
      <div class="pt-2 pb-3 space-y-1">
        <NuxtLink
          to="/"
          class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
          active-class="border-indigo-500 text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900"
          @click="mobileMenuOpen = false"
        >
          Dashboard
        </NuxtLink>
        <NuxtLink
          to="/cameras"
          class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
          active-class="border-indigo-500 text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900"
          @click="mobileMenuOpen = false"
        >
          Cameras
        </NuxtLink>
        <NuxtLink
          to="/reports"
          class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
          active-class="border-indigo-500 text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900"
          @click="mobileMenuOpen = false"
        >
          Reports
        </NuxtLink>
        <NuxtLink
          to="/settings"
          class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
          active-class="border-indigo-500 text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900"
          @click="mobileMenuOpen = false"
        >
          Settings
        </NuxtLink>
        <NuxtLink
          to="/ahp"
          class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
          active-class="border-indigo-500 text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900"
          @click="mobileMenuOpen = false"
        >
          AHP
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'

const mobileMenuOpen = ref(false)
</script>