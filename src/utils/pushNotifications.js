import { notificationsService } from '../services/api.js';

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

export async function requestPushPermissionAndSubscribe() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push API no soportada');
    return;
  }

  let permission = Notification.permission;
  
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    console.warn('Permiso de notificación no otorgado.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Obtener la suscripción actual o crear una nueva
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      if (!PUBLIC_VAPID_KEY) {
        console.error('VITE_VAPID_PUBLIC_KEY no encontrada en variables de entorno');
        return;
      }
      
      const applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    // Enviar suscripción al backend
    await notificationsService.subscribe(subscription);
    console.log('Suscripción Push enviada al servidor exitosamente');
  } catch (error) {
    console.error('Error suscribiendo a push:', error);
  }
}