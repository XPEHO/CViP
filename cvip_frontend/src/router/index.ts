/** Application router (HTML5 history, each view is a route named by `RouteName`). */
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import { RouteName } from './route-name'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: RouteName.Home, component: HomeView },
    // Must stay last: catches any address that matches no other route.
    { path: '/:pathMatch(.*)*', name: RouteName.NotFound, component: NotFoundView },
  ],
})

export default router
