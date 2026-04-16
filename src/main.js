import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'
import './styles/pokemon-types.css'
import { useUserStore } from './stores/userStore.js'

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
    
    // 1. Alert the User that they are back online
    
    // 2. Trigger the sync process
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.ready;
            
            // Also notify the active worker directly to process the queue always on online event.
            // This is safer since Background Sync sometimes delays for minutes on mobile.
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ action: 'processQueue' });
            }
            
            if (reg.sync) {
                await reg.sync.register('sync-requests').catch(e => console.log('Sync err:', e));
            }
        } catch (e) {
            console.error('Error al intentar sincronizar:', e);
        }
    }
});

// Escuchar mensajes del Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.action === 'queueProcessed') {
            console.log(`Se sincronizaron ${event.data.count} elementos.`);
            // Si quieres que el estado de los favoritos se actualice dinámicamente cuando vuelve la luz
            try {
                const userStore = useUserStore();
                userStore.fetchFavorites();
                userStore.fetchTeams();
            } catch (e) {
                console.error('Error actualizando estado post-sync:', e);
            }
        }
    });
}