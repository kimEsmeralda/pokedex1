import axios from 'axios';
import { saveRequest } from '../utils/offlineQueue.js';

const API_URL = import.meta.env.VITE_API_URL;

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
    api.post('/friends/battles/start', { friendId, team1Id, team2Id }),
  getBattleHistory: () =>
    api.get('/friends/battles/history')
};

// Pokemon (PokéAPI)
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

export default api;

// Interceptor para capturar fallos de red en peticiones no-GET y encolarlas
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Sólo manejar si no hay config o es un error de red
    const config = error.config;
    const isNetworkError = !navigator.onLine || error.message === 'Network Error' || error.code === 'ERR_NETWORK';
    if (config && isNetworkError) {
      const method = (config.method || '').toLowerCase();
      if (['post', 'put', 'delete', 'patch'].includes(method)) {
        try {
          // Construir URL absoluta si es necesario
          let fullUrl = config.url;
          try {
            fullUrl = new URL(config.url, config.baseURL || API_URL).toString();
          } catch (e) {
            // keep config.url
          }

          // Normalizar headers a objeto simple
          let headers = {};
          if (config.headers) {
            if (typeof config.headers.forEach === 'function') {
              config.headers.forEach((v, k) => { headers[k] = v; });
            } else if (typeof config.headers === 'object') {
              headers = { ...config.headers };
            }
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
