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
		} catch (err) {
			console.error('Error registrando Service Worker:', err);
		}
	});
}
