<template>
  <div class="job-card" @click="$emit('click', job.id)">
    <div class="job-card-header" :style="headerStyle(job)" :class="{ 'has-image': job.employerImage }">
      <span class="job-card-category">{{ job.category }}</span>
      <div class="employer-avatar" :style="avatarStyle(job.employerName)">
        <img v-if="job.employerLogo" :src="job.employerLogo" :alt="job.employerName" class="employer-logo" />
        <span v-else>{{ employerInitials(job.employerName) }}</span>
      </div>
    </div>
    <div class="job-card-body">
      <h3>{{ job.name }}</h3>
      <p class="employer-name">{{ job.employerName }}</p>
      <p class="job-description">{{ job.description }}</p>
      <span class="job-card-cta">View <i class="pi pi-arrow-right"></i></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { avatarStyle, headerStyle, employerInitials } from '@/utils/employerUtils';
import type { JobWithEmployer } from '@/api/jobs';

defineProps<{ job: JobWithEmployer }>();
defineEmits<{ click: [jobId: string] }>();
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.job-card {
  flex: 0 0 220px;
  min-width: 220px;
  height: 220px;
  display: flex;
  flex-direction: column;
  background: $marketplace-bg-card;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid $marketplace-panel-border;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;

  @media (min-width: $breakpoint-desktop) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 51, 102, 0.12);
    }
  }
}

.job-card-header {
  height: 64px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 40%, rgba(0, 0, 0, 0.08) 100%);
    pointer-events: none;
  }

  &.has-image::after {
    background: linear-gradient(to bottom, transparent 20%, rgba(0, 0, 0, 0.4) 100%);
  }
}

.job-card-category {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  align-self: flex-start;
  position: relative;
  z-index: 1;
}

.job-card-header.has-image .job-card-category {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.employer-avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  align-self: flex-end;

  .employer-logo {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.job-card-body {
  flex: 1;
  min-height: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.job-card-body h3 {
  font-size: 0.9rem;
  font-weight: 700;
  color: $marketplace-primary;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.employer-name {
  font-size: 0.7rem;
  color: $marketplace-text-muted;
  margin: 0 0 4px 0;
  font-weight: 500;
}

.job-description {
  font-size: 0.75rem;
  color: $marketplace-text;
  line-height: 1.3;
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.6em;
}

.job-card-cta {
  font-size: 0.8rem;
  font-weight: 600;
  color: $marketplace-accent-alt;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: auto;
  flex-shrink: 0;
  padding-top: 4px;
}
</style>
