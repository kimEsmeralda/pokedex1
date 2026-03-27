import { defineStore } from 'pinia';
import { ref } from 'vue';
import { teamsService, favoritesService, friendsService } from '../services/api.js';

export const useUserStore = defineStore('user', () => {
  const favorites = ref([]);
  const teams = ref([]);
  const friends = ref([]);
  const battles = ref([]);

    async function addFavorite(pokemonId, pokemonName) {
    try {
      if (!pokemonId) throw new Error('pokemonId requerido');
      if (!pokemonName) pokemonName = 'Unknown';
      
      // Actualización optimista (para que se vea al instante incluso sin internet)
      const exists = favorites.value.some(f => (f.pokemonId || f.pokemonid) === pokemonId);
      if (!exists) {
        favorites.value.push({ pokemonId: pokemonId, pokemonName: pokemonName, id: 'temp-' + Date.now() });
      }

      const res = await favoritesService.add(pokemonId, pokemonName);
      // Solo hacer el fetch real si no está encolado para offline
      if (res && res.data && res.data.offlineQueued) {
        console.log('Favorito encolado para offline.');
      } else {
        await fetchFavorites();
      }
    } catch (error) {
      throw error;
    }
  }

  async function removeFavorite(pokemonId) {
    try {
      let pid = null;
      if (typeof pokemonId === 'object') {
        pid = pokemonId.pokemonId || pokemonId.pokemonid || null;
        if (!pid && pokemonId.id) {
          const found = favorites.value.find(f => f.id === pokemonId.id);
          pid = found ? (found.pokemonId || found.pokemonid) : null;
        }
      } else {
        pid = pokemonId;
      }

      if (!pid) {
        throw new Error('pokemonId requerido para eliminar favorito');
      }

      // Actualización optimista
      favorites.value = favorites.value.filter(f => (f.pokemonId || f.pokemonid) !== pid);

      const res = await favoritesService.remove(pid);
      if (res && res.data && res.data.offlineQueued) {
        console.log('Eliminación de favorito encolada para offline.');
      } else {
        await fetchFavorites();
      }
    } catch (error) {
      throw error;
    }
  } catch (error) {
      throw error;
    }
  }

  async function fetchFavorites() {
    try {
      const response = await favoritesService.getAll();
      favorites.value = response.data || [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      favorites.value = [];
    }
  }

  async function createTeam(name, description) {
    try {
      await teamsService.create(name, description);
      await fetchTeams();
    } catch (error) {
      throw error;
    }
  }

  async function fetchTeams() {
    try {
      const response = await teamsService.getAll();
      teams.value = response.data || [];
    } catch (error) {
      console.error('Error fetching teams:', error);
      teams.value = [];
    }
  }

  async function addPokemonToTeam(teamId, pokemonId, pokemonName) {
    try {
      await teamsService.addPokemon(teamId, pokemonId, pokemonName);
      await fetchTeams();
    } catch (error) {
      throw error;
    }
  }

  async function removePokemonFromTeam(teamId, pokemonTeamId) {
    try {
      await teamsService.removePokemon(teamId, pokemonTeamId);
      await fetchTeams();
    } catch (error) {
      throw error;
    }
  }

  async function deleteTeam(teamId) {
    try {
      await teamsService.delete(teamId);
      await fetchTeams();
    } catch (error) {
      throw error;
    }
  }

  async function generateFriendCode() {
    try {
      const response = await friendsService.generateCode();
      return response.data.friendCode;
    } catch (error) {
      throw error;
    }
  }

  async function addFriendByCode(friendCode) {
    try {
      await friendsService.addByCode(friendCode);
      await fetchFriends();
    } catch (error) {
      throw error;
    }
  }

  async function fetchFriends() {
    try {
      const response = await friendsService.getAll();
      friends.value = response.data || [];
    } catch (error) {
      console.error('Error fetching friends:', error);
      friends.value = [];
    }
  }

  async function startBattle(friendId, team1Id, team2Id) {
    try {
      const response = await friendsService.startBattle(friendId, team1Id, team2Id);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async function fetchBattleHistory() {
    try {
      const response = await friendsService.getBattleHistory();
      battles.value = response.data;
    } catch (error) {
      console.error('Error fetching battle history:', error);
    }
  }

  return {
    favorites,
    teams,
    friends,
    battles,
    addFavorite,
    removeFavorite,
    fetchFavorites,
    createTeam,
    fetchTeams,
    addPokemonToTeam,
    removePokemonFromTeam,
    deleteTeam,
    generateFriendCode,
    addFriendByCode,
    fetchFriends,
    startBattle,
    fetchBattleHistory
  };
});
