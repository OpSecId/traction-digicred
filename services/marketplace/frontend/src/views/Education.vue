<template>
  <div class="marketplace-type-page">
    <div class="hero-banner">
      <div class="hero-content">
        <h1>Education</h1>
        <p>Explore learning opportunities</p>
      </div>
      <div class="hero-image" />
    </div>
    <div class="type-placeholder">
      <i class="pi pi-book"></i>
      <p>Education opportunities coming soon.</p>
      <p class="type-hint">Share your credentials to get matched with relevant programs.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.marketplace-type-page {
  padding: 0 16px 24px;
  padding-bottom: 24px;
}

.hero-banner {
  position: relative;
  background: linear-gradient(135deg, $marketplace-primary 0%, $marketplace-secondary 100%);
  padding: 16px 0 20px;
  padding-top: calc(16px + env(safe-area-inset-top, 0));
  margin: 0 -16px 0 -16px;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 2;
  padding: 0 16px;

  h1 {
    font-size: 1.35rem;
    font-weight: 700;
    color: white;
    margin: 0 0 4px 0;
    line-height: 1.2;
  }

  p {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
  }
}

.hero-image {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 140px;
  height: 88px;
  background: url('/img/digicred/loginDash.png') right bottom / contain no-repeat;
  opacity: 0.2;
}

.type-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: rgba(0, 51, 102, 0.04);
  border-radius: 12px;
  border: 1px dashed rgba(0, 51, 102, 0.2);

  i {
    font-size: 3rem;
    color: $marketplace-primary;
    margin-bottom: 16px;
    opacity: 0.7;
  }

  p {
    margin: 0;
    font-size: 1rem;
    color: $marketplace-text-muted;
    text-align: center;
  }

  .type-hint {
    margin-top: 12px;
    font-size: 0.9rem;
    opacity: 0.9;
  }
}
</style>
