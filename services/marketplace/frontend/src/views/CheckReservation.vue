<template>
  <div class="check-reservation">
    <section class="check-section">
      <h1 class="page-title">Check on my reservation</h1>
      <p class="page-desc">Enter your reservation ID to view status and details.</p>

      <form class="lookup-form" @submit.prevent="handleLookup">
        <div class="input-wrap">
          <input
            v-model="reservationId"
            type="text"
            placeholder="e.g. REQ-7K2M9 or urn:reservation:REQ-7K2M9"
            class="input"
            autocomplete="off"
          />
          <button type="submit" class="btn-lookup" :disabled="loading || !reservationId.trim()">
            <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-search'"></i>
            {{ loading ? 'Looking up...' : 'Look up' }}
          </button>
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <p v-else-if="notFound" class="not-found">Reservation not found. Please check your ID.</p>
      </form>
    </section>

    <section v-if="reservation" class="result-section">
      <div class="reservation-card">
        <div class="card-body">
          <span class="status-badge" :class="reservation.status">{{ reservation.status }}</span>
          <p v-if="credValidity" class="validity">{{ credValidity }}</p>
        </div>
        <div class="card-footer">
          <router-link to="/" class="link-back">← Back to marketplace</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { getReservationById } from '@/api/reservations';
import type { TenantRequest } from '@/types/demo';

const reservationId = ref('');
const reservation = ref<TenantRequest | null>(null);
const loading = ref(false);
const error = ref('');
const notFound = ref(false);

const credValidity = computed(() => {
  const c = reservation.value?.credential as Record<string, unknown> | undefined;
  const from = c?.validFrom as string | undefined;
  const until = c?.validUntil as string | undefined;
  if (!from && !until) return null;
  const fromStr = from ? new Date(from).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '';
  const untilStr = until ? new Date(until).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '';
  if (fromStr && untilStr) return `Valid ${fromStr} – ${untilStr}`;
  if (untilStr) return `Valid until ${untilStr}`;
  return `Valid from ${fromStr}`;
});

async function handleLookup() {
  const id = reservationId.value.trim();
  if (!id) return;
  loading.value = true;
  error.value = '';
  notFound.value = false;
  reservation.value = null;
  try {
    const result = await getReservationById(id);
    if (result) {
      reservation.value = result;
    } else {
      notFound.value = true;
    }
  } catch (e) {
    error.value = 'Failed to look up reservation. Please try again.';
  } finally {
    loading.value = false;
  }
}

</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.check-reservation {
  min-height: 60vh;
  padding: 2rem 1rem;
  max-width: 520px;
  margin: 0 auto;
}

.check-section {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: $marketplace-text;
  margin: 0 0 8px;
}

.page-desc {
  font-size: 1rem;
  color: $marketplace-text-muted;
  margin: 0 0 24px;
}

.lookup-form {
  .input-wrap {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    .input {
      flex: 1;
      min-width: 200px;
      padding: 12px 16px;
      font-size: 1rem;
      border: 1px solid $marketplace-panel-border;
      border-radius: 10px;
      background: $marketplace-bg-card;
      color: $marketplace-text;
      outline: none;
      transition: border-color 0.2s;

      &::placeholder {
        color: $marketplace-text-muted;
      }

      &:focus {
        border-color: $marketplace-primary;
      }
    }

    .btn-lookup {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      font-size: 1rem;
      font-weight: 600;
      border: none;
      border-radius: 10px;
      background: $marketplace-primary;
      color: white;
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover:not(:disabled) {
        opacity: 0.9;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  .error-msg,
  .not-found {
    margin: 12px 0 0;
    font-size: 0.9rem;
    color: $marketplace-danger;
  }

  .not-found {
    color: $marketplace-text-muted;
  }
}

.result-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.reservation-card {
  background: $marketplace-bg-card;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid $marketplace-panel-border;
  overflow: hidden;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 20px;
  text-transform: uppercase;

  &.pending {
    background: rgba(90, 90, 90, 0.15);
    color: #4a5568;
  }

  &.approved {
    background: rgba(51, 108, 55, 0.15);
    color: $marketplace-success;
  }

  &.rejected {
    background: rgba(248, 73, 73, 0.12);
    color: $marketplace-danger;
  }
}

.card-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.validity {
  margin: 0;
  font-size: 0.95rem;
  color: $marketplace-text-muted;
}

.card-footer {
  padding: 16px 20px;
  border-top: 1px solid $marketplace-panel-border;
  background: rgba(0, 0, 0, 0.02);
}

.link-back {
  font-size: 0.9rem;
  font-weight: 500;
  color: $marketplace-primary;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
