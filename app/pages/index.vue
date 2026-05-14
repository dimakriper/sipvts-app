<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
    <p class="text-gray-600 dark:text-gray-300 mb-8">Welcome to the SIPVTS Traffic Monitoring System.</p>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-2">Active Cameras</h3>
        <p class="text-2xl font-bold text-blue-600">24</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-2">Total Vehicles Today</h3>
        <p class="text-2xl font-bold text-green-600">1,247</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-2">Alerts</h3>
        <p class="text-2xl font-bold text-red-600">3</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-2">System Status</h3>
        <p class="text-2xl font-bold text-green-600">Online</p>
      </div>
    </div>
  </div>
</template>
