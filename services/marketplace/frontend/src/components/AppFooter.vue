<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <nav class="footer-nav">
        <router-link to="/channel">Channel</router-link>
        <router-link to="/tenant/onboard">Request tenancy</router-link>
        <router-link to="/reservation/check">Check reservation</router-link>
        <router-link to="/innkeeper">Innkeeper</router-link>
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
  padding: 2rem 1.5rem;
  background: $marketplace-primary;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  @media (min-width: $breakpoint-desktop) {
    padding: 2.5rem 2rem;
  }
}

.footer-inner {
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
