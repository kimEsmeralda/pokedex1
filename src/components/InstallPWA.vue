<template>
  <button v-if="visible" @click="install" class="install-pwa">Instalar PWA</button>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const visible = ref(false)
let deferredPrompt = null

function onBeforeInstallPrompt(e) {
  e.preventDefault()
  deferredPrompt = e
  visible.value = true
}

async function install() {
  if (!deferredPrompt) return
  try {
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    // choice.outcome === 'accepted' || 'dismissed'
    deferredPrompt = null
    visible.value = false
    // opcional: emitir evento global o mostrar notificación
  } catch (err) {
    console.error('Error al mostrar prompt de instalación:', err)
  }
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
})
</script>

<style scoped>
.install-pwa {
  background: #ef5350;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
