import axios from 'axios';
import { saveRequest } from '../utils/offlineQueue.js';

// Usamos la variable de entorno y como respaldo la URL de producciÃ³n directamente
let rawApiUrl = (import.meta.env.VITE_API_URL || 'https://be-production-1e0f.up.railway.app/api').trim();
if (rawApiUrl.endsWith('/')) {
  rawApiUrl = rawApiUrl.slice(0, -1);
}
if (!rawApiUrl.endsWith('/api')) {
  // Solo se agrega si el usuario no lo puso en la variable de entorno
  rawApiUrl += '/api';
}
const API_URL = rawApiUrl;

const api = axios.create({
  baseURL: API_URL
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authService = {
  register: (email, password, username) =>
    api.post('/auth/register', { email, password, username }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  getProfile: () =>
    api.get('/auth/profile')
};

// Favorites
export const favoritesService = {
  add: (pokemonId, pokemonName) =>
    api.post('/favorites', { pokemonId, pokemonName }),
  remove: (pokemonId) =>
    api.delete(`/favorites/${pokemonId}`),
  getAll: () =>
    api.get('/favorites'),
  check: (pokemonId) =>
    api.get(`/favorites/${pokemonId}/check`)
};

// Teams
export const teamsService = {
  create: (name, description) =>
    api.post('/teams', { name, description }),
  getAll: () =>
    api.get('/teams'),
  getOne: (teamId) =>
    api.get(`/teams/${teamId}`),
  addPokemon: (teamId, pokemonId, pokemonName) =>
    api.post(`/teams/${teamId}/pokemon`, { pokemonId, pokemonName }),
  removePokemon: (teamId, pokemonTeamId) =>
    api.delete(`/teams/${teamId}/pokemon/${pokemonTeamId}`),
  delete: (teamId) =>
    api.delete(`/teams/${teamId}`)
};

// Friends
export const friendsService = {
  generateCode: () =>
    api.post('/friends/code/generate'),
  addByCode: (friendCode) =>
    api.post('/friends/add', { friendCode }),
  getAll: () =>
    api.get('/friends'),
  startBattle: (friendId, team1Id, team2Id) =>
    api.post('/friends/battles/start', { friendId, userTeamId: team1Id, friendTeamId: team2Id }),
  calculateBattleResult: (battleId, winnerId) =>
    api.post('/friends/battles/result', { battleId, winnerId }),
  getBattle: (battleId) =>
    api.get('/friends/battles/' + battleId),
  getBattleHistory: () =>
    api.get('/friends/battles/history')
};

// Pokemon (PokÃ©API)
export const pokemonService = {
  getList: (limit = 50, offset = 0) =>
    api.get('/pokemon', { params: { limit, offset } }),
  getDetails: (id) =>
    api.get(`/pokemon/${id}`),
  getByType: (type) =>
    api.get(`/pokemon/type/${type}`),
  getByRegion: (region) =>
    api.get(`/pokemon/region/${region}`)
};

// Notifications
export const notificationsService = {
  subscribe: (subscription) => 
    api.post('/notifications/subscribe', subscription)
};

export default api;

// Interceptor para capturar fallos de red en peticiones no-GET y encolarlas
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Manejo global de 401: limpiar token/localStorage y redirigir a login
    if (error.response && error.response.status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {}
      // Intentar redirigir al login para que el usuario vuelva a autenticarse
      if (typeof window !== 'undefined') {
        try {
          window.location.href = '/auth';
        } catch (e) {}
      }
      return Promise.reject(error);
    }
    // SÃ³lo manejar si no hay config o es un error de red
    const config = error.config;
    const isNetworkError = !navigator.onLine || error.message === 'Network Error' || error.code === 'ERR_NETWORK';
    if (config && isNetworkError) {
          const method = (config.method || '').toLowerCase();
      if (['post', 'put', 'delete', 'patch'].includes(method)) {
        try {
          // Asegurar que la URL sea absoluta y no tenga dobles slashes
          let fullUrl = '';
          try {
            fullUrl = api.getUri ? api.getUri(config) : config.url;
          } catch(e) {
            fullUrl = config.url || '';
          }
          if (!fullUrl.startsWith('http')) {
             let base = config.baseURL || API_URL || window.location.origin;
             if (base.endsWith('/')) base = base.slice(0, -1);
             let path = fullUrl;
             while(path.startsWith('/')) path = path.slice(1);
             fullUrl = base + '/' + path;
          }

                    // Normalizar headers a objeto simple
          let headers = {};
          if (config.headers) {
            if (typeof config.headers.toJSON === 'function') {
              headers = config.headers.toJSON();
            } else {
              Object.keys(config.headers).forEach(key => {
                headers[key] = config.headers[key];
              });
            }
          }
          
          if (!headers['Content-Type'] && !headers['content-type'] && config.data) {
            headers['Content-Type'] = 'application/json';
          }
          
          // Re-inject token as fallback if it didn't get serialized
          const token = localStorage.getItem('token');
          if (token && !headers['Authorization'] && !headers['authorization']) {
            headers['Authorization'] = 'Bearer ' + token;
          }

          const body = typeof config.data === 'string' ? config.data : JSON.stringify(config.data || {});

          await saveRequest({ url: fullUrl, method, headers, body });

          // Registrar sync si es posible
          if ('serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.ready;
              if (reg.sync) {
                await reg.sync.register('sync-requests');
              }
            } catch (e) {
              // ignore
            }
          }

          // Devolver una respuesta simulada para que la app pueda seguir
          return Promise.resolve({ data: { offlineQueued: true } });
        } catch (e) {
          // Fallthrough to reject
        }
      }
    }
    return Promise.reject(error);
  }
);
