
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
                {{ p.pokemonName }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="battle-simulation" v-if="selectedTeam">
        <h2>vs {{ friendName }}</h2>
        <p class="info">
          Selecciona Iniciar Batalla para enfrentarte al equipo de {{ friendName }}.
        </p>

        <div class="team-info">
          <h3>Tu equipo:</h3>
          <div v-for="pokemon in selectedTeam.pokemon" :key="pokemon.id" class="pokemon-info">
            <span>{{ pokemon.pokemonName }}</span>
          </div>
        </div>

        <button @click="startBattle" class="btn-start-battle" :disabled="loading">
          {{ loading ? "Iniciando..." : "Iniciar Batalla" }}
        </button>
      </div>
    </div>

    <div class="battle-arena" v-else-if="isBattling">
      <h2>Combate en curso...</h2>
      
      <div class="arena-layout">
        <!-- Player Pokemon -->
        <div class="pokemon-card player-card" :class="{ 'shake': playerHit }" v-if="currentPokemon1">
          <div class="card-header">
            <h3>{{ currentPokemon1.pokemonName }}</h3>
            <span class="hp-text">HP {{ currentPokemon1.hp }}/100</span>
          </div>
          <div class="image-container">
            <img :src="getPokemonImage(currentPokemon1.pokemonId)" :alt="currentPokemon1.pokemonName" />
          </div>
          <div class="health-bar-container">
            <div class="health-bar">
              <div class="health-fill" :style="healthStyle(currentPokemon1.hp)" :class="healthClass(currentPokemon1.hp)"></div>
            </div>
          </div>
          <div class="cards-left">Cartas restantes (vida extra): {{ team1Active.length }}</div>
        </div>

        <div class="vs-badge">VS</div>

        <!-- Friend Pokemon -->
        <div class="pokemon-card enemy-card" :class="{ 'shake': enemyHit }" v-if="currentPokemon2">
          <div class="card-header">
            <h3>{{ currentPokemon2.pokemonName }}</h3>
            <span class="hp-text">HP {{ currentPokemon2.hp }}/100</span>
          </div>
          <div class="image-container">
            <img :src="getPokemonImage(currentPokemon2.pokemonId)" :alt="currentPokemon2.pokemonName" />
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
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore.js';
import { friendsService } from '../services/api.js';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const friendId = parseInt(route.params.friendId);
const friendName = ref("");
const selectedTeam = ref(null);
const loading = ref(false);

const isBattling = ref(false);
const battleFinished = ref(false);
const isWinner = ref(false);
const battleId = ref(null);

const team1Active = ref([]);
const team2Active = ref([]);
const currentPokemon1 = ref(null);
const currentPokemon2 = ref(null);
const battleLogs = ref([]);
let logIdCounter = 0;

const playerHit = ref(false);
const enemyHit = ref(false);

const specialMoves = ["Rayo Solar", "Lanzallamas", "Hidrobomba", "Trueno", "Terremoto", "Golpe Crítico", "Hiperrayo", "Ventisca"];

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
    const res = await friendsService.startBattle(friendId, selectedTeam.value.id, null);
    battleId.value = res.data.battleId;
    
    // Prep fighters (add HP)
    team1Active.value = res.data.teams.team1.pokemon.map(p => ({ ...p, hp: 100 }));
    team2Active.value = res.data.teams.team2.pokemon.map(p => ({ ...p, hp: 100 }));
    
    if (team2Active.value.length === 0) {
       alert("El oponente no tiene Pokémon en su equipo");
       return;
    }

    currentPokemon1.value = team1Active.value.shift();
    currentPokemon2.value = team2Active.value.shift();
    
    isBattling.value = true;
    battleLogs.value = [{ id: logIdCounter++, text: "¡Comienza la batalla!", type: 'log-info' }];
    
    simulateTurn();
  } catch (error) {
    console.error(error);
    alert("Error iniciando batalla: " + (error.response?.data?.error || error.message));
  } finally {
    loading.value = false;
  }
}

function simulateTurn() {
  setTimeout(() => {
    if (!isBattling.value) return;

    // determine attacker
    const attackerIsPlayer = Math.random() > 0.5;
    const damage = Math.floor(Math.random() * 20) + 15; // 15 to 34 damage
    const move = specialMoves[Math.floor(Math.random() * specialMoves.length)];

    if (attackerIsPlayer) {
      currentPokemon2.value.hp = Math.max(0, currentPokemon2.value.hp - damage);
      battleLogs.value.unshift({ id: logIdCounter++, text: `${currentPokemon1.value.pokemonName} usa ${move} y causa ${damage} de daño a ${currentPokemon2.value.pokemonName}.`, type: 'log-player' });
      enemyHit.value = true;
      setTimeout(() => enemyHit.value = false, 500);
    } else {
      currentPokemon1.value.hp = Math.max(0, currentPokemon1.value.hp - damage);
      battleLogs.value.unshift({ id: logIdCounter++, text: `El ${currentPokemon2.value.pokemonName} enemigo usa ${move} y causa ${damage} de daño a ${currentPokemon1.value.pokemonName}.`, type: 'log-enemy' });
      playerHit.value = true;
      setTimeout(() => playerHit.value = false, 500);
    }

    if (battleLogs.value.length > 8) battleLogs.value.pop();

    checkFaint();
  }, 1800);
}

function checkFaint() {
  if (currentPokemon1.value.hp <= 0) {
    battleLogs.value.unshift({ id: logIdCounter++, text: `¡Tu ${currentPokemon1.value.pokemonName} se ha debilitado! Pierdes una carta.`, type: 'log-faint' });
    if (team1Active.value.length > 0) {
      setTimeout(() => {
        currentPokemon1.value = team1Active.value.shift();
        battleLogs.value.unshift({ id: logIdCounter++, text: `¡Adelante, ${currentPokemon1.value.pokemonName}!`, type: 'log-info' });
        simulateTurn();
      }, 1500);
    } else {
      setTimeout(() => finishBattle(false), 1500);
    }
  } else if (currentPokemon2.value.hp <= 0) {
    battleLogs.value.unshift({ id: logIdCounter++, text: `¡El ${currentPokemon2.value.pokemonName} enemigo se ha debilitado! Su carta se esfuma.`, type: 'log-faint' });
    if (team2Active.value.length > 0) {
      setTimeout(() => {
        currentPokemon2.value = team2Active.value.shift();
        battleLogs.value.unshift({ id: logIdCounter++, text: `El oponente envía a ${currentPokemon2.value.pokemonName}.`, type: 'log-info' });
        simulateTurn();
      }, 1500);
    } else {
      setTimeout(() => finishBattle(true), 1500);
    }
  } else {
    simulateTurn();
  }
}

async function finishBattle(win) {
  isBattling.value = false;
  battleFinished.value = true;
  isWinner.value = win;

  const winnerId = win ? userStore.user.id : friendId;
  
  try {
    await friendsService.calculateBattleResult(battleId.value, winnerId);
  } catch (error) {
    console.error("Error guardando el resultado:", error);
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
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.battle-header h1 { margin: 0; font-size: 1.8rem; text-shadow: 1px 1px 2px #000; }

.btn-back {
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  font-weight: bold;
}
.btn-back:hover { background: rgba(255, 255, 255, 0.3); }

.battle-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.team-selector,
.battle-simulation,
.battle-arena,
.battle-result {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

.team-selector h2,
.battle-simulation h2 { margin-top: 0; color: #333; }

.empty { text-align: center; color: #777; padding: 2rem; }

.teams-available { display: flex; flex-direction: column; gap: 1rem; }

.team-option {
  padding: 1.2rem;
  border: 2px solid #ddd;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fff;
}
.team-option:hover { transform: translateY(-3px); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.team-option.selected { border-color: #ffd700; background: #fffdf0; box-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
.team-option h3 { margin: 0 0 0.5rem 0; color: #222; }

.btn-start-battle {
  width: 100%;
  padding: 1.2rem;
  background: linear-gradient(135deg, #f44336, #e53935);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.btn-start-battle:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(244, 67, 54, 0.4);
}
.btn-start-battle:disabled { opacity: 0.6; cursor: not-allowed; }

/* Arena Styles */
.battle-arena {
  max-width: 900px;
  margin: 2rem auto;
  text-align: center;
  background: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png') no-repeat center center;
  background-color: rgba(255, 255, 255, 0.95);
  background-blend-mode: overlay;
  background-size: 20%;
}
.battle-arena h2 { color: #333; margin-bottom: 2rem; }

.arena-layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2rem 0;
  position: relative;
}

.pokemon-card {
  width: 42%;
  padding: 1.5rem;
  background: linear-gradient(to bottom right, #ffffff, #f0f0f0);
  border-radius: 16px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.15), inset 0 0 0 8px #ffd700;
  transition: transform 0.3s;
  position: relative;
}
.player-card { inset: 0 0 0 8px #4CAF50; border: 2px solid #2e7d32; }
.enemy-card { inset: 0 0 0 8px #F44336; border: 2px solid #c62828;}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #ddd;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}
.card-header h3 { margin: 0; font-size: 1.4rem; color: #333; text-transform: capitalize; }
.hp-text { font-weight: bold; color: #555; }

.image-container {
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
}
.image-container img {
  max-height: 100%;
  max-width: 100%;
  filter: drop-shadow(0 8px 6px rgba(0,0,0,0.2));
  transition: transform 0.2s;
}

.health-bar-container { margin: 1rem 0; }
.health-bar {
  width: 100%;
  height: 22px;
  background: #444;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid #222;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
}

.health-fill {
  height: 100%;
  transition: width 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.5s;
}
.health-high { background: linear-gradient(90deg, #4CAF50, #8BC34A); }
.health-medium { background: linear-gradient(90deg, #FFC107, #FFEB3B); }
.health-low { background: linear-gradient(90deg, #F44336, #E57373); }

.cards-left { font-size: 0.9rem; color: #666; font-weight: 600; margin-top: 0.8rem; }

.vs-badge {
  font-size: 2.5rem;
  font-weight: 900;
  background: #333;
  color: #fff;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 4px solid #ffd700;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  z-index: 10;
}

/* Animations */
@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-10px) rotate(-2deg); filter: brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(5); }
  50% { transform: translateX(10px) rotate(2deg); filter: brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(5); }
  75% { transform: translateX(-10px) rotate(-2deg); }
  100% { transform: translateX(0); filter: none; }
}
.shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }

/* Battle Log */
.battle-log {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #222;
  color: #eee;
  border-radius: 12px;
  height: 220px;
  overflow-y: hidden;
  position: relative;
  box-shadow: inset 0 4px 8px rgba(0,0,0,0.5);
  border: 4px solid #444;
}

.battle-log p {
  margin: 0;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #333;
  font-size: 1.1rem;
  text-shadow: 1px 1px 0 #000;
  text-align: left;
}
.log-player { color: #8BC34A; }
.log-enemy { color: #FF9800; }
.log-faint { color: #F44336; font-weight: bold; }
.log-info { color: #03A9F4; font-style: italic; }

.log-list-enter-active, .log-list-leave-active { transition: all 0.5s ease; }
.log-list-enter-from { opacity: 0; transform: translateY(-20px); }
.log-list-leave-to { opacity: 0; transform: translateY(20px); }

/* Result */
.battle-result { max-width: 600px; margin: 3rem auto; text-align: center; }
.win-text { color: #4CAF50; font-size: 3rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); margin: 2rem 0; }
.lose-text { color: #F44336; font-size: 3rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); margin: 2rem 0; }

@media (max-width: 768px) {
  .battle-content, .arena-layout { grid-template-columns: 1fr; flex-direction: column; gap: 1.5rem; }
  .pokemon-card { width: 100%; max-width: 350px; margin: 0 auto; }
  .vs-badge { margin: 1rem 0; }
}
</style>
