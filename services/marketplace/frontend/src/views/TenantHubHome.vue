<template>
  <div class="tenant-hub-home">
    <div class="hub-content">
      <!-- Profile card (prominent, at top) -->
      <div class="marketplace-card tenancy-profile-card profile-card-hero">
        <div class="profile-card-header">
          <i class="pi pi-building"></i>
          <span>My Profile</span>
          <button
            type="button"
            class="view-profile-btn"
            :disabled="!employerProfile?.credential"
            @click="showProfileModal = true"
          >
            <i class="pi pi-eye"></i>
            View credential
          </button>
        </div>
        <div class="profile-card-body">
          <div class="profile-name">{{ profileName }}</div>
          <div v-if="profileIndustry" class="profile-detail">
            <i class="pi pi-briefcase"></i>
            {{ profileIndustry }}
          </div>
        </div>

        <div class="contact-section">
          <h4 class="contact-section-title"><i class="pi pi-user"></i> Contact information</h4>
          <dl class="contact-list">
            <div v-if="profileEmail" class="contact-row">
              <dt>Email</dt>
              <dd><a :href="`mailto:${profileEmail}`">{{ profileEmail }}</a></dd>
            </div>
            <div v-if="profileWebsite" class="contact-row">
              <dt>Website</dt>
              <dd><a :href="profileWebsite" target="_blank" rel="noopener noreferrer">{{ profileWebsite }}</a></dd>
            </div>
            <div v-if="!profileEmail && !profileWebsite" class="contact-row contact-row-empty">
              <dd class="contact-empty">No contact details on file</dd>
            </div>
          </dl>
          <router-link to="/reservation/check" class="request-update-link">
            <i class="pi pi-pencil"></i>
            Request profile update
          </router-link>
        </div>

        <div class="tenancy-actions">
          <router-link to="/tenant/jobs" class="action-btn primary">
            <i class="pi pi-list"></i>
            Manage Jobs
          </router-link>
          <router-link to="/tenant/workflows" class="action-btn primary">
            <i class="pi pi-sitemap"></i>
            Manage workflows
          </router-link>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <i class="pi pi-briefcase stat-icon"></i>
          <span class="stat-value">{{ jobCount }}</span>
          <span class="stat-label">Job postings</span>
        </div>
        <div class="stat-card">
          <i class="pi pi-sitemap stat-icon"></i>
          <span class="stat-value">{{ workflowStats.running }}</span>
          <span class="stat-label">Workflows in progress</span>
        </div>
        <div class="stat-card">
          <i class="pi pi-check-circle stat-icon"></i>
          <span class="stat-value">{{ workflowStats.completed }}</span>
          <span class="stat-label">Workflows completed</span>
        </div>
      </div>
    </div>

    <DetailModalCard
      v-if="showProfileModal"
      title="My Profile Credential"
      :credential="employerProfile?.credential ?? null"
      credential-title="MarketplaceProfileCredential"
      @close="showProfileModal = false"
    >
      <template #details>
        <div class="profile-modal-details">
          <dl class="profile-dl">
            <dt>Organization</dt>
            <dd>{{ profileName }}</dd>
            <dt v-if="profileIndustry">Industry</dt>
            <dd v-if="profileIndustry">{{ profileIndustry }}</dd>
            <dt v-if="profileEmail">Email</dt>
            <dd v-if="profileEmail"><a :href="`mailto:${profileEmail}`">{{ profileEmail }}</a></dd>
            <dt v-if="profileWebsite">Website</dt>
            <dd v-if="profileWebsite"><a :href="profileWebsite" target="_blank" rel="noopener noreferrer">{{ profileWebsite }}</a></dd>
          </dl>
        </div>
      </template>
    </DetailModalCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import DetailModalCard from '@/components/DetailModalCard.vue';
import { useEmployerStore } from '@/store/employerStore';
import { getEmployerProfile, listJobPostings, listEmployerWorkflows, profileSubjectFromCredential, emailFromSubject } from '@/api/employerJobs';

const employerStore = useEmployerStore();
const showProfileModal = ref(false);

const employerProfile = ref<Awaited<ReturnType<typeof getEmployerProfile>>>(null);
const apiJobCount = ref(0);
const workflows = ref<Awaited<ReturnType<typeof listEmployerWorkflows>>>([]);

const subject = computed(() => profileSubjectFromCredential(employerProfile.value));

const profileName = computed(() => {
  const name = subject.value.name as string | undefined;
  return name ?? 'Employer';
});

const profileEmail = computed(() => emailFromSubject(subject.value));
const profileIndustry = computed(() => subject.value.industry as string | undefined);
const profileWebsite = computed(() => (subject.value.url as string) || (subject.value.website as string) || undefined);

const jobCount = computed(() => apiJobCount.value);

const workflowStats = computed(() => {
  const list = workflows.value;
  return {
    running: list.filter((w) => w.status === 'running').length,
    completed: list.filter((w) => w.status === 'completed').length,
  };
});

watch(
  () => employerStore.currentEmployerId,
  async (id) => {
    if (!id) {
      employerProfile.value = null;
      apiJobCount.value = 0;
      workflows.value = [];
      return;
    }
    try {
      const [profile, jobsList, workflowsList] = await Promise.all([
        getEmployerProfile(id),
        listJobPostings(id),
        listEmployerWorkflows(id),
      ]);
      employerProfile.value = profile;
      apiJobCount.value = jobsList.length;
      workflows.value = workflowsList;
    } catch {
      employerProfile.value = null;
      apiJobCount.value = 0;
      workflows.value = [];
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.tenant-hub-home {
  max-width: 720px;
}

.hub-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  background: $marketplace-bg-card;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 51, 102, 0.06);
  border: 1px solid $marketplace-panel-border;

  .stat-icon {
    font-size: 1.5rem;
    color: $marketplace-primary;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: $marketplace-primary;
  }

  .stat-label {
    font-size: 0.75rem;
    color: $marketplace-text-muted;
    text-align: center;
    line-height: 1.2;
  }
}

.tenancy-profile-card {
  padding: 20px;
  margin-bottom: 16px;

  &.profile-card-hero {
    padding: 24px 28px;
    border: 2px solid rgba(0, 51, 102, 0.12);
    box-shadow: 0 4px 20px rgba(0, 51, 102, 0.08);
    background: linear-gradient(to bottom, rgba(0, 51, 102, 0.02), transparent);
  }

  .profile-card-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 16px;
    font-size: 0.85rem;
    font-weight: 600;
    color: $marketplace-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 12px;

    i {
      font-size: 1rem;
      color: $marketplace-primary;
    }

    .view-profile-btn {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      font-size: 0.8rem;
      font-weight: 600;
      color: $marketplace-primary;
      background: rgba(0, 51, 102, 0.08);
      border: 1px solid rgba(0, 51, 102, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;

      &:hover:not(:disabled) {
        background: rgba(0, 51, 102, 0.14);
        color: $marketplace-secondary;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .profile-card-body {
    margin-bottom: 20px;

    .profile-name {
      font-size: 1.35rem;
      font-weight: 700;
      color: $marketplace-primary;
      margin-bottom: 8px;
    }

    .profile-detail {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: $marketplace-text;
      margin-bottom: 4px;

      i {
        color: $marketplace-text-muted;
        width: 16px;
        flex-shrink: 0;
      }
    }
  }

  .contact-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid $marketplace-panel-border;
  }

  .contact-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: $marketplace-text-muted;
    margin: 0 0 12px 0;

    i {
      color: $marketplace-primary;
    }
  }

  .contact-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
  }

  .contact-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin: 0;

    dt {
      flex-shrink: 0;
      width: 70px;
      font-size: 0.85rem;
      font-weight: 500;
      color: $marketplace-text-muted;
      margin: 0;
    }

    dd {
      margin: 0;
      font-size: 0.9rem;

      a {
        color: $marketplace-primary;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .contact-row-empty dd {
    flex: 1;
  }

  .contact-empty {
    font-size: 0.9rem;
    color: $marketplace-text-muted;
    font-style: italic;
  }

  .request-update-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 8px 0;
    font-size: 0.875rem;
    font-weight: 500;
    color: $marketplace-primary;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: $marketplace-secondary;
      text-decoration: underline;
    }
  }

  .tenancy-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
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
}

.profile-modal-details {
  padding: 8px 0;
}

.profile-dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 24px;
  margin: 0;

  dt {
    font-weight: 600;
    color: $marketplace-text-muted;
    margin: 0;
  }

  dd {
    margin: 0;

    a {
      color: $marketplace-primary;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
