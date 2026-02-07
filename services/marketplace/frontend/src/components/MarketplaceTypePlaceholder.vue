<template>
  <div class="marketplace-type-page">
    <div class="hero-banner">
      <div class="hero-content">
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>
      <div class="hero-image" />
    </div>
    <div class="type-placeholder">
      <i :class="['pi', icon]"></i>
      <p>{{ message }}</p>
      <p class="type-hint">{{ hint }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
  icon: string;
  message: string;
  hint: string;
}>();
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;
@use '@/assets/hero-banner' as hero;

.marketplace-type-page {
  padding: 0 16px 24px;
}

.hero-banner {
  @include hero.hero-banner;
}

.hero-content {
  @include hero.hero-content;
}

.hero-image {
  @include hero.hero-image;
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
