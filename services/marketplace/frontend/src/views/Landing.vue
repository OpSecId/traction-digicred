<template>
  <div class="landing">
    <section class="hero">
      <div class="hero-container">
        <div class="hero-content">
          <h1 class="hero-title">
            The credential-powered marketplace
          </h1>
          <p class="hero-subtitle">
            Join as a tenant to publish jobs, scholarships, and programs. Connect with verified talent through trusted credentials.
          </p>
          <div class="hero-buttons">
            <router-link to="/tenant/onboard" class="btn-primary">
              Request tenancy
            </router-link>
            <a
              v-if="didcommUrl"
              :href="didcommUrl"
              class="btn-secondary"
            >
              Join channel
            </a>
            <router-link v-else to="/channel" class="btn-secondary">
              Join channel
            </router-link>
            <router-link to="/reservation/check" class="btn-tertiary">
              Check on my reservation
            </router-link>
          </div>
        </div>
        <div class="hero-visual">
          <div class="visual-card visual-card-1">
            <i class="pi pi-shield"></i>
            <span>Verified</span>
          </div>
          <div class="visual-card visual-card-2">
            <i class="pi pi-briefcase"></i>
            <span>Publish</span>
          </div>
          <div class="visual-card visual-card-3">
            <i class="pi pi-users"></i>
            <span>Connect</span>
          </div>
        </div>
      </div>
    </section>

    <section class="features">
      <div class="features-container">
        <h2 class="features-title">Why join?</h2>
        <div class="features-grid">
          <article class="feature-card">
            <div class="feature-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <h3>Trusted credentials</h3>
            <p>Connect with candidates whose skills and achievements are verified by trusted issuers.</p>
          </article>
          <article class="feature-card">
            <div class="feature-icon">
              <i class="pi pi-megaphone"></i>
            </div>
            <h3>Publish your offers</h3>
            <p>Post jobs, scholarships, and programs. Reach the right audience with credential-based matching.</p>
          </article>
          <article class="feature-card">
            <div class="feature-icon">
              <i class="pi pi-building"></i>
            </div>
            <h3>Your own tenant space</h3>
            <p>Multi-tenant architecture. Secure, isolated, and ready to scale as you grow.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="cta-container">
        <h2>Ready to get started?</h2>
        <p>Request tenancy to join the marketplace. Once approved, you can publish offers and connect with credential holders.</p>
        <div class="cta-buttons">
          <router-link to="/tenant/onboard" class="btn-primary btn-large">
            Request tenancy
          </router-link>
          <router-link to="/reservation/check" class="btn-outline btn-large">
            Check on my reservation
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getActiveInvitationUrl } from '@/api/oob';

const didcommUrl = ref<string | null>(null);

onMounted(async () => {
  const url = await getActiveInvitationUrl();
  if (url) {
    didcommUrl.value = url.replace(/^https:\/\//, 'didcomm://');
  }
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/variables.scss' as *;

.landing {
  min-height: 100%;
  overflow-x: hidden;
}

/* Hero */
.hero {
  background: linear-gradient(160deg, $marketplace-primary 0%, color.adjust($marketplace-primary, $lightness: -5%) 50%, $marketplace-secondary 100%);
  padding: 3rem 1.5rem 4rem;
  position: relative;

  @media (min-width: $breakpoint-desktop) {
    padding: 4rem 2rem 5rem;
    min-height: 520px;
    display: flex;
    align-items: center;
  }
}

.hero-container {
  max-width: $content-max-width;
  margin: 0 auto;
  display: grid;
  gap: 2.5rem;
  align-items: center;

  @media (min-width: $breakpoint-desktop) {
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
  }
}

.hero-content {
  text-align: center;

  @media (min-width: $breakpoint-desktop) {
    text-align: left;
  }
}

.hero-title {
  font-size: clamp(2rem, 5vw, 2.75rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: white;
  margin: 0 0 1rem;
}

.hero-subtitle {
  font-size: 1.1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 2rem;
  max-width: 440px;

  @media (min-width: $breakpoint-desktop) {
    margin-left: 0;
  }

  @media (max-width: $breakpoint-desktop) {
    margin-left: auto;
    margin-right: auto;
  }
}

.hero-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;

  @media (min-width: $breakpoint-desktop) {
    justify-content: flex-start;
  }
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 600;
  color: $marketplace-primary;
  background: $marketplace-accent;
  border-radius: 10px;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(252, 186, 25, 0.4);
  }
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  text-decoration: none;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: white;
  }
}

.btn-tertiary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 24px;
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  text-decoration: none;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.7);
  }
}

/* Hero visual - floating cards */
.hero-visual {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  perspective: 1000px;

  @media (min-width: $breakpoint-desktop) {
    justify-content: flex-end;
    position: relative;
    min-height: 260px;
  }
}

.visual-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  color: $marketplace-primary;
  font-size: 0.85rem;
  font-weight: 600;

  i {
    font-size: 1.75rem;
  }

  @media (min-width: $breakpoint-desktop) {
    position: absolute;
    width: 110px;
    height: 110px;
  }
}

.visual-card-1 {
  @media (min-width: $breakpoint-desktop) {
    top: 0;
    right: 0;
    transform: rotate(-6deg);
  }
}

.visual-card-2 {
  @media (min-width: $breakpoint-desktop) {
    top: 50%;
    right: 80px;
    transform: translateY(-50%) rotate(4deg);
  }
}

.visual-card-3 {
  @media (min-width: $breakpoint-desktop) {
    bottom: 0;
    right: 20px;
    transform: rotate(-3deg);
  }
}

/* Features */
.features {
  padding: 4rem 1.5rem;
  background: $marketplace-bg;

  @media (min-width: $breakpoint-desktop) {
    padding: 5rem 2rem;
  }
}

.features-container {
  max-width: $content-max-width;
  margin: 0 auto;
}

.features-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: $marketplace-primary;
  text-align: center;
  margin: 0 0 2.5rem;
}

.features-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;

  @media (min-width: $breakpoint-tablet) {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}

.feature-card {
  background: $marketplace-bg-card;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid $marketplace-panel-border;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 51, 102, 0.12);
  }

  h3 {
    font-size: 1.15rem;
    font-weight: 600;
    color: $marketplace-primary;
    margin: 0 0 0.75rem;
  }

  p {
    font-size: 0.95rem;
    line-height: 1.55;
    color: $marketplace-text-muted;
    margin: 0;
  }
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(0, 51, 102, 0.1) 0%, rgba(60, 89, 115, 0.08) 100%);
  border-radius: 12px;
  color: $marketplace-primary;
  font-size: 1.35rem;
  margin-bottom: 1.25rem;
}

/* CTA section */
.cta-section {
  padding: 4rem 1.5rem;
  background: $marketplace-bg-card;
  border-top: 1px solid $marketplace-panel-border;

  @media (min-width: $breakpoint-desktop) {
    padding: 5rem 2rem;
  }
}

.cta-container {
  max-width: 560px;
  margin: 0 auto;
  text-align: center;

  h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: $marketplace-primary;
    margin: 0 0 0.75rem;
  }

  p {
    font-size: 1.05rem;
    line-height: 1.6;
    color: $marketplace-text-muted;
    margin: 0 0 2rem;
  }
}

.cta-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.btn-large {
  padding: 16px 36px;
  font-size: 1.05rem;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 36px;
  font-size: 1.05rem;
  font-weight: 600;
  color: $marketplace-primary;
  background: transparent;
  border: 2px solid $marketplace-primary;
  border-radius: 10px;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: $marketplace-primary;
    color: white;
  }
}

</style>
