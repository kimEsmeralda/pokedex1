
<template>
  <div class="battle-container">
    <div class="battle-header">
      <router-link to="/" class="btn-back">← Volver</router-link>
      <h1>Batalla Pokémon</h1>
    </div>

    <div class="battle-content" v-if="!isBattling && !battleFinished">
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
                {{ p.pokemonname || p.pokemonName }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="battle-simulation" v-if="selectedTeam">
        <h2 v-if="friendName">vs {{ friendName }}</h2>
        <h2 v-else>Preparando batalla...</h2>
        <p class="info">
          Selecciona Iniciar Batalla para enfrentarte.
        </p>

        <div class="team-info">
          <h3>Tu equipo:</h3>
          <div v-for="pokemon in selectedTeam.pokemon" :key="pokemon.id" class="pokemon-info">
            <span>{{ pokemon.pokemonname || pokemon.pokemonName }}</span>
          </div>
        </div>

        <button @click="startBattle" class="btn-start-battle" :disabled="loading">
          {{ loading ? "Iniciando..." : (isJoining ? "Unirse a Batalla" : "Iniciar Batalla") }}
        </button>
      </div>
    </div>

    <div class="battle-arena" v-else-if="isBattling">
      <h2>Combate en curso...</h2>
      
      <div class="arena-layout">
        <!-- Player Pokemon -->
        <div class="pokemon-card player-card" :class="{ 'shake': playerHit }" v-if="currentPokemon1">
          <div class="card-header">
            <h3>{{ getPokemonName(currentPokemon1) }}</h3>
            <span class="hp-text">HP {{ currentPokemon1.hp }}/100</span>
          </div>
          <div class="image-container">
            <img :src="getPokemonImage(getPokemonId(currentPokemon1))" :alt="getPokemonName(currentPokemon1)" />
          </div>
          <div class="health-bar-container">
            <div class="health-bar">
              <div class="health-fill" :style="healthStyle(currentPokemon1.hp)" :class="healthClass(currentPokemon1.hp)"></div>
            </div>
          </div>
          <div class="cards-left">Cartas restantes (vida extra): {{ team1Active.length }}</div>
          
          <div class="attack-controls">
             <button @click="attack('Ataque Rápido')" class="btn-attack" :disabled="!canAttack">Ataque Rápido</button>
             <button @click="attack('Ataque Fuerte')" class="btn-attack strong" :disabled="!canAttack">Ataque Fuerte</button>
          </div>
        </div>

        <div class="vs-badge">VS</div>

        <!-- Friend Pokemon -->
        <div class="pokemon-card enemy-card" :class="{ 'shake': enemyHit }" v-if="currentPokemon2">
          <div class="card-header">
            <h3>{{ getPokemonName(currentPokemon2) }}</h3>
            <span class="hp-text">HP {{ currentPokemon2.hp }}/100</span>
          </div>
          <div class="image-container">
            <img :src="getPokemonImage(getPokemonId(currentPokemon2))" :alt="getPokemonName(currentPokemon2)" />
          </div>
          <div class="health-bar-container">
            <div class="health-bar">
              <div class="health-fill" :style="healthStyle(currentPokemon2.hp)" :class="healthClass(currentPokemon2.hp)"></div>
            </div>
          </div>
           <div class="cards-left">Cartas restantes (vida extra): {{ team2Active.length }}</div>
        </div>
      </div>

      <div class="battle-log">
        <transition-group name="log-list" tag="div">
          <p v-for="log in battleLogs" :key="log.id" :class="log.type">{{ log.text }}</p>
        </transition-group>
      </div>
    </div>

    <div class="battle-result" v-else-if="battleFinished">
      <h2>¡Batalla Finalizada!</h2>
      <h3 :class="{ 'win-text': isWinner, 'lose-text': !isWinner }">
        {{ isWinner ? '¡Has ganado!' : 'Has perdido...' }}
      </h3>
      <button @click="resetBattle" class="btn-start-battle">Volver al inicio</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore.js';
import { friendsService } from '../services/api.js';
import { io } from 'socket.io-client';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const battleIdParam = route.params.battleId;
const friendIdParam = route.params.friendId;
const routeId = battleIdParam || friendIdParam;
const friendName = ref("");
const selectedTeam = ref(null);
const loading = ref(false);

const isBattling = ref(false);
const battleFinished = ref(false);
const isWinner = ref(false);
const battleId = ref(null);

const isJoining = computed(() => !!battleIdParam);

const team1Active = ref([]);
const team2Active = ref([]);
const currentPokemon1 = ref(null);
const currentPokemon2 = ref(null);
const battleLogs = ref([]);
let logIdCounter = 0;

const playerHit = ref(false);
const enemyHit = ref(false);
const canAttack = ref(true);

let socket = null;

function getPokemonId(p) {
  return p.pokemonid || p.pokemonId;
}

function getPokemonName(p) {
  return p.pokemonname || p.pokemonName;
}

onMounted(async () => {
  await userStore.fetchTeams();
  await userStore.fetchFriends();

  if (friendIdParam) {
    const friend = userStore.friends.find((f) => f.id === parseInt(friendIdParam));
    if (friend) {
      friendName.value = friend.username;
    }
  }

  if (battleIdParam) {
    try {
      loading.value = true;
      const res = await friendsService.getBattle(battleIdParam);
      const battle = res.data;
      battleId.value = battle.battleId;
      
      const isInitiator = battle.userId === userStore.user.id;
      const myTeam = isInitiator ? battle.teams.team1 : battle.teams.team2;
      const oppTeam = isInitiator ? battle.teams.team2 : battle.teams.team1;
      
      team1Active.value = myTeam.pokemon.map(p => ({ ...p, hp: 100 }));
      team2Active.value = oppTeam.pokemon.map(p => ({ ...p, hp: 100 }));
      
      currentPokemon1.value = team1Active.value.shift();
      currentPokemon2.value = team2Active.value.shift();
      
      selectedTeam.value = myTeam;
      isBattling.value = true;
      battleLogs.value = [{ id: logIdCounter++, text: "¡Te has unido a la batalla!", type: 'log-info' }];
      
      socket.emit('join-battle', { battleId: battleId.value });
    } catch (err) {
      console.error(err);
      alert("No se pudo unir a la batalla");
    } finally {
      loading.value = false;
    }
  }

  const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5432';
  socket = io(backendUrl, {
    auth: { token: localStorage.getItem('token') }
  });

  socket.on('connect', () => {
    console.log('Socket ligado al backend', socket.id);
  });

  socket.on('attack', (data) => {
    if (data.battleId !== battleId.value) return;

    if (data.attackerId !== userStore.user.id) {
       currentPokemon1.value.hp = Math.max(0, currentPokemon1.value.hp - data.damage);
       battleLogs.value.unshift({ id: logIdCounter++, text: `El ${getPokemonName(currentPokemon2.value)} enemigo usa ${data.move} y causa ${data.damage} de daño a ${getPokemonName(currentPokemon1.value)}.`, type: 'log-enemy' });
       playerHit.value = true;
       setTimeout(() => playerHit.value = false, 500);
       checkFaint();
    }
  });
});

onUnmounted(() => {
  if (socket) socket.disconnect();
})

function selectTeam(team) {
  selectedTeam.value = team;
}

function getPokemonImage(id) {
  if(!id) return 'https://via.placeholder.com/150';
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function healthStyle(hp) {
  return { width: Math.max(0, Math.min(100, hp)) + '%' };
}

function healthClass(hp) {
  if (hp > 50) return 'health-high';
  if (hp > 20) return 'health-medium';
  return 'health-low';
}

async function startBattle() {
  if (!selectedTeam.value) {
    alert("Debes seleccionar un equipo");
    return;
  }
  if (!selectedTeam.value.pokemon || selectedTeam.value.pokemon.length === 0) {
    alert("Tu equipo está vacío");
    return;
  }

  loading.value = true;
  try {
      const friendId = friendIdParam ? parseInt(friendIdParam) : null;

      if (!friendId) {
        alert("Error: Faltan datos del amigo para iniciar la batalla.");
        return;
      }

      const res = await friendsService.startBattle(friendId, selectedTeam.value.id, null);
      battleId.value = res.data.battleId;
      
      const myTeam = res.data.teams.team1;
      const oppTeam = res.data.teams.team2;
      
      team1Active.value = myTeam.pokemon.map(p => ({ ...p, hp: 100 }));
      team2Active.value = oppTeam.pokemon.map(p => ({ ...p, hp: 100 }));
      
      if (team2Active.value.length === 0) {
         alert("El oponente no tiene Pokémon en su equipo");
         loading.value = false;
         return;
      }
      
      currentPokemon1.value = team1Active.value.shift();
      currentPokemon2.value = team2Active.value.shift();
      
      socket.emit('join-battle', { battleId: res.data.battleId });
      
      isBattling.value = true;
      battleLogs.value = [{ id: logIdCounter++, text: "¡Comienza la batalla! Esperando que el oponente se una.", type: 'log-info' }];
      
    } catch (error) {
    console.error(error);
    alert("Error iniciando batalla: " + (error.response?.data?.error || error.message));
  } finally {
    loading.value = false;
  }
}

function attack(moveName) {
  if (!canAttack.value || !isBattling.value) return;
  const damage = moveName === 'Ataque Fuerte' 
    ? Math.floor(Math.random() * 20) + 15 
    : Math.floor(Math.random() * 10) + 5;
  
  const move = moveName;

  currentPokemon2.value.hp = Math.max(0, currentPokemon2.value.hp - damage);
  battleLogs.value.unshift({ id: logIdCounter++, text: `${getPokemonName(currentPokemon1.value)} usa ${move} y causa ${damage} de daño a ${getPokemonName(currentPokemon2.value)}.`, type: 'log-player' });
  enemyHit.value = true;
  setTimeout(() => enemyHit.value = false, 500);

  if (socket && battleId.value) {
    socket.emit('attack', {
      battleId: battleId.value,
      attackerId: userStore.user.id,
      damage,
      move
    });
  }

  checkFaint();
}

function checkFaint() {
  if (currentPokemon1.value.hp <= 0) {
    battleLogs.value.unshift({ id: logIdCounter++, text: `¡Tu ${getPokemonName(currentPokemon1.value)} se ha debilitado! Pierdes una carta.`, type: 'log-faint' });
    if (team1Active.value.length > 0) {
      setTimeout(() => {
        currentPokemon1.value = team1Active.value.shift();
        battleLogs.value.unshift({ id: logIdCounter++, text: `¡Adelante, ${getPokemonName(currentPokemon1.value)}!`, type: 'log-info' });
      }, 1500);
    } else {
      setTimeout(() => finishBattle(false), 1500);
    }
  } else if (currentPokemon2.value.hp <= 0) {
    battleLogs.value.unshift({ id: logIdCounter++, text: `¡El ${getPokemonName(currentPokemon2.value)} enemigo se ha debilitado! Su carta se esfuma.`, type: 'log-faint' });
    if (team2Active.value.length > 0) {
      setTimeout(() => {
        currentPokemon2.value = team2Active.value.shift();
        battleLogs.value.unshift({ id: logIdCounter++, text: `El oponente envía a ${getPokemonName(currentPokemon2.value)}.`, type: 'log-info' });
      }, 1500);
    } else {
      setTimeout(() => finishBattle(true), 1500);
    }
  }
}

async function finishBattle(win) {
  isBattling.value = false;
  battleFinished.value = true;
  isWinner.value = win;

  const winnerUserId = win ? userStore.user.id : parseInt(routeId);
  
  if (!isNaN(winnerUserId)) {
    try {
      await friendsService.calculateBattleResult(battleId.value, winnerUserId);
    } catch (error) {
      console.error("Error guardando el resultado:", error);
    }
  }
}

function resetBattle() {
  battleFinished.value = false;
  selectedTeam.value = null;
}
</script>

<style scoped>
.battle-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding-bottom: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.battle-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: rgba(0, 0, 0, 0.4);
  color: white;
}

.btn-back {
  color: #ffcb05;
  text-decoration: none;
  font-weight: bold;
}

h1 {
  margin: 0;
  color: #ffcb05;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
}

.battle-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.team-selector, .battle-simulation {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

h2 {
  color: #333;
  margin-bottom: 1.5rem;
  text-align: center;
}

.teams-available {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.team-option {
  border: 2px solid #ccc;
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.team-option:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.team-option.selected {
  border-color: #ffcb05;
  background: #fff9e6;
  box-shadow: 0 0 15px rgba(255, 203, 5, 0.3);
}

.team-info {
  background: #f5f5f5;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-left: 4px solid #3c5aa6;
}

.btn-start-battle {
  width: 100%;
  padding: 1rem;
  background: #3c5aa6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-start-battle:hover:not(:disabled) {
  background: #2a3f75;
}

.btn-start-battle:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-attack {
  margin: 0.5rem;
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  background: #ffa500;
  color: #333;
  transition: transform 0.2s;
}

.btn-attack.strong {
  background: #e3350d;
  color: #fff;
}

.btn-attack:hover:not(:disabled) {
  transform: scale(1.05);
}

.btn-attack:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.attack-controls {
  margin-top: 1rem;
  text-align: center;
}

/* Arena Styles */
.battle-arena {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.arena-layout {
  display: flex;
  justify-items: center;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .arena-layout {
    flex-direction: column;
  }
}

.pokemon-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
  position: relative;
  min-width: 250px;
}

.player-card {
  border-bottom: 6px solid #4CAF50;
}

.enemy-card {
  border-bottom: 6px solid #e3350d;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
  text-transform: capitalize;
}

.hp-text {
  font-weight: bold;
  color: #666;
}

.image-container {
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f0f0;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.image-container img {
  max-height: 180px;
  object-fit: contain;
}

/* Health Bar */
.health-bar-container {
  background: #e0e0e0;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
}

.health-bar {
  width: 100%;
  height: 100%;
}

.health-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.health-high { background-color: #4CAF50; }
.health-medium { background-color: #FFC107; }
.health-low { background-color: #F44336; }

.cards-left {
  text-align: center;
  font-size: 0.9rem;
  color: #666;
  font-weight: bold;
}

.vs-badge {
  background: #ffcb05;
  color: #3c5aa6;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 900;
  font-size: 1.5rem;
  border: 4px solid white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  z-index: 10;
}

/* Animations */
.shake {
  animation: shake 0.5s;
}

@keyframes shake {
  0% { transform: translate(1px, 1px) rotate(0deg); }
  10% { transform: translate(-1px, -2px) rotate(-1deg); }
  20% { transform: translate(-3px, 0px) rotate(1deg); }
  30% { transform: translate(3px, 2px) rotate(0deg); }
  40% { transform: translate(1px, -1px) rotate(1deg); }
  50% { transform: translate(-1px, 2px) rotate(-1deg); }
  60% { transform: translate(-3px, 1px) rotate(0deg); }
  70% { transform: translate(3px, 1px) rotate(-1deg); }
  80% { transform: translate(-1px, -1px) rotate(1deg); }
  90% { transform: translate(1px, 2px) rotate(0deg); }
  100% { transform: translate(1px, -2px) rotate(-1deg); }
}

/* Battle Log */
.battle-log {
  background: rgba(0, 0, 0, 0.6);
  border-radius: 10px;
  padding: 1.5rem;
  height: 200px;
  overflow-y: auto;
  border: 2px solid rgba(255,255,255,0.2);
}

.battle-log p {
  margin: 0.5rem 0;
  padding: 0.5rem;
  border-radius: 5px;
  font-family: monospace;
}

.log-info { color: #ffcb05; text-align: center; }
.log-player { color: #4CAF50; border-left: 3px solid #4CAF50; background: rgba(76, 175, 80, 0.1); }
.log-enemy { color: #F44336; border-left: 3px solid #F44336; background: rgba(244, 67, 54, 0.1); }
.log-faint { color: #9E9E9E; text-align: center; font-style: italic; background: rgba(255,255,255,0.1); }

.log-list-enter-active, .log-list-leave-active {
  transition: all 0.5s ease;
}
.log-list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.battle-result {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.win-text { color: #4CAF50; font-size: 2rem; }
.lose-text { color: #F44336; font-size: 2rem; }
</style>
