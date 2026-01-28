<template>
  <div class="profile-card" :class="{ 'editing': isEditing }">
    <div class="profile-header">
      <div class="profile-avatar">
        {{ authStore.user?.username?.[0]?.toUpperCase() || "U" }}
      </div>
      <div class="profile-info">
        <h3>{{ authStore.user?.username }}</h3>
        <p>{{ authStore.user?.email }}</p>
        <p class="joined-date">Miembro desde 2026</p>
      </div>
    </div>

    <div v-if="!isEditing" class="profile-stats">
      <div class="stat">
        <span class="stat-value">{{ favoriteCount }}</span>
        <span class="stat-label">Favoritos</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ teamCount }}</span>
        <span class="stat-label">Equipos</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ friendCount }}</span>
        <span class="stat-label">Amigos</span>
      </div>
    </div>

    <div v-if="!isEditing" class="profile-actions">
      <button @click="isEditing = true" class="btn btn-edit">
        Editar Perfil
      </button>
      <button @click="logout" class="btn btn-logout">
        Cerrar Sesión
      </button>
    </div>

    <div v-else class="profile-edit">
      <div class="edit-group">
        <label>Nombre de Usuario</label>
        <input v-model="editForm.username" type="text" />
      </div>
      <div class="edit-group">
        <label>Email</label>
        <input v-model="editForm.email" type="email" />
      </div>
      <p v-if="editError" class="error">{{ editError }}</p>
      <div class="edit-actions">
        <button @click="saveProfile" :disabled="editLoading" class="btn btn-save">
          {{ editLoading ? "Guardando..." : "Guardar" }}
        </button>
        <button @click="cancelEdit" class="btn btn-cancel">
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore.js";
import { useUserStore } from "../stores/userStore.js";

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();

const isEditing = ref(false);
const editLoading = ref(false);
const editError = ref("");

const editForm = ref({
  username: authStore.user?.username || "",
  email: authStore.user?.email || "",
});

const favoriteCount = computed(() => userStore.favorites.length);
const teamCount = computed(() => userStore.teams.length);
const friendCount = computed(() => userStore.friends.length);

function saveProfile() {
  editLoading.value = true;
  editError.value = "";

  try {
    // Por ahora es simulado - en producción hacer llamada al backend
    authStore.setUser({
      ...authStore.user,
      username: editForm.value.username,
      email: editForm.value.email,
    });
    isEditing.value = false;
  } catch (err) {
    editError.value = "Error al guardar el perfil";
  } finally {
    editLoading.value = false;
  }
}

function cancelEdit() {
  isEditing.value = false;
  editError.value = "";
  editForm.value = {
    username: authStore.user?.username || "",
    email: authStore.user?.email || "",
  };
}

async function logout() {
  authStore.logout();
  router.push("/auth");
}
</script>

<style scoped>
.profile-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.profile-card:hover {
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6c5ce7 0%, #5f3dc4 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  flex-shrink: 0;
}

.profile-info h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.profile-info p {
  margin: 0.3rem 0;
  color: #666;
  font-size: 0.9rem;
}

.joined-date {
  color: #999 !important;
  font-size: 0.85rem !important;
  margin-top: 0.5rem !important;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem 0;
}

.stat {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  transition: background 0.3s ease;
}

.stat:hover {
  background: #f0f0f0;
}

.stat-value {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
  color: #6c5ce7;
  margin-bottom: 0.5rem;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  font-weight: 600;
}

.profile-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit {
  background: linear-gradient(135deg, #6c5ce7 0%, #5f3dc4 100%);
  color: white;
}

.btn-edit:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(108, 92, 231, 0.3);
}

.btn-logout {
  background: #f0f0f0;
  color: #e74c3c;
  border: 1px solid #e0e0e0;
}

.btn-logout:hover {
  background: #fff5f5;
  border-color: #e74c3c;
}

.profile-edit {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 10px;
}

.edit-group {
  margin-bottom: 1.2rem;
}

.edit-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.9rem;
}

.edit-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.edit-group input:focus {
  outline: none;
  border-color: #6c5ce7;
}

.error {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  background: #fadbd8;
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 4px solid #e74c3c;
}

.edit-actions {
  display: flex;
  gap: 1rem;
}

.btn-save {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(39, 174, 96, 0.3);
}

.btn-cancel {
  background: #e0e0e0;
  color: #666;
}

.btn-cancel:hover {
  background: #d0d0d0;
}

@media (max-width: 768px) {
  .profile-card {
    padding: 1.5rem;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .profile-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
