<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <nav class="footer-nav">
        <router-link to="/holder">Student or Job Seeker</router-link>
        <router-link to="/channel">Channel</router-link>
        <router-link to="/reservation">Tenancy Reservation</router-link>
        <router-link to="/innkeeper">Innkeeper's Desk</router-link>
      </nav>
      <p class="footer-copy">© {{ year }} Apply Utopia · DigiCred Marketplace</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear();
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.app-footer {
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
  background: $marketplace-primary;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;

  @media (min-width: $breakpoint-desktop) {
    padding: 14px 24px;
    padding-bottom: calc(14px + env(safe-area-inset-bottom, 0));
  }
}

.footer-inner {
  width: 100%;
  max-width: $content-max-width;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.footer-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;

  a {
    font-size: 0.95rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: $marketplace-accent;
    }
  }
}

.footer-copy {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}
</style>
