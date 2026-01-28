<template>
  <div class="battle-container">
    <div class="battle-header">
      <router-link to="/" class="btn-back">← Volver</router-link>
      <h1>Batalla Pokémon</h1>
    </div>

    <div class="battle-content">
      <div class="team-selector">
        <h2>Selecciona tu equipo</h2>
        <div v-if="userStore.teams.length === 0" class="empty">
          No tienes equipos. Crea uno primero.
        </div>
        <div v-else class="teams-available">
          <div
            v-for="team in userStore.teams"
            :key="team.id"
            class="team-option"
            @click="selectTeam(team)"
            :class="{ selected: selectedTeam?.id === team.id }"
          >
            <h3>{{ team.name }}</h3>
            <p>{{ team.pokemon?.length || 0 }}/6 Pokémon</p>
            <ul v-if="team.pokemon?.length">
              <li v-for="p in team.pokemon" :key="p.id">
                {{ p.pokemonName }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="battle-simulation" v-if="selectedTeam">
        <h2>vs {{ friendName }}</h2>
        <p class="info">
          Usa esta información para una batalla estratégica considerando tipos,
          estadísticas y ataques
        </p>

        <div class="team-info">
          <h3>Tu equipo:</h3>
          <div v-for="pokemon in selectedTeam.pokemon" :key="pokemon.id" class="pokemon-info">
            <span>{{ pokemon.pokemonName }}</span>
          </div>
        </div>

        <button @click="startBattle" class="btn-start-battle">
          {{ loading ? "Iniciando..." : "Iniciar Batalla" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "../stores/userStore.js";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const friendId = parseInt(route.params.friendId);
const friendName = ref("");
const selectedTeam = ref(null);
const loading = ref(false);

onMounted(async () => {
  await userStore.fetchTeams();
  await userStore.fetchFriends();

  const friend = userStore.friends.find((f) => f.id === friendId);
  if (friend) {
    friendName.value = friend.username;
  }
});

function selectTeam(team) {
  selectedTeam.value = team;
}

async function startBattle() {
  if (!selectedTeam.value) {
    alert("Debes seleccionar un equipo");
    return;
  }

  loading.value = true;
  try {
    // Aquí iría la lógica real de batalla
    // Por ahora solo mostramos un mensaje
    alert("¡Batalla iniciada! (Sistema de batalla en desarrollo)");
  } catch (error) {
    alert("Error iniciando batalla: " + error);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.battle-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.battle-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.1);
  color: white;
}

.btn-back {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  text-decoration: none;
  border-radius: 5px;
  cursor: pointer;
}

.battle-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.team-selector,
.battle-simulation {
  background: white;
  padding: 2rem;
  border-radius: 10px;
}

.team-selector h2,
.battle-simulation h2 {
  margin-top: 0;
  color: #333;
}

.empty {
  text-align: center;
  color: #999;
  padding: 2rem;
}

.teams-available {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-option {
  padding: 1rem;
  border: 2px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.team-option:hover,
.team-option.selected {
  border-color: #667eea;
  background: #f0f0ff;
}

.team-option h3 {
  margin: 0;
  color: #333;
}

.team-option p {
  margin: 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.team-option ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
  color: #666;
  font-size: 0.85rem;
}

.info {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 5px;
  color: #666;
}

.team-info {
  margin: 2rem 0;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 5px;
}

.team-info h3 {
  margin-top: 0;
}

.pokemon-info {
  padding: 0.5rem;
  background: white;
  margin-bottom: 0.5rem;
  border-radius: 3px;
  border-left: 4px solid #667eea;
  padding-left: 1rem;
}

.btn-start-battle {
  width: 100%;
  padding: 1rem;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-start-battle:hover:not(:disabled) {
  background: #229954;
}

.btn-start-battle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .battle-content {
    grid-template-columns: 1fr;
  }
}
</style>
