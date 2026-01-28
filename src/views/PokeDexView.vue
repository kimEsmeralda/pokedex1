<template>
  <div class="pokedex-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="logo-section">
          <h1 class="logo">🎮 PokéDex PWA</h1>
        </div>
        <div class="header-search">
          <input
            v-model="searchName"
            type="text"
            placeholder="🔍 Buscar Pokémon..."
            class="global-search"
          />
        </div>
        <div class="user-section">
          <span class="username">{{ authStore.user?.username }}</span>
          <button @click="toggleProfileMenu" class="btn-profile">👤</button>
          <div v-if="showProfileMenu" class="profile-menu">
            <a href="#" @click.prevent="activeTab = 'profile'">Mi Perfil</a>
            <a href="#" @click.prevent="logout">Cerrar Sesión</a>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="main-content">
      <nav class="nav-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ active: activeTab === tab.id }"
          class="nav-tab"
        >
          {{ tab.icon }} {{ tab.label }}
          <span v-if="tab.count !== undefined" class="tab-badge">{{ tab.count }}</span>
        </button>
      </nav>

      <section class="content-section">
        <!-- Perfil -->
        <div v-if="activeTab === 'profile'" class="tab-content">
          <ProfileCard />
        </div>

        <!-- Pokédex Completa -->
        <div v-if="activeTab === 'pokedex'" class="tab-content">
          <div class="section-header">
            <h2>Pokédex ({{ pokemonStore.pokemonWithDetails.length }})</h2>
            <div class="filters-bar">
              <select v-model="filterType" class="filter-select">
                <option value="">Todos los tipos</option>
                <option v-for="type in types" :key="type" :value="type">
                  {{ type.charAt(0).toUpperCase() + type.slice(1) }}
                </option>
              </select>
            </div>
          </div>

          <div v-if="pokemonStore.loading" class="loading-state">
            <div class="spinner"></div>
            <p>Cargando Pokémon con detalles...</p>
          </div>

          <div v-else class="pokemon-grid">
            <div
              v-for="pokemon in filteredAndTypedPokemon"
              :key="pokemon.id"
              class="pokemon-card"
              @click="selectPokemon(pokemon)"
            >
              <div class="pokemon-image">
                <img
                  :src="pokemon.image || 'https://via.placeholder.com/150?text=' + pokemon.name"
                  :alt="pokemon.name"
                  loading="lazy"
                />
              </div>
              <h3 class="pokemon-name">{{ pokemon.name }}</h3>
              <div class="pokemon-types">
                <span
                  v-for="type in pokemon.types"
                  :key="type.name"
                  class="type-badge"
                  :class="'type-' + type.name"
                >
                  {{ type.name }}
                </span>
              </div>
              <p class="pokemon-stats">
                <strong>ATK:</strong> {{ pokemon.stats?.find(s => s.name === 'attack')?.base_stat || '-' }} |
                <strong>DEF:</strong> {{ pokemon.stats?.find(s => s.name === 'defense')?.base_stat || '-' }}
              </p>
              <button
                @click.stop="toggleFavorite(pokemon)"
                class="btn-fav"
                :class="{ active: isFavorite(pokemon) }"
                title="Agregar a favoritos"
              >
                {{ isFavorite(pokemon) ? "❤️" : "🤍" }}
              </button>
            </div>
          </div>
        </div>

        <!-- Favoritos -->
        <div v-if="activeTab === 'favorites'" class="tab-content">
          <div class="section-header">
            <h2>{{ userStore.favorites.length }} Pokémon Favoritos</h2>
          </div>

          <div v-if="userStore.favorites.length === 0" class="empty-state">
            <p>⭐ No tienes favoritos aún</p>
            <p class="empty-hint">Agrega Pokémon a favoritos desde la Pokédex</p>
          </div>

          <div v-else class="pokemon-grid">
            <div
              v-for="fav in userStore.favorites"
              :key="fav.id"
              class="pokemon-card"
            >
              <div class="pokemon-image">
                <img
                  :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${fav.pokemonId}.png`"
                  :alt="fav.pokemonName"
                  loading="lazy"
                />
              </div>
              <h3 class="pokemon-name">{{ fav.pokemonName }}</h3>
              <button
                @click="userStore.removeFavorite(fav.pokemonId)"
                class="btn-remove"
              >
                Quitar ❌
              </button>
            </div>
          </div>
        </div>

        <!-- Equipos -->
        <div v-if="activeTab === 'teams'" class="tab-content">
          <div class="section-header">
            <h2>{{ userStore.teams.length }} Equipos</h2>
            <button @click="toggleTeamForm" class="btn-create">
              + Nuevo Equipo
            </button>
          </div>

          <div v-if="showTeamForm" class="create-form">
            <div class="form-group">
              <input
                v-model="newTeam.name"
                placeholder="Nombre del equipo"
                type="text"
              />
            </div>
            <div class="form-group">
              <textarea
                v-model="newTeam.description"
                placeholder="Descripción (opcional)"
              ></textarea>
            </div>
            <div class="form-actions">
              <button @click="createTeam" class="btn-submit">Crear</button>
              <button @click="showTeamForm = false" class="btn-cancel">
                Cancelar
              </button>
            </div>
          </div>

          <div v-if="userStore.teams.length === 0" class="empty-state">
            <p>🏆 No tienes equipos aún</p>
            <p class="empty-hint">Crea tu primer equipo para participar en batallas</p>
          </div>

          <div v-else class="teams-grid">
            <div
              v-for="team in userStore.teams"
              :key="team.id"
              class="team-card"
            >
              <h3>{{ team.name }}</h3>
              <p v-if="team.description" class="team-description">
                {{ team.description }}
              </p>
              <p class="team-stats">
                {{ team.pokemon?.length || 0 }}/6 Pokémon
              </p>
              <div class="team-actions">
                <button @click="selectTeam(team)" class="btn-manage">
                  Administrar
                </button>
                <button @click="deleteTeam(team.id)" class="btn-delete">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Amigos y Batallas -->
        <div v-if="activeTab === 'friends'" class="tab-content">
          <div class="section-header">
            <h2>{{ userStore.friends.length }} Amigos</h2>
            <button @click="toggleFriendForm" class="btn-create">
              + Agregar Amigo
            </button>
          </div>

          <div v-if="showFriendForm" class="create-form">
            <div class="form-group">
              <input
                v-model="friendCode"
                placeholder="Código de amigo"
                @keyup.enter="addFriend"
              />
            </div>
            <div class="form-actions">
              <button @click="addFriend" class="btn-submit">Agregar</button>
              <button @click="showFriendForm = false" class="btn-cancel">
                Cancelar
              </button>
            </div>
          </div>

          <div class="friend-code-section">
            <h3>Mi Código de Amigo</h3>
            <div class="code-box">
              <p class="code">{{ myCode || "Genera tu código" }}</p>
              <button v-if="!myCode" @click="generateMyCode" class="btn-generate">
                Generar Código
              </button>
              <button
                v-else
                @click="copyCode"
                class="btn-copy"
                :class="{ copied: codeCopied }"
              >
                {{ codeCopied ? "✓ Copiado" : "Copiar" }}
              </button>
            </div>
          </div>

          <div v-if="userStore.friends.length === 0" class="empty-state">
            <p>👥 No tienes amigos aún</p>
            <p class="empty-hint">Comparte tu código para que otros se unan</p>
          </div>

          <div v-else>
            <h3 class="friends-title">Tus Amigos</h3>
            <div class="friends-grid">
              <div
                v-for="friend in userStore.friends"
                :key="friend.id"
                class="friend-card"
              >
                <div class="friend-avatar">
                  {{ friend.username?.[0]?.toUpperCase() || "?" }}
                </div>
                <h4>{{ friend.username }}</h4>
                <p class="friend-email">{{ friend.email }}</p>
                <div class="friend-actions">
                  <button @click="goToBattle(friend)" class="btn-battle">
                    ⚔️ Batallar
                  </button>
                  <button @click="removeFriend(friend.id)" class="btn-delete">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Modal de Detalles de Pokémon -->
    <div
      v-if="selectedPokemon"
      class="modal-overlay"
      @click.self="selectedPokemon = null"
    >
      <div class="pokemon-details-modal">
        <button @click="selectedPokemon = null" class="btn-close">✕</button>
        <div class="details-content">
          <div class="details-image">
            <img
              :src="selectedPokemon.image || 'https://via.placeholder.com/200?text=' + selectedPokemon.name"
              :alt="selectedPokemon.name"
              class="main-image"
            />
            <img
              v-if="selectedPokemon.imageShiny"
              :src="selectedPokemon.imageShiny"
              :alt="selectedPokemon.name + ' Shiny'"
              class="shiny-image"
              title="Forma Shiny"
            />
          </div>
          <div class="details-info">
            <div class="header-info">
              <h2>{{ selectedPokemon.name }}</h2>
              <span class="pokemon-id">#{{ selectedPokemon.id }}</span>
            </div>

            <!-- Categoría -->
            <div v-if="selectedPokemon.genus" class="info-section">
              <p class="info-label"><strong>Categoría:</strong> {{ selectedPokemon.genus }}</p>
            </div>

            <!-- Descripción -->
            <div v-if="selectedPokemon.description" class="info-section">
              <p class="description">{{ selectedPokemon.description }}</p>
            </div>

            <!-- Tipos -->
            <div v-if="selectedPokemon.types?.length" class="info-section">
              <p><strong>Tipos:</strong></p>
              <div class="types-list">
                <span
                  v-for="type in selectedPokemon.types"
                  :key="type.name"
                  class="type-badge"
                  :class="'type-' + type.name"
                >
                  {{ type.name }}
                </span>
              </div>
            </div>

            <!-- Stats -->
            <div v-if="selectedPokemon.stats?.length" class="info-section">
              <p><strong>Estadísticas Base:</strong></p>
              <div class="stats-grid">
                <div v-for="stat in selectedPokemon.stats" :key="stat.name" class="stat-item">
                  <label>{{ stat.name.toUpperCase() }}</label>
                  <div class="stat-bar">
                    <div class="stat-fill" :style="{ width: (stat.base_stat / 255) * 100 + '%' }"></div>
                  </div>
                  <span>{{ stat.base_stat }}</span>
                </div>
              </div>
            </div>

            <!-- Medidas -->
            <div class="info-section">
              <p>
                <strong>Altura:</strong> {{ selectedPokemon.height / 10 }}m |
                <strong>Peso:</strong> {{ selectedPokemon.weight / 10 }}kg
              </p>
            </div>

            <!-- Habilidades -->
            <div v-if="selectedPokemon.abilities?.length" class="info-section">
              <p><strong>Habilidades:</strong></p>
              <div class="abilities-list">
                <span v-for="ability in selectedPokemon.abilities" :key="ability.name" class="ability-tag">
                  {{ ability.name }}
                  <span v-if="ability.isHidden" class="hidden-label">(Oculta)</span>
                </span>
              </div>
            </div>

            <!-- Movimientos -->
            <div v-if="selectedPokemon.moves?.length" class="info-section">
              <p><strong>Movimientos de Inicio:</strong></p>
              <div class="moves-list">
                <span v-for="move in selectedPokemon.moves.slice(0, 5)" :key="move" class="move-tag">
                  {{ move }}
                </span>
              </div>
            </div>

            <!-- Características especiales -->
            <div class="info-section badges-section">
              <span v-if="selectedPokemon.isBaby" class="badge badge-baby">👶 Bebé</span>
              <span v-if="selectedPokemon.isLegendary" class="badge badge-legendary">⭐ Legendario</span>
              <span v-if="selectedPokemon.isMythical" class="badge badge-mythical">✨ Mítico</span>
            </div>

            <!-- Botones de acción -->
            <div class="action-buttons">
              <button
                @click.stop="toggleFavorite(selectedPokemon)"
                class="btn-action"
                :class="{ active: isFavorite(selectedPokemon) }"
              >
                {{ isFavorite(selectedPokemon) ? "❤️ En Favoritos" : "🤍 Favorito" }}
              </button>
              <button @click="selectedPokemon = null" class="btn-action btn-close-modal">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Administración de Equipo -->
    <div
      v-if="selectedTeamForManage"
      class="modal-overlay"
      @click.self="selectedTeamForManage = null"
    >
      <div class="team-manage-modal">
        <button @click="selectedTeamForManage = null" class="btn-close">✕</button>
        <h2>{{ selectedTeamForManage.name }}</h2>
        <div class="team-pokemon">
          <p v-if="!selectedTeamForManage.pokemon?.length" class="empty-slot">
            Sin Pokémon
          </p>
          <div
            v-for="(p, idx) in selectedTeamForManage.pokemon"
            :key="idx"
            class="team-pokemon-item"
          >
            <span>{{ p.pokemonName }}</span>
            <button
              @click="removePokemonFromTeam(selectedTeamForManage.id, p.id)"
              class="btn-remove-small"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore.js";
import { usePokemonStore } from "../stores/pokemonStore.js";
import { useUserStore } from "../stores/userStore.js";
import ProfileCard from "../components/ProfileCard.vue";

const router = useRouter();
const authStore = useAuthStore();
const pokemonStore = usePokemonStore();
const userStore = useUserStore();

const activeTab = ref("pokedex");
const searchName = ref("");
const filterType = ref("");
const selectedPokemon = ref(null);
const pokemonDetails = ref(null);
const showTeamForm = ref(false);
const showFriendForm = ref(false);
const showProfileMenu = ref(false);
const selectedTeamForManage = ref(null);
const myCode = ref("");
const friendCode = ref("");
const codeCopied = ref(false);
const types = ref([]);

const newTeam = ref({
  name: "",
  description: "",
});

const tabs = computed(() => [
  { id: "profile", label: "Mi Perfil", icon: "👤" },
  { id: "pokedex", label: "Pokédex", icon: "📚", count: pokemonStore.pokemonWithDetails.length },
  { id: "favorites", label: "Favoritos", icon: "⭐", count: userStore.favorites.length },
  { id: "teams", label: "Equipos", icon: "🏆", count: userStore.teams.length },
  { id: "friends", label: "Amigos", icon: "👥", count: userStore.friends.length },
]);

const filteredAndTypedPokemon = computed(() => {
  return pokemonStore.pokemonWithDetails.filter((p) => {
    const matchName = p.name.toLowerCase().includes(searchName.value.toLowerCase());
    const matchType = !filterType.value || p.types.some(t => t.name === filterType.value);
    return matchName && matchType;
  });
});

// Mantener filteredPokemon para compatibilidad
const filteredPokemon = computed(() => {
  return pokemonStore.pokemonList.filter((p) =>
    p.name.toLowerCase().includes(searchName.value.toLowerCase())
  );
});

onMounted(async () => {
  try {
    await pokemonStore.fetchPokemonList(151); // Primeras 151 generación original
    await pokemonStore.fetchTypesList();
    
    // Extraer tipos disponibles
    if (pokemonStore.types.length > 0) {
      types.value = pokemonStore.types.map(t => t.name);
    }
  } catch (err) {
    console.error("Error loading pokémon:", err);
  }
  
  await userStore.fetchFavorites();
  await userStore.fetchTeams();
  await userStore.fetchFriends();
  generateMyCode();
});

function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value;
}

function toggleTeamForm() {
  showTeamForm.value = !showTeamForm.value;
  newTeam.value = { name: "", description: "" };
}

function toggleFriendForm() {
  showFriendForm.value = !showFriendForm.value;
  friendCode.value = "";
}

function logout() {
  authStore.logout();
  router.push("/auth");
}

function getPokemonImage(pokemon) {
  const id = pokemon.url
    ? pokemon.url.split("/").filter(Boolean).pop()
    : pokemon.pokemonId;
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function getPokemonId(url) {
  return url.split("/").filter(Boolean).pop();
}

function isFavorite(pokemon) {
  const id = getPokemonId(pokemon.url);
  return userStore.favorites.some((f) => f.pokemonId === parseInt(id));
}

async function toggleFavorite(pokemon) {
  const id = getPokemonId(pokemon.url);
  if (isFavorite(pokemon)) {
    await userStore.removeFavorite(id);
  } else {
    await userStore.addFavorite(id, pokemon.name);
  }
}

async function selectPokemon(pokemon) {
  selectedPokemon.value = pokemon;
  try {
    const details = await pokemonStore.fetchPokemonDetails(
      getPokemonId(pokemon.url)
    );
    pokemonDetails.value = details;
  } catch (error) {
    console.error("Error loading details:", error);
  }
}

async function createTeam() {
  if (newTeam.value.name.trim()) {
    await userStore.createTeam(newTeam.value.name, newTeam.value.description);
    showTeamForm.value = false;
    newTeam.value = { name: "", description: "" };
  }
}

function selectTeam(team) {
  selectedTeamForManage.value = team;
}

async function deleteTeam(teamId) {
  if (confirm("¿Estás seguro de que deseas eliminar este equipo?")) {
    await userStore.deleteTeam(teamId);
  }
}

async function removePokemonFromTeam(teamId, pokemonTeamId) {
  await userStore.removePokemonFromTeam(teamId, pokemonTeamId);
  if (selectedTeamForManage.value) {
    selectedTeamForManage.value = userStore.teams.find((t) => t.id === teamId);
  }
}

function generateMyCode() {
  myCode.value = `PKM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

function copyCode() {
  navigator.clipboard.writeText(myCode.value);
  codeCopied.value = true;
  setTimeout(() => {
    codeCopied.value = false;
  }, 2000);
}

async function addFriend() {
  if (friendCode.value.trim()) {
    console.log("Agregando amigo con código:", friendCode.value);
    friendCode.value = "";
    showFriendForm.value = false;
  }
}

function removeFriend(friendId) {
  if (confirm("¿Estás seguro de que deseas eliminar este amigo?")) {
    console.log("Eliminar amigo:", friendId);
  }
}

function goToBattle(friend) {
  router.push(`/battle/${friend.id}`);
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.pokedex-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* Header */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 2rem;
  align-items: center;
}

.logo {
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0;
  letter-spacing: -1px;
}

.header-search {
  display: flex;
}

.global-search {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 25px;
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
}

.global-search::placeholder {
  color: #999;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: flex-end;
  position: relative;
}

.username {
  font-weight: 600;
  font-size: 0.95rem;
}

.btn-profile {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-profile:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.profile-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 200;
  min-width: 180px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.profile-menu a {
  display: block;
  padding: 0.75rem 1.5rem;
  color: #333;
  text-decoration: none;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.3s ease;
}

.profile-menu a:last-child {
  border-bottom: none;
}

.profile-menu a:hover {
  background: #f8f9fa;
}

/* Navigation Tabs */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.nav-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 10px;
  color: #666;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.nav-tab:hover {
  background: #f0f0f0;
  color: #333;
}

.nav-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.tab-badge {
  background: rgba(255, 255, 255, 0.3);
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-left: 0.25rem;
}

/* Content Section */
.content-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  min-height: 60vh;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h2 {
  color: #2c3e50;
  font-size: 1.8rem;
  margin: 0;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

/* Buttons */
.btn-create {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(102, 126, 234, 0.3);
}

.btn-submit {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(39, 174, 96, 0.3);
}

.btn-cancel {
  background: #e0e0e0;
  color: #666;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #d0d0d0;
}

.btn-remove {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-remove:hover {
  background: #ff5252;
}

.btn-battle {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  transition: all 0.3s ease;
}

.btn-battle:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

.btn-delete {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  background: #ff5252;
}

.btn-manage {
  background: #4ecdc4;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  transition: all 0.3s ease;
}

.btn-manage:hover {
  background: #45b8a6;
}

.btn-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.btn-close:hover {
  color: #333;
}

/* Forms */
.create-form {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 10px;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

/* Pokemon Grid */
.pokemon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.pokemon-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  border: 2px solid transparent;
}

.pokemon-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.pokemon-image {
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.pokemon-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 1rem;
}

.pokemon-name {
  padding: 0.75rem 1rem;
  text-align: center;
  color: #333;
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: capitalize;
  margin: 0;
}

.btn-fav {
  margin: 0.5rem 1rem 1rem;
  background: transparent;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  width: calc(100% - 2rem);
}

.btn-fav:hover {
  border-color: #ff6b6b;
  background: #fff5f5;
}

.btn-fav.active {
  border-color: #ff6b6b;
  background: #fff5f5;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
}

.empty-state p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.empty-hint {
  color: #bbb;
  font-size: 0.9rem !important;
}

/* Teams Grid */
.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.team-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
  transition: all 0.3s ease;
}

.team-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 25px rgba(102, 126, 234, 0.3);
}

.team-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
}

.team-description {
  opacity: 0.9;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.team-stats {
  font-size: 0.85rem;
  opacity: 0.8;
  margin: 1rem 0;
}

.team-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.team-actions .btn-manage,
.team-actions .btn-delete {
  margin: 0;
  flex: 1;
  padding: 0.5rem;
  font-size: 0.85rem;
}

/* Friends Grid */
.friends-title {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.friend-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
}

.friend-card:hover {
  border-color: #667eea;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
}

.friend-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.5rem;
  margin: 0 auto 1rem;
}

.friend-card h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.friend-email {
  color: #999;
  font-size: 0.85rem;
  margin: 0.5rem 0 1rem;
}

.friend-actions {
  display: flex;
  gap: 0.5rem;
}

.friend-actions .btn-battle,
.friend-actions .btn-delete {
  margin: 0;
}

/* Friend Code Section */
.friend-code-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 10px;
  margin-bottom: 2rem;
}

.friend-code-section h3 {
  color: #2c3e50;
  margin: 0 0 1rem 0;
}

.code-box {
  background: white;
  border: 2px dashed #667eea;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.code {
  font-family: monospace;
  font-size: 1.2rem;
  font-weight: 700;
  color: #667eea;
  margin: 0;
  flex: 1;
  min-width: 200px;
}

.btn-generate {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-generate:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(102, 126, 234, 0.3);
}

.btn-copy {
  background: #4ecdc4;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-copy:hover {
  background: #45b8a6;
}

.btn-copy.copied {
  background: #27ae60;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.pokemon-details-modal,
.team-manage-modal {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  max-width: 700px;
  width: 90%;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.details-content {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 2rem;
  align-items: start;
}

.details-image {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.details-image .main-image {
  width: 100%;
  max-width: 280px;
  border-radius: 12px;
  background: #f5f5f5;
  padding: 1rem;
}

.details-image .shiny-image {
  width: 100%;
  max-width: 280px;
  border-radius: 12px;
  background: #fff9e6;
  padding: 1rem;
  border: 2px dashed gold;
  opacity: 0.8;
}

.details-info h2 {
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  text-transform: capitalize;
  font-size: 1.8rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.pokemon-id {
  background: #667eea;
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.info-section {
  margin: 1.2rem 0;
  padding: 0.8rem 0;
  border-bottom: 1px solid #e0e0e0;
}

.info-section p {
  margin: 0 0 0.6rem 0;
  color: #333;
  font-size: 0.95rem;
  line-height: 1.5;
}

.info-label {
  color: #666;
  font-size: 0.9rem;
}

.description {
  color: #555;
  font-style: italic;
  line-height: 1.6;
  border-left: 3px solid #667eea;
  padding-left: 1rem;
  background: #f8f9ff;
  padding: 0.8rem;
  border-radius: 6px;
}

.types-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.8rem;
  margin-top: 0.8rem;
}

.stat-item {
  display: grid;
  grid-template-columns: 50px 1fr 40px;
  gap: 0.6rem;
  align-items: center;
}

.stat-item label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #666;
}

.stat-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.stat-item span {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}

.abilities-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.6rem;
}

.ability-tag {
  background: #e8f4f8;
  color: #0288d1;
  padding: 0.4rem 0.8rem;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid #b3e5fc;
}

.hidden-label {
  font-size: 0.7rem;
  opacity: 0.7;
  font-weight: normal;
}

.moves-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.6rem;
}

.move-tag {
  background: #f3e5f5;
  color: #7b1fa2;
  padding: 0.3rem 0.7rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.badges-section {
  display: flex;
  gap: 0.8rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #e0e0e0;
}

.badge {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge-baby {
  background: #ffe0b2;
  color: #e65100;
}

.badge-legendary {
  background: #fff9c4;
  color: #f57f17;
}

.badge-mythical {
  background: #e1bee7;
  color: #6a1b9a;
}

.action-buttons {
  display: flex;
  gap: 0.8rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn-action {
  flex: 1;
  padding: 0.8rem;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-action:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

.btn-action.active {
  background: #667eea;
  color: white;
}

.btn-close-modal {
  border-color: #999;
  color: #333;
}

.btn-close-modal:hover {
  background: #f5f5f5;
  color: #333;
}

.type-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
}

.team-pokemon {
  margin: 2rem 0;
}

.team-pokemon-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  text-transform: capitalize;
  font-weight: 600;
}

.btn-remove-small {
  background: #ff6b6b;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-remove-small:hover {
  background: #ff5252;
}

.empty-slot {
  text-align: center;
  color: #999;
  padding: 1rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .header-content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .global-search {
    max-width: 100%;
  }

  .details-content {
    grid-template-columns: 1fr;
  }

  .pokemon-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }
}

@media (max-width: 768px) {
  .header-content {
    grid-template-columns: 1fr;
  }

  .nav-tabs {
    flex-direction: column;
  }

  .nav-tab {
    width: 100%;
    justify-content: flex-start;
  }

  .content-section {
    padding: 1rem;
  }

  .pokemon-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 1rem;
  }

  .teams-grid,
  .friends-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters-bar {
    width: 100%;
  }

  .filter-select {
    flex: 1;
  }
}
</style>
