<template>
  <div class="auth-container">
    <div class="auth-wrapper">
      <div class="brand-section">
        <h1 class="brand-title">🎮 PokéDex PWA</h1>
        <p class="brand-subtitle">Atrapa, colecciona y bate Pokémon en línea</p>
      </div>

      <div class="auth-card">
        <h2 v-if="isLogin" class="auth-title">Inicia Sesión</h2>
        <h2 v-else class="auth-title">Crear Cuenta</h2>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div v-if="!isLogin" class="form-group">
            <label for="username">Nombre de Usuario</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              placeholder="ej: MaestroPokemon"
              required
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <p v-if="error" class="error-message">{{ error }}</p>

          <button type="submit" :disabled="loading" class="btn-submit">
            {{ loading ? "Cargando..." : isLogin ? "Inicia Sesión" : "Registrarse" }}
          </button>
        </form>

        <div class="divider">
          <span>o continúa con</span>
        </div>

        <button @click="loginWithGoogle" :disabled="loading" class="btn-google">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6m0 0v6"></path>
          </svg>
          Google
        </button>

        <p class="toggle-auth">
          {{ isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?" }}
          <a href="#" @click.prevent="toggleAuthMode">
            {{ isLogin ? "Regístrate aquí" : "Inicia sesión" }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore.js";
import axios from "axios";

const router = useRouter();
const authStore = useAuthStore();

const isLogin = ref(true);
const loading = ref(false);
const error = ref("");

const form = ref({
  username: "",
  email: "",
  password: "",
});

function toggleAuthMode() {
  isLogin.value = !isLogin.value;
  error.value = "";
  form.value = { username: "", email: "", password: "" };
}

async function handleSubmit() {
  error.value = "";
  loading.value = true;

  try {
    if (isLogin.value) {
      await authStore.login(form.value.email, form.value.password);
    } else {
      await authStore.register(
        form.value.email,
        form.value.password,
        form.value.username
      );
    }
    router.push("/pokedex");
  } catch (err) {
    error.value = err;
  } finally {
    loading.value = false;
  }
}

async function loginWithGoogle() {
  loading.value = true;
  error.value = "";
  
  try {
    // Inicia el flujo de OAuth con Google
    const clientId = "YOUR_GOOGLE_CLIENT_ID"; // Reemplazar con tu Client ID
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.append("client_id", clientId);
    googleAuthUrl.searchParams.append("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.append("response_type", "code");
    googleAuthUrl.searchParams.append("scope", "openid email profile");
    googleAuthUrl.searchParams.append("access_type", "offline");
    googleAuthUrl.searchParams.append("prompt", "consent");
    
    // Redirigir a Google para autenticación
    window.location.href = googleAuthUrl.toString();
    
  } catch (err) {
    error.value = "Error al intentar login con Google. Usa registro normal.";
    console.error(err);
    loading.value = false;
  }
}

onMounted(() => {
  // Cargar Google Sign-In script
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
});
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 25%, #f79f1f 50%, #6c5ce7 75%, #00b894 100%);
  padding: 1rem;
}

.auth-wrapper {
  width: 100%;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.brand-section {
  text-align: center;
  color: white;
  animation: slideDown 0.6s ease-out;
}

.brand-title {
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0;
  text-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  letter-spacing: -1px;
}

.brand-subtitle {
  font-size: 1rem;
  margin: 0.5rem 0 0 0;
  opacity: 0.95;
  font-weight: 500;
}

.auth-card {
  background: white;
  padding: 2.5rem 2rem;
  border-radius: 15px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.6s ease-out;
}

.auth-title {
  text-align: center;
  color: #333;
  margin: 0 0 1.5rem 0;
  font-size: 1.8rem;
  font-weight: 700;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.2rem;
}

label {
  display: block;
  margin-bottom: 0.6rem;
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.95rem;
}

input {
  width: 100%;
  padding: 0.85rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

input:focus {
  outline: none;
  border-color: #6c5ce7;
  box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
}

input::placeholder {
  color: #b0bec5;
}

.btn-submit {
  width: 100%;
  padding: 0.95rem;
  background: linear-gradient(135deg, #6c5ce7 0%, #5f3dc4 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(108, 92, 231, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  margin: 1rem 0;
  font-size: 0.9rem;
  background: #fadbd8;
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 4px solid #e74c3c;
}

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  color: #999;
  font-size: 0.85rem;
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}

.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.95rem;
  background: white;
  color: #2c3e50;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-google:hover:not(:disabled) {
  border-color: #db4437;
  color: #db4437;
  background: #fafafa;
}

.btn-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-google svg {
  stroke-width: 2;
}

.toggle-auth {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  margin: 1.5rem 0 0 0;
}

.toggle-auth a {
  color: #6c5ce7;
  text-decoration: none;
  font-weight: 700;
  transition: color 0.3s ease;
}

.toggle-auth a:hover {
  color: #5f3dc4;
  text-decoration: underline;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 2rem 1.5rem;
  }

  .brand-title {
    font-size: 1.8rem;
  }

  .auth-title {
    font-size: 1.5rem;
  }
}
</style>
