import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore.js'
import AuthForm from '../components/AuthForm.vue'
import PokeDexView from '../views/PokeDexView.vue'
import BattleView from '../views/BattleView.vue'
import GoogleCallbackView from '../views/GoogleCallbackView.vue'

const routes = [
  {
    path: '/auth',
    name: 'Auth',
    component: AuthForm
  },
  {
    path: '/auth/google/callback',
    name: 'GoogleCallback',
    component: GoogleCallbackView
  },
  {
    path: '/',
    redirect: '/pokedex'
  },
  {
    path: '/pokedex',
    name: 'PokeDex',
    component: PokeDexView,
    meta: { requiresAuth: true }
  },
  {
    path: '/battle/:friendId',
    name: 'Battle',
    component: BattleView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Si hay token pero no hay usuario en memoria, cargar el perfil
  if (authStore.token && !authStore.user) {
    try {
      await authStore.loadProfile()
    } catch (error) {
      console.error('Error loading profile:', error)
      authStore.logout()
      next('/auth')
      return
    }
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/auth')
  } else if (to.path === '/auth' && authStore.isAuthenticated) {
    next('/pokedex')
  } else {
    next()
  }
})

export default router
