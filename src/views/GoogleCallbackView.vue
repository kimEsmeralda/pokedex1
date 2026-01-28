<template>
  <div class="callback-container">
    <div class="callback-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Completando autenticación con Google...</p>
      </div>
      <div v-else-if="error" class="error-state">
        <p class="error-message">❌ {{ error }}</p>
        <p class="error-hint">{{ errorHint }}</p>
        <router-link to="/auth" class="btn-back">Volver a Login</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore.js";
import axios from "axios";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(true);
const error = ref("");
const errorHint = ref("");

onMounted(async () => {
  try {
    // Obtener el código de autorización de Google
    const code = route.query.code;
    const state = route.query.state;

    if (!code) {
      error.value = "No se recibió código de autorización";
      errorHint.value = "Por favor, intenta de nuevo";
      loading.value = false;
      return;
    }

    // Intercambiar el código por datos del usuario con Google
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: "122299609516-pefe84l76va528d1th2l47gk8nqk0g4.apps.googleusercontent.com",
        client_secret: process.env.VITE_GOOGLE_CLIENT_SECRET || "GOOGLE_CLIENT_SECRET",
        redirect_uri: `${window.location.origin}/auth/google/callback`,
        grant_type: "authorization_code"
      }
    );

    // Obtener información del usuario con el access token
    const userResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`
        }
      }
    );

    const googleUser = userResponse.data;

    // Enviar información al backend para crear/actualizar usuario
    const backendResponse = await axios.post(
      "http://localhost:3000/api/auth/google",
      {
        googleId: googleUser.id,
        email: googleUser.email,
        username: googleUser.name,
        picture: googleUser.picture
      }
    );

    // Guardar token y usuario en store
    authStore.setToken(backendResponse.data.token);
    authStore.setUser(backendResponse.data.user);

    // Redirigir a Pokédex
    router.push("/pokedex");
  } catch (err) {
    console.error("Error en OAuth callback:", err);
    error.value = err.response?.data?.error || "Error al autenticar con Google";
    errorHint.value = err.message || "Por favor, intenta de nuevo";
    loading.value = false;
  }
});
</script>

<style scoped>
.callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.callback-card {
  background: white;
  padding: 3rem;
  border-radius: 15px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  width: 100%;
  max-width: 400px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e0e0e0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  color: #666;
  font-weight: 600;
  font-size: 1.1rem;
}

.error-state {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.error-message {
  color: #e74c3c;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.error-hint {
  color: #999;
  font-size: 0.95rem;
  margin: 0;
}

.btn-back {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.8rem 1.5rem;
  background: #667eea;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: #764ba2;
  transform: translateY(-2px);
}
</style>
