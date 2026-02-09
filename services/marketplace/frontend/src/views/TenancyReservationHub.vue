<template>
  <div class="reservation-hub page-container">
    <button type="button" class="back-link" @click="goBack">
      <i class="pi pi-arrow-left"></i>
      Back
    </button>
    <h1 class="page-title">Tenancy Reservation</h1>
    <p class="page-subtitle">Request tenancy to join the marketplace or check the status of your existing reservation.</p>
    <div class="hub-cards">
      <router-link to="/tenant/onboard" class="hub-card hub-card-primary">
        <i class="pi pi-plus-circle hub-icon"></i>
        <h2>Request tenancy</h2>
        <p>Submit a new tenancy request to join the marketplace.</p>
      </router-link>
      <router-link to="/reservation/check" class="hub-card">
        <i class="pi pi-search hub-icon"></i>
        <h2>Check reservation</h2>
        <p>Look up the status of your existing reservation.</p>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/page-common.scss';
@use '@/assets/variables.scss' as *;

.reservation-hub {
  max-width: 560px;
}

.hub-cards {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.hub-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid $marketplace-panel-border;
  background: $marketplace-bg-card;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 51, 102, 0.1);
  }

  &.hub-card-primary {
    border-color: $marketplace-primary;
    background: rgba($marketplace-primary, 0.04);
  }

  .hub-icon {
    font-size: 1.75rem;
    color: $marketplace-primary;
    margin-bottom: 0.75rem;
  }

  h2 {
    font-size: 1.1rem;
    font-weight: 600;
    color: $marketplace-primary;
    margin: 0 0 0.5rem;
  }

  p {
    font-size: 0.95rem;
    color: $marketplace-text-muted;
    margin: 0;
    line-height: 1.5;
  }
}
</style>
