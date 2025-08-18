import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createApp } from 'vue'
import router from '@/router'
import * as Pinia from 'pinia'
const app = createApp(App)
app.use(Pinia.createPinia())
app.use(ElementPlus)
app.use(router)
app.mount('#app')