import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin(({ $pinia }) => {
  if (process.client && $pinia) {
    $pinia.use(piniaPluginPersistedstate)
  }
})
