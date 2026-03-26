<template>
  <div id="app-container">
    <RouterView />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/authStore'
import { requestPushPermissionAndSubscribe } from './utils/pushNotifications'

const authStore = useAuthStore()

onMounted(() => {
  // If user is already authenticated, attempt push subscription
  // You might want to ask via a deliberate UI button otherwise
  if (authStore.isAuthenticated) {
    requestPushPermissionAndSubscribe()
  }
})
</script>

<style scoped>
#app-container {
  width: 100%;
  min-height: 100vh;
}
</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f5f5f5;
}
</style>
