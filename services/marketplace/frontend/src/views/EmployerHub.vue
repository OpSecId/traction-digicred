<template>
  <div class="employer-hub">
    <div class="hub-hero">
      <h1>Employer Hub</h1>
      <p>Manage your job postings and applicants</p>
    </div>

    <div v-if="employerStore.isEmployer" class="employer-dashboard">
      <div class="marketplace-card employer-card">
        <div class="employer-info">
          <h3>{{ currentEmployer?.name }}</h3>
          <p>{{ jobCount }} job posting(s)</p>
        </div>
        <div class="employer-actions">
          <router-link to="/employer/jobs" class="action-btn primary">
            <i class="pi pi-list"></i>
            Manage Jobs
          </router-link>
          <button class="action-btn secondary" @click="employerStore.clearEmployer()">
            Sign out
          </button>
        </div>
      </div>
    </div>

    <div v-else class="onboard-prompt">
      <div class="marketplace-card onboard-card">
        <i class="pi pi-briefcase onboard-icon"></i>
        <h3>Become an Employer</h3>
        <p>Post job openings and manage applicants through Apply Utopia.</p>
        <router-link to="/employer/onboard" class="action-btn primary">
          Get Started
        </router-link>
      </div>

      <div class="demo-employers">
        <h4>Demo: Sign in as employer</h4>
        <div
          v-for="emp in demoStore.employers"
          :key="emp.id"
          class="marketplace-card employer-option"
          @click="selectEmployer(emp.id)"
        >
          <div class="employer-option-content">
            <span class="employer-name">{{ emp.name }}</span>
            <span class="job-count">{{ emp.jobPostings?.length || 0 }} jobs</span>
          </div>
          <i class="pi pi-chevron-right"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDemoStore } from '@/store/demoStore';
import { useEmployerStore } from '@/store/employerStore';

const demoStore = useDemoStore();
const employerStore = useEmployerStore();

const currentEmployer = computed(() => {
  if (!employerStore.currentEmployerId) return null;
  return demoStore.getEmployerById(employerStore.currentEmployerId);
});

const jobCount = computed(() => {
  if (!employerStore.currentEmployerId) return 0;
  return demoStore.getJobsByEmployer(employerStore.currentEmployerId).length;
});

function selectEmployer(id: string) {
  employerStore.setEmployer(id);
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.employer-hub {
  padding: 16px;
  padding-bottom: 24px;
}

.hub-hero {
  margin-bottom: 24px;

  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: $marketplace-primary;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 1rem;
    color: $marketplace-text-muted;
    margin: 0;
  }
}

.employer-card {
  padding: 20px;
  margin-bottom: 16px;

  .employer-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .employer-info h3 {
    font-size: 1.2rem;
    color: $marketplace-primary;
    margin: 0 0 4px 0;
  }

  .employer-info p {
    font-size: 0.9rem;
    color: $marketplace-text-muted;
    margin: 0 0 16px 0;
  }
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: none;

  &.primary {
    background: $marketplace-primary;
    color: $marketplace-text-on-primary;
  }

  &.secondary {
    background: transparent;
    color: $marketplace-text-muted;
    border: 1px solid $marketplace-panel-border;
    margin-top: 8px;
  }
}

.onboard-prompt {
  .onboard-card {
    padding: 24px;
    text-align: center;
    margin-bottom: 24px;

    .onboard-icon {
      font-size: 3rem;
      color: $marketplace-primary;
      margin-bottom: 16px;
    }

    h3 {
      font-size: 1.25rem;
      color: $marketplace-primary;
      margin: 0 0 8px 0;
    }

    p {
      font-size: 0.95rem;
      color: $marketplace-text-muted;
      margin: 0 0 20px 0;
      line-height: 1.5;
    }
  }
}

.demo-employers {
  h4 {
    font-size: 0.95rem;
    color: $marketplace-text-muted;
    margin: 0 0 12px 0;
  }
}

.employer-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  margin-bottom: 8px;
  cursor: pointer;

  .employer-option-content {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .employer-name {
      font-weight: 600;
      color: $marketplace-primary;
    }

    .job-count {
      font-size: 0.85rem;
      color: $marketplace-text-muted;
    }
  }

  i {
    color: $marketplace-text-muted;
  }
}
</style>
