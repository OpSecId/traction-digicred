<template>
  <Toast position="bottom-center" />
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Toast from 'primevue/toast';
import { useDemoStore } from '@/store/demoStore';

const demoStore = useDemoStore();

onMounted(async () => {
  try {
    await demoStore.load();
  } catch (e) {
    console.error('Failed to load demo config:', e);
  }
});
</script>

<style>
#app {
  height: 100%;
  font-family: 'Open Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #424242;
}
</style>
