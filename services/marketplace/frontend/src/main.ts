import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import PrimeVue from 'primevue/config';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import './assets/style.scss';
import { loadConfig } from './services/configService';

// Load config before starting the app
loadConfig().then(() => {
  const app = createApp(App);
  app.use(createPinia());
  app.use(PrimeVue);
  app.use(router);
  app.mount('#app');
}).catch((error) => {
  console.error('Failed to initialize app:', error);
});
