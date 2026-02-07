import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import PrimeVue from 'primevue/config';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import './assets/style.scss';
import { loadConfig, getAppIconUrl } from './services/configService';

// Load config before starting the app
loadConfig().then(() => {
  const iconUrl = getAppIconUrl();
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  const appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (link) link.href = iconUrl;
  if (appleIcon) appleIcon.href = iconUrl;

  const app = createApp(App);
  app.use(createPinia());
  app.use(PrimeVue);
  app.use(router);
  app.mount('#app');
}).catch((error) => {
  console.error('Failed to initialize app:', error);
});
