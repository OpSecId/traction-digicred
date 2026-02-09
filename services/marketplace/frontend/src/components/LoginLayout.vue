<template>
  <div
    class="login-layout"
    :class="{
      'login-layout--admin': variant === 'admin',
      'login-layout--holder': variant === 'holder',
      'login-layout--tenant': variant === 'tenant',
    }"
  >
    <div class="login-panel login-panel-brand">
      <div class="brand-content">
        <div class="brand-badge">
          <i :class="['pi', brandBadgeIcon]"></i>
          <span>{{ brandBadge }}</span>
        </div>
        <h1>{{ brandTitle }}</h1>
        <p class="brand-tagline">{{ brandTagline }}</p>
        <ul v-if="brandFeatures?.length" class="brand-features">
          <li v-for="(feature, i) in brandFeatures" :key="i">
            <i class="pi pi-check"></i>
            <span>{{ feature }}</span>
          </li>
        </ul>
      </div>
      <div class="brand-pattern" aria-hidden="true"></div>
    </div>

    <div class="login-panel login-panel-form">
      <div class="form-container">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  brandBadge: string;
  brandBadgeIcon: string;
  brandTitle: string;
  brandTagline: string;
  brandFeatures?: string[];
  variant?: 'default' | 'admin' | 'holder' | 'tenant';
}>();
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/variables.scss' as *;

.login-layout {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
  flex: 1;
  height: 100%;

  @media (min-width: 900px) {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
  }
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  min-height: 0;
  overflow-y: auto;

  @media (min-width: 900px) {
    padding: 32px 24px;
  }
}

.login-panel-brand {
  position: relative;
  background: linear-gradient(145deg, #002244 0%, #003366 45%, #0a4d6e 100%);
  overflow: hidden;

  @media (max-width: 899px) {
    padding: 28px 20px 24px;
    flex-shrink: 0;
  }

  .login-layout--admin & {
    background: linear-gradient(145deg, #0f172a 0%, #1e293b 40%, #334155 100%);
  }

  .login-layout--tenant & {
    background: linear-gradient(145deg, #0f766e 0%, #0d9488 40%, #134e4a 100%);
  }

  .login-layout--holder & {
    background: linear-gradient(145deg, #b45309 0%, #ea580c 40%, #fbbf24 100%);
  }
}

.brand-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.06;
  background-image: radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(252, 186, 25, 0.2) 0%, transparent 40%),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 40px,
      rgba(255, 255, 255, 0.02) 40px,
      rgba(255, 255, 255, 0.02) 80px
    );

  .login-layout--admin & {
    background-image: radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(180, 140, 70, 0.15) 0%, transparent 40%),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 40px,
        rgba(255, 255, 255, 0.02) 40px,
        rgba(255, 255, 255, 0.02) 80px
      );
  }

  .login-layout--tenant & {
    background-image: radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(45, 212, 191, 0.2) 0%, transparent 40%),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 40px,
        rgba(255, 255, 255, 0.02) 40px,
        rgba(255, 255, 255, 0.02) 80px
      );
  }

  .login-layout--holder & {
    background-image: radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.2) 0%, transparent 40%),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 40px,
        rgba(255, 255, 255, 0.03) 40px,
        rgba(255, 255, 255, 0.03) 80px
      );
  }
}

.brand-content {
  position: relative;
  z-index: 1;
  max-width: 360px;
  color: white;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  margin-bottom: 20px;

  i {
    font-size: 0.9rem;
  }

  @media (min-width: 900px) {
    margin-bottom: 32px;
  }
}

.brand-content h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
  line-height: 1.2;

  @media (min-width: 900px) {
    font-size: 2rem;
    margin: 0 0 8px 0;
  }
}

.brand-tagline {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 24px 0;
  line-height: 1.5;

  @media (min-width: 900px) {
    font-size: 1rem;
    margin: 0 0 40px 0;
  }
}

.brand-features {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.9);

    i {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(252, 186, 25, 0.25);
      color: $marketplace-accent;
      border-radius: 50%;
      font-size: 0.6rem;
    }

    .login-layout--admin & i {
      background: rgba(180, 140, 70, 0.3);
      color: #c9a227;
    }

    .login-layout--tenant & i {
      background: rgba(45, 212, 191, 0.35);
      color: #5eead4;
    }

    .login-layout--holder & i {
      background: rgba(255, 255, 255, 0.25);
      color: #fef3c7;
    }

    @media (min-width: 900px) {
      padding: 10px 0;
      gap: 12px;
      font-size: 0.95rem;

      i {
        width: 20px;
        height: 20px;
        font-size: 0.65rem;
      }
    }
  }
}

.login-panel-form {
  background: $marketplace-bg;
  background-image:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 51, 102, 0.06), transparent),
    linear-gradient(180deg, $marketplace-bg 0%, #ececec 100%);

  .login-layout--admin & {
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(30, 41, 59, 0.08), transparent),
      linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
  }

  .login-layout--tenant & {
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(13, 148, 136, 0.08), transparent),
      linear-gradient(180deg, #f0fdfa 0%, #e6fffa 100%);
  }

  .login-layout--holder & {
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(234, 88, 12, 0.08), transparent),
      linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%);
  }
}

.form-container {
  width: 100%;
  max-width: 380px;
}
</style>
