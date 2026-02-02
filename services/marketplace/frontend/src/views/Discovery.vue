<template>
  <div class="discovery-page">
    <!-- Hero banner -->
    <div class="hero-banner">
      <div class="hero-content">
        <h1>Find your next opportunity</h1>
        <p>Verified employers. Real jobs. Your career starts here.</p>
      </div>
      <div class="hero-image" />
    </div>

    <!-- Fixed recommendation widget -->
    <section v-if="!demoStore.loading && !demoStore.error" class="recommended-section-fixed-container">
      <div class="category-section recommended-section recommended-section-fixed">
        <!-- Spacer when header hidden (same height as header) so section height stays constant -->
        <div v-if="!transcriptStore.transcriptShared" class="recommended-header-spacer" aria-hidden="true"></div>
        <div v-else class="recommended-header">
          <h2 class="section-title recommended-title">
            <span class="recommended-title-icon" aria-hidden="true"><i class="pi pi-star-fill"></i></span>
            Recommended for you
          </h2>
          <button
            type="button"
            class="clear-recommendations-btn"
            :disabled="transcriptStore.loading"
            @click="transcriptStore.resetTranscript()"
          >
            Clear
          </button>
          <button
            type="button"
            class="update-recommendations-btn"
            :disabled="transcriptStore.loading"
            @click="showShareModal = true"
          >
            <i v-if="transcriptStore.loading" class="pi pi-spin pi-spinner"></i>
            <i v-else class="pi pi-refresh"></i>
            {{ transcriptStore.loading ? 'Updating...' : 'Update' }}
          </button>
        </div>

        <!-- Fixed-height container: CTA or cards (same 200px in both states) -->
        <div class="recommended-content">
          <!-- Before transcript shared: CTA to share -->
          <div v-if="!transcriptStore.transcriptShared" class="share-transcript-cta">
            <div class="share-cta-icon">
              <i class="pi pi-sparkles"></i>
            </div>
            <h3 class="share-cta-headline">Get personalised recommendations</h3>
            <p class="share-cta-subline">Share your transcript once—we’ll match you with the best opportunities.</p>
            <button
              class="share-transcript-btn"
              :disabled="transcriptStore.loading"
              @click="showShareModal = true"
            >
              <i v-if="transcriptStore.loading" class="pi pi-spin pi-spinner"></i>
              <i v-else class="pi pi-share-alt"></i>
              {{ transcriptStore.loading ? 'Analyzing...' : 'Share my skills' }}
            </button>
          </div>

          <!-- After transcript shared: matching opportunities -->
          <div v-else class="cards-scroll">
          <div
            v-for="job in transcriptStore.customRecommendations"
            :key="job.id"
            class="job-card"
            @click="goToJob(job.id)"
          >
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
          <div v-if="transcriptStore.customRecommendations.length === 0" class="no-matches">
            No matching opportunities found. Browse categories below.
          </div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="demoStore.loading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>Loading opportunities...</p>
    </div>

    <div v-else-if="demoStore.error" class="error-state">
      <i class="pi pi-exclamation-triangle"></i>
      <p>Unable to load jobs. Please try again later.</p>
    </div>

    <!-- Scrollable content area -->
    <div v-else class="results-section">
      <!-- Share skills modal: confirmation → loading → credential selector -->
      <div v-if="showShareModal" class="modal-overlay" @click.self="closeShareModal">
        <div class="modal-content share-modal share-modal-branded">
          <div class="share-modal-backdrop" />
          <img src="/img/digicred/logo-marketplace.svg" alt="Apply Utopia" class="share-modal-logo" />
          <div class="share-modal-content">
          <div class="modal-header">
            <h3>Share your skills</h3>
          </div>

          <!-- Step 1: Confirmation and explanation -->
          <template v-if="shareModalStep === 'confirm'">
            <div class="modal-description-block">
              <p class="modal-description">
                We'll send you a presentation request. Choose a transcript credential from your wallet to share your skills and get personalised job recommendations.
              </p>
              <button
                type="button"
                class="modal-info-icon"
                aria-label="Privacy information"
                :aria-expanded="showPrivacyInfo"
                @click="showPrivacyInfo = !showPrivacyInfo"
              >
                <i class="pi pi-info-circle"></i>
              </button>
            </div>
            <div v-if="showPrivacyInfo" class="modal-privacy-info">
              This is privacy preserving. We'll send an anonymous transcript that will be analysed to match you with relevant opportunities—your identity stays private.
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="closeShareModal">Cancel</button>
              <button type="button" class="btn-primary" :disabled="transcriptStore.fetchingCredentials" @click="handlePresentTranscript">
                Present transcript
              </button>
            </div>
          </template>

          <!-- Step 2: Loading while fetching presentation request -->
          <template v-else-if="shareModalStep === 'loading'">
            <div class="presentation-loading">
              <i class="pi pi-spin pi-spinner"></i>
              <p>Getting presentation request...</p>
              <p class="loading-hint">Loading your credentials</p>
            </div>
          </template>

          <!-- Step 3: Select credential (transcript types only) -->
          <template v-else-if="shareModalStep === 'select'">
            <p class="modal-description">Choose a transcript to share:</p>
            <div class="credential-list">
              <div class="credential-list-inner">
                <label
                  v-for="cred in transcriptStore.availableCredentials"
                  :key="cred.id"
                  class="credential-option credential-option-branded"
                  :class="{ selected: selectedCredentialId === cred.id }"
                >
                  <div class="credential-card-inner">
                    <div class="credential-card-content">
                      <span v-if="cred.establishmentName" class="credential-establishment">{{ cred.establishmentName }}</span>
                      <span class="credential-name">{{ cred.name }}</span>
                      <span class="credential-type">{{ cred.type }}</span>
                    </div>
                    <div class="credential-card-logo">
                      <img v-if="cred.logo" :src="cred.logo" :alt="cred.establishmentName || cred.name" class="credential-logo-img" />
                      <span v-else class="credential-logo-initials">{{ establishmentInitials(cred.establishmentName || cred.name) }}</span>
                    </div>
                  </div>
                  <input v-model="selectedCredentialId" type="radio" :value="cred.id" />
                </label>
              </div>
            </div>
            <div v-if="transcriptStore.availableCredentials.length === 0" class="no-credentials">
              No transcript credentials found.
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="closeShareModal">Cancel</button>
              <button
                type="button"
                class="btn-primary"
                :disabled="!selectedCredentialId || transcriptStore.loading"
                @click="handleShareSelected"
              >
                <i v-if="transcriptStore.loading" class="pi pi-spin pi-spinner"></i>
                {{ transcriptStore.loading ? 'Analyzing...' : 'Share selected' }}
              </button>
            </div>
          </template>
          </div>
        </div>
      </div>

      <!-- Each category gets its own section with horizontal scrolling cards -->
      <section
        v-for="category in visibleCategories"
        :key="category"
        class="category-section"
      >
        <h2 class="section-title">{{ category }}</h2>
        <div class="cards-scroll">
          <div
            v-for="job in jobsByCategory(category)"
            :key="job.id"
            class="job-card"
            @click="goToJob(job.id)"
          >
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
        </div>
      </section>

      <div v-if="visibleCategories.length === 0" class="empty-state">
        <i class="pi pi-inbox"></i>
        <p>No jobs match your search. Try a different search term.</p>
      </div>
    </div>

    <!-- Floating search bar at bottom -->
    <div class="floating-search-bar">
      <div class="search-bar">
        <i class="pi pi-search"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search jobs or employers..."
          class="search-input"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDemoStore } from '@/store/demoStore';
import { useTranscriptStore } from '@/store/transcriptStore';
import type { JobWithEmployer } from '@/types/demo';

const router = useRouter();
const demoStore = useDemoStore();
const transcriptStore = useTranscriptStore();

const searchQuery = ref('');
const showShareModal = ref(false);
const shareModalStep = ref<'confirm' | 'loading' | 'select'>('confirm');
const selectedCredentialId = ref<string | null>(null);
const showPrivacyInfo = ref(false);

function closeShareModal() {
  showShareModal.value = false;
  shareModalStep.value = 'confirm';
  selectedCredentialId.value = null;
  showPrivacyInfo.value = false;
}

async function handlePresentTranscript() {
  shareModalStep.value = 'loading';
  try {
    await transcriptStore.fetchPresentationCredentials();
    shareModalStep.value = 'select';
    if (transcriptStore.availableCredentials.length > 0) {
      selectedCredentialId.value = transcriptStore.availableCredentials[0].id;
    }
  } catch (e) {
    console.error('Failed to get credentials:', e);
    shareModalStep.value = 'confirm';
  }
}

async function handleShareSelected() {
  if (!selectedCredentialId.value) return;
  try {
    await transcriptStore.shareTranscript([selectedCredentialId.value]);
    closeShareModal();
  } catch (e) {
    console.error('Failed to share transcript:', e);
  }
}

const visibleCategories = computed(() => {
  const cats = demoStore.categories.filter((c) => c !== 'All');
  const jobs = filteredJobs.value;
  return cats.filter((cat) =>
    jobs.some((j) => j.category === cat)
  );
});

const filteredJobs = computed(() => {
  let jobs = demoStore.allJobs;
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    jobs = jobs.filter(
      (j) =>
        j.name.toLowerCase().includes(q) ||
        j.employerName.toLowerCase().includes(q) ||
        (j.description && j.description.toLowerCase().includes(q))
    );
  }
  return jobs;
});

function jobsByCategory(category: string): JobWithEmployer[] {
  return filteredJobs.value.filter((j) => j.category === category);
}

function employerInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = [
  '#003366',
  '#3c5973',
  '#6666cc',
  '#336C37',
  '#87623D',
  '#485773',
];

function getEmployerColor(employerName: string): string {
  const hash = employerName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function avatarStyle(employerName: string): { backgroundColor: string } {
  return { backgroundColor: getEmployerColor(employerName) };
}

function headerStyle(job: { employerName: string; employerImage?: string }): Record<string, string> {
  if (job.employerImage) {
    return {
      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%), url(${job.employerImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  const base = getEmployerColor(job.employerName);
  return {
    background: `linear-gradient(145deg, ${base} 0%, ${base}cc 100%)`,
  };
}

function goToJob(jobId: string) {
  router.push({ name: 'JobView', params: { jobId } });
}

function establishmentInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/variables.scss' as *;

.discovery-page {
  padding: 0 16px;
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

.floating-search-bar {
  position: fixed;
  bottom: 80px; /* Above bottom nav (64px) + spacing */
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 600px;
  z-index: 100;
  padding: 0 16px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border-radius: 24px;
  padding: 12px 18px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid transparent;
  transition: all 0.3s ease;

  i {
    color: $marketplace-text-muted;
    font-size: 1.1rem;
    transition: color 0.3s ease;
  }

  &:focus-within {
    border-color: $marketplace-primary;
    box-shadow: 0 6px 24px rgba(0, 51, 102, 0.25), 0 4px 12px rgba(0, 51, 102, 0.15);
    transform: translateY(-2px);

    i {
      color: $marketplace-primary;
    }
  }
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.95rem;
  font-family: inherit;

  &::placeholder {
    color: $marketplace-text-muted;
  }
}

/* Fixed recommendation section container */
.recommended-section-fixed-container {
  position: sticky;
  top: 0;
  z-index: 50;
  background: $marketplace-bg;
  margin: 0 -16px;
  padding: 12px 16px 8px;
  border-bottom: 1px solid rgba(0, 51, 102, 0.06);
}

.results-section {
  padding: 0;
  padding-top: 16px;
}

/* Category section - each has a horizontal scroll of cards */
.category-section {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid rgba(0, 51, 102, 0.06);

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
}

/* Recommendation section when fixed - remove default spacing */
.recommended-section-fixed-container .category-section {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

/* Fixed header height so spacer matches when header is hidden */
.recommended-header,
.recommended-header-spacer {
  height: 36px;
  min-height: 36px;
  flex-shrink: 0;
}

.recommended-header-spacer {
  margin-bottom: 8px;
}

.recommended-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.recommended-header .recommended-title {
  margin: 0;
  flex: 1;
}

.recommended-header .clear-recommendations-btn,
.recommended-header .update-recommendations-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.clear-recommendations-btn {
  color: $marketplace-text-muted;
  background: transparent;
  border: 1px solid rgba(0, 51, 102, 0.15);

  &:hover:not(:disabled) {
    color: $marketplace-primary;
    background: rgba(0, 51, 102, 0.06);
    border-color: rgba(0, 51, 102, 0.25);
  }
}

.update-recommendations-btn {
  color: $marketplace-primary;
  background: rgba(0, 51, 102, 0.08);
  border: 1px solid rgba(0, 51, 102, 0.2);

  &:hover:not(:disabled) {
    background: rgba(0, 51, 102, 0.12);
    border-color: rgba(0, 51, 102, 0.35);
  }
}

/* Fixed-height container so CTA and cards row stay the same height when clearing */
.recommended-content {
  height: 220px;
  min-height: 220px;
  max-height: 220px;
  overflow: hidden;
  flex-shrink: 0;
}

.recommended-section-fixed {
  display: flex;
  flex-direction: column;
}

.recommended-content .cards-scroll {
  height: 100%;
  min-height: 200px;
}

.recommended-section .job-card {
  box-shadow: 0 2px 16px rgba(0, 51, 102, 0.1);
  border: 1px solid rgba(0, 51, 102, 0.12);
}

.recommended-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  color: $marketplace-primary;
  cursor: default;
  user-select: none;

  .recommended-title-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: $marketplace-accent;
    font-size: 1rem;
    pointer-events: none;
  }
}

.share-transcript-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  min-height: 0;
  max-height: 220px;
  padding: 16px 20px;
  box-sizing: border-box;
  background: linear-gradient(145deg, rgba(0, 51, 102, 0.06) 0%, rgba(102, 102, 204, 0.08) 100%);
  border-radius: 16px;
  border: 1px solid rgba(0, 51, 102, 0.12);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, $marketplace-primary, $marketplace-accent-alt);
    opacity: 0.9;
  }
}

.share-cta-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: $marketplace-primary;

  i {
    font-size: 1.75rem;
  }
}

.share-cta-headline {
  font-size: 1.1rem;
  font-weight: 700;
  color: $marketplace-primary;
  margin: 0 0 6px 0;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.share-cta-subline {
  font-size: 0.875rem;
  color: $marketplace-text-muted;
  margin: 0 0 18px 0;
  line-height: 1.4;
  max-width: 260px;
}

.share-transcript-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 28px;
  background: linear-gradient(135deg, $marketplace-primary 0%, $marketplace-secondary 100%);
  color: $marketplace-text-on-primary;
  border: none;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 51, 102, 0.35);
  transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 51, 102, 0.4);
    filter: brightness(1.05);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.85;
    cursor: not-allowed;
    transform: none;
  }

  i {
    font-size: 1.1rem;
  }
}

.no-matches {
  padding: 20px;
  font-size: 0.9rem;
  color: $marketplace-text-muted;
  text-align: center;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
}

.share-modal {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
}

.share-modal-branded {
  position: relative;
  overflow: hidden;
  padding: 0;
  background: transparent; /* whole card uses backdrop below */
}

.share-modal-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: url('/img/digicred/loginDash.png');
  background-size: cover;
  background-position: center;
  opacity: 0.75;
}

.share-modal-branded::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(135deg, rgba(0, 51, 102, 0.97) 0%, rgba(60, 89, 115, 0.98) 50%, rgba(102, 102, 204, 0.96) 100%);
  pointer-events: none;
}

.share-modal-logo {
  position: absolute;
  top: 16px;
  right: 16px;
  height: 32px;
  width: auto;
  z-index: 2;
  opacity: 0.95;
  filter: brightness(0) invert(1);
}

.share-modal-content {
  position: relative;
  z-index: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 85vh;
  overflow: hidden;
}

.share-modal .modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
}

.modal-description-block {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
}

.share-modal .modal-description {
  flex: 1;
  min-width: 0;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.5;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.share-modal .modal-info-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.35);
    color: #fff;
  }

  i {
    font-size: 1.1rem;
  }
}

.share-modal .modal-privacy-info {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
  margin: 0 0 20px 0;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.presentation-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;

  i {
    font-size: 2.5rem;
    color: white;
    margin-bottom: 16px;
  }

  p {
    margin: 0;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.95);
  }

  .loading-hint {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 8px;
  }
}

.credential-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  min-height: 0;
  max-height: min(360px, 55vh);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  background: linear-gradient(145deg, rgba(0, 51, 102, 0.04) 0%, rgba(102, 102, 204, 0.06) 100%);
  border-radius: 12px;
}

.credential-list-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.credential-option {
  display: flex;
  flex-direction: column;
  padding: 16px 18px;
  border: 2px solid rgba(0, 51, 102, 0.12);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  background: white;
  box-shadow: 0 1px 4px rgba(0, 51, 102, 0.04);

  &:hover {
    border-color: rgba(0, 51, 102, 0.25);
    box-shadow: 0 2px 8px rgba(0, 51, 102, 0.08);
  }

  &.selected {
    border-color: $marketplace-primary;
    background: linear-gradient(135deg, rgba(0, 51, 102, 0.06) 0%, rgba(102, 102, 204, 0.08) 100%);
    box-shadow: 0 2px 12px rgba(0, 51, 102, 0.12);
  }

  input {
    display: none;
  }

  .credential-name {
    font-weight: 600;
    color: $marketplace-primary;
    font-size: 0.95rem;
  }

  .credential-type {
    font-size: 0.8rem;
    color: $marketplace-text-muted;
    margin-top: 4px;
  }
}

/* Credential cards: plain light background, logo on right */
.credential-option-branded {
  position: relative;
  overflow: hidden;
  min-height: 72px;
  padding: 0;
  background: rgba(0, 51, 102, 0.04);
  border: 2px solid rgba(0, 51, 102, 0.08);
  border-radius: 12px;
  box-shadow: none;

  &:hover {
    border-color: rgba(0, 51, 102, 0.18);
    background: rgba(0, 51, 102, 0.06);
  }

  &.selected {
    border-width: 3px;
    border-color: $marketplace-primary;
    background: #fff;
    box-shadow: 0 0 0 2px rgba(0, 51, 102, 0.2), 0 2px 12px rgba(0, 51, 102, 0.15);
  }

  .credential-card-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 14px 16px;
  }

  .credential-card-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0;
  }

  .credential-establishment {
    font-size: 0.75rem;
    color: $marketplace-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .credential-option-branded .credential-name {
    color: $marketplace-primary;
    font-size: 1rem;
    font-weight: 600;
  }

  .credential-option-branded .credential-type {
    color: $marketplace-text-muted;
    font-size: 0.8rem;
    margin-top: 0;
  }

  .credential-card-logo {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 51, 102, 0.06);
  }

  .credential-logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .credential-logo-initials {
    font-size: 1rem;
    font-weight: 700;
    color: $marketplace-primary;
  }
}

.share-modal .no-credentials {
  padding: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.share-modal .credential-list .modal-description {
  color: rgba(255, 255, 255, 0.95);
}

.share-modal .modal-actions {
  display: flex;
  gap: 12px;

  button {
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.25);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.4);

    &:hover {
      background: rgba(255, 255, 255, 0.35);
    }
  }

  .btn-primary {
    background: white;
    color: $marketplace-primary;

    &:disabled {
      opacity: 0.8;
      cursor: not-allowed;
    }
  }
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: $marketplace-primary;
  margin: 0 0 14px 0;
}

/* Horizontal scrolling cards - fixed row height to match recommended content */
.cards-scroll {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 4px 0;
  margin: 0 -16px;
  padding-left: 16px;
  padding-right: 16px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  align-items: stretch;
  min-height: 200px;

  &::-webkit-scrollbar {
    display: none;
  }
}

.job-card {
  flex: 0 0 220px;
  width: 220px;
  height: 220px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 51, 102, 0.06);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 1px 8px rgba(0, 51, 102, 0.08);
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
  min-height: 2.6em; /* reserve space for 2 full lines so second line isn't cut */
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

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: $marketplace-text-muted;
  text-align: center;

  i {
    font-size: 2.5rem;
    margin-bottom: 12px;
    color: $marketplace-primary;
  }

  .error-state i {
    color: $marketplace-danger;
  }
}
</style>
