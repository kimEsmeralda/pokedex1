import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

// Acceso directo a PokeAPI
const pokeapi = axios.create({
  baseURL: 'https://pokeapi.co/api/v2'
});

export const usePokemonStore = defineStore('pokemon', () => {
  const pokemonList = ref([]);
  const pokemonWithDetails = ref([]);
  const selectedPokemon = ref(null);
  const loading = ref(false);
  const types = ref([]);

  async function fetchPokemonList(limit = 151, offset = 0) {
    loading.value = true;
    try {
      const response = await pokeapi.get('/pokemon', { params: { limit, offset } });
      pokemonList.value = response.data?.results || [];
      
      // Traer detalles completos de cada Pokémon en paralelo
      await fetchCompleteDetails();
      return response.data;
    } catch (error) {
      console.error('Error fetching pokemon list:', error);
      pokemonList.value = [];
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCompleteDetails() {
    try {
      // Traer detalles de todos los Pokémon en paralelo
      const promises = pokemonList.value.map(pokemon =>
        pokeapi.get(`/pokemon/${pokemon.name}`).catch(err => {
          console.error(`Error fetching ${pokemon.name}:`, err);
          return null;
        })
      );

      const results = await Promise.all(promises);
      
      pokemonWithDetails.value = results
        .filter(r => r !== null)
        .map(response => ({
          id: response.data.id,
          name: response.data.name,
          url: response.data.species?.url || '',
          image: response.data.sprites?.other?.['official-artwork']?.front_default || 
                 response.data.sprites?.front_default || '',
          imageShiny: response.data.sprites?.other?.['official-artwork']?.front_shiny || '',
          types: response.data.types?.map(t => ({
            name: t.type.name,
            slot: t.slot
          })) || [],
          stats: response.data.stats?.map(s => ({
            name: s.stat.name,
            base_stat: s.base_stat
          })) || [],
          height: response.data.height,
          weight: response.data.weight,
          abilities: response.data.abilities?.map(a => ({
            name: a.ability.name,
            isHidden: a.is_hidden
          })) || [],
          baseExperience: response.data.base_experience,
          moves: response.data.moves?.slice(0, 10).map(m => m.move.name) || []
        }));
      
      // Agregar información de especie (descripción, categoría, generación)
      await addSpeciesInfo();
    } catch (error) {
      console.error('Error fetching complete details:', error);
    }
  }

  async function addSpeciesInfo() {
    try {
      const speciesPromises = pokemonWithDetails.value.map(pokemon =>
        pokeapi.get(`/pokemon-species/${pokemon.id}`)
          .then(res => ({
            id: pokemon.id,
            genus: res.data.genera?.find(g => g.language.name === 'en')?.genus || '',
            description: res.data.flavor_text_entries?.find(f => f.language.name === 'en')?.flavor_text?.replace(/[\n\r]/g, ' ') || '',
            generation: res.data.generation?.name || '',
            evolutionChain: res.data.evolution_chain?.url || '',
            isBaby: res.data.is_baby,
            isLegendary: res.data.is_legendary,
            isMythical: res.data.is_mythical
          }))
          .catch(() => ({
            id: pokemon.id,
            genus: '',
            description: '',
            generation: '',
            evolutionChain: '',
            isBaby: false,
            isLegendary: false,
            isMythical: false
          }))
      );

      const speciesResults = await Promise.all(speciesPromises);
      
      // Fusionar la información de especie con pokemonWithDetails
      speciesResults.forEach(species => {
        const pokemon = pokemonWithDetails.value.find(p => p.id === species.id);
        if (pokemon) {
          Object.assign(pokemon, {
            genus: species.genus,
            description: species.description,
            generation: species.generation,
            isBaby: species.isBaby,
            isLegendary: species.isLegendary,
            isMythical: species.isMythical
          });
        }
      });
    } catch (error) {
      console.error('Error fetching species info:', error);
    }
  }

  async function fetchPokemonDetails(id) {
    loading.value = true;
    try {
      const response = await pokeapi.get(`/pokemon/${id}`);
      selectedPokemon.value = {
        id: response.data.id,
        name: response.data.name,
        image: response.data.sprites?.other?.['official-artwork']?.front_default || 
               response.data.sprites?.front_default || '',
        types: response.data.types?.map(t => ({
          name: t.type.name,
          slot: t.slot
        })) || [],
        stats: response.data.stats?.map(s => ({
          name: s.stat.name,
          base_stat: s.base_stat
        })) || [],
        height: response.data.height,
        weight: response.data.weight,
        abilities: response.data.abilities?.map(a => a.ability.name) || [],
        baseExperience: response.data.base_experience
      };
      return selectedPokemon.value;
    } catch (error) {
      console.error('Error fetching pokemon details:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchTypesList() {
    try {
      const response = await pokeapi.get('/type');
      types.value = response.data?.results || [];
      return types.value;
    } catch (error) {
      console.error('Error fetching types:', error);
      types.value = [];
      throw error;
    }
  }

  async function fetchPokemonByType(typeName) {
    loading.value = true;
    try {
      const response = await pokeapi.get(`/type/${typeName}`);
      const pokemonByType = response.data?.pokemon || [];
      
      // Traer detalles de cada Pokémon del tipo
      const promises = pokemonByType.map(p =>
        pokeapi.get(`/pokemon/${p.pokemon.name}`).catch(() => null)
      );

      const results = await Promise.all(promises);
      
      return results
        .filter(r => r !== null)
        .map(response => ({
          id: response.data.id,
          name: response.data.name,
          image: response.data.sprites?.other?.['official-artwork']?.front_default || 
                 response.data.sprites?.front_default || '',
          types: response.data.types?.map(t => ({
            name: t.type.name,
            slot: t.slot
          })) || [],
          stats: response.data.stats?.map(s => ({
            name: s.stat.name,
            base_stat: s.base_stat
          })) || []
        }));
    } catch (error) {
      console.error('Error fetching pokemon by type:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  return {
    pokemonList,
    pokemonWithDetails,
    selectedPokemon,
    loading,
    types,
    fetchPokemonList,
    fetchPokemonDetails,
    fetchTypesList,
    fetchPokemonByType
  };
});
