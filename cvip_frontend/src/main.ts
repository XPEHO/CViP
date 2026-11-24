/** Entry point: creates the Vue application, plugs in Pinia and the router, then mounts it. */
import './assets/main.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
