import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'
import './styles/pokemon-types.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registrado', reg);

            // Si la app se abre con ?clearCache=1 solicitar al SW que borre caches (útil en desarrollo)
            if (window.location.search.includes('clearCache=1')) {
                try {
                    const readyReg = await navigator.serviceWorker.ready;
                    if (readyReg && readyReg.active) {
                        readyReg.active.postMessage({ action: 'clearCaches' });
                        console.log('Solicitud enviada al SW para borrar caches');
                    }
                } catch (e) {
                    console.error('Error solicitando clearCaches al SW:', e);
                }
            }
        } catch (err) {
            console.error('Error registrando Service Worker:', err);
        }
    });
}

// Manejo de sync manual para navegadores sin Background Sync y al recuperar red
window.addEventListener('online', async () => {
    console.log('¡Conexión recuperada! Sincronizando datos...');
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.ready;
            if (reg.sync) {
                await reg.sync.register('sync-requests');
            } else {
                // Fallback: enviar mensaje al SW para que procese ahora
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ action: 'processQueue' });
                }
            }
        } catch (e) {
            console.error('Error al intentar sincronizar:', e);
        }
    }
});