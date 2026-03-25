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
      await favoritesService.add(pokemonId, pokemonName);
      await fetchFavorites();
    } catch (error) {
      throw error;
    }
  }

  async function removeFavorite(pokemonId) {
    try {
      let pid = null;
      // si es objeto, puede venir con pokemonId (el id del pokemon) o id (pk de la fila)
      if (typeof pokemonId === 'object') {
        pid = pokemonId.pokemonId || pokemonId.pokemonid || null;
        if (!pid && pokemonId.id) {
          // buscar en favorites el registro con esa fila id
          const found = favorites.value.find(f => f.id === pokemonId.id);
          pid = found ? (found.pokemonId || found.pokemonid) : null;
        }
      } else {
        pid = pokemonId;
      }

      if (!pid) {
        throw new Error('pokemonId requerido para eliminar favorito');
      }

      await favoritesService.remove(pid);
      await fetchFavorites();
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
