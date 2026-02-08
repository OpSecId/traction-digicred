<template>
  <Toast position="bottom-center" />
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Toast from 'primevue/toast';
import { useJobsStore } from '@/store/jobsStore';
import { useEmployerStore } from '@/store/employerStore';
import { useAdminStore } from '@/store/adminStore';
import { getTenantSession, getInnkeeperSession } from '@/api/auth';

const jobsStore = useJobsStore();
const employerStore = useEmployerStore();
const adminStore = useAdminStore();

onMounted(async () => {
  try {
    await jobsStore.load();
  } catch (e) {
    console.error('Failed to load jobs:', e);
  }
  try {
    const session = await getTenantSession();
    if (session.employerId) {
      employerStore.setEmployer(session.employerId);
    }
  } catch {
    // Session not available or Redis not configured
  }
  try {
    const innkeeperSession = await getInnkeeperSession();
    if (innkeeperSession.isAdmin) {
      adminStore.setLoggedIn(true);
    }
  } catch {
    // Innkeeper session not available or Redis not configured
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
