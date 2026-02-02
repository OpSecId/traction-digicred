<template>
  <div class="onboard-page">
    <router-link to="/employer" class="back-link">
      <i class="pi pi-arrow-left"></i>
      Back
    </router-link>

    <div class="onboard-content">
      <h1>Become an Employer</h1>
      <p class="subtitle">Register your organization to post jobs on Apply Utopia</p>

      <div class="marketplace-card form-card">
        <form @submit.prevent="submitOnboarding">
          <div class="form-field">
            <label>Company / Organization name</label>
            <input v-model="form.companyName" type="text" required placeholder="Acme Inc." />
          </div>
          <div class="form-field">
            <label>Contact email</label>
            <input v-model="form.contactEmail" type="email" required placeholder="hr@acme.com" />
          </div>
          <div class="form-field">
            <label>Industry (optional)</label>
            <input v-model="form.industry" type="text" placeholder="Technology, Healthcare, etc." />
          </div>
          <button type="submit" class="submit-btn">
            <i class="pi pi-check"></i>
            Complete Registration
          </button>
        </form>
      </div>

      <p class="demo-note">
        In demo mode, use the Employer Hub to sign in as Pizza Utopia or Library of Congress.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const form = ref({
  companyName: '',
  contactEmail: '',
  industry: '',
});

function submitOnboarding() {
  // In a real app, this would call an API. For demo, just redirect.
  router.push({ name: 'Employer', query: { onboarded: '1' } });
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.onboard-page {
  padding: 16px;
  padding-bottom: 24px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: $marketplace-accent-alt;
  font-weight: 500;
  margin-bottom: 20px;
  text-decoration: none;
}

.onboard-content {
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: $marketplace-primary;
    margin: 0 0 8px 0;
  }

  .subtitle {
    font-size: 0.95rem;
    color: $marketplace-text-muted;
    margin: 0 0 24px 0;
  }
}

.form-card {
  padding: 24px;
  margin-bottom: 20px;
}

.form-field {
  margin-bottom: 20px;

  label {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 8px;
    color: $marketplace-text;
  }

  input {
    width: 100%;
    padding: 14px;
    border: 1px solid $marketplace-panel-border;
    border-radius: 10px;
    font-size: 1rem;
    box-sizing: border-box;
  }
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: $marketplace-primary;
  color: $marketplace-text-on-primary;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  margin-top: 8px;
}

.demo-note {
  font-size: 0.85rem;
  color: $marketplace-text-muted;
  text-align: center;
}
</style>
