import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './styles/styles.css'

const router = createRouter({
  // Use VITE_BASE env var for the base path (set by vite.config.ts via GITHUB_PAGES env)
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // Redirect root to the editor so the demo lands directly on the canvas
      path: '/',
      redirect: '/create',
    },
    {
      path: '/create',
      component: () => import('./routes/EditorView.vue'),
    },
    {
      path: '/files',
      component: () => import('./routes/FilesView.vue'),
    },
  ],
})

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')
