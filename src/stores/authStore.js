import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '../services/api.js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null);
  const token = ref(localStorage.getItem('token') || null);
  const isAuthenticated = computed(() => !!token.value);

  function setUser(userData) {
    user.value = userData;
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  }

  function setToken(newToken) {
    token.value = newToken;
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  }

  async function register(email, password, username) {
    try {
      const response = await authService.register(email, password, username);
      setToken(response.data.token);
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Error en registro';
    }
  }

  async function login(email, password) {
    try {
      const response = await authService.login(email, password);
      setToken(response.data.token);
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Error en login';
    }
  }

  async function loadProfile() {
    try {
      const response = await authService.getProfile();
      setUser(response.data);
      return response.data;
    } catch (error) {
      logout();
      throw error;
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
  }

  return {
    user,
    token,
    isAuthenticated,
    register,
    login,
    logout,
    loadProfile,
    setToken,
    setUser
  };
});
