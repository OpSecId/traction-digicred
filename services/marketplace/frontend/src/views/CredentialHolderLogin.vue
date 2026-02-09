<template>
  <div class="credential-holder-login">
    <LoginLayout
      variant="holder"
      brand-badge="Credential Holder"
      brand-badge-icon="pi-user"
      brand-title="Student or Job Seeker"
      brand-tagline="Ask your education institution for an invitation to the marketplace channel."
      :brand-features="[
        'Browse jobs, scholarships, and opportunities',
        'Connect with employers using verified credentials',
        'Join via DigiCred Wallet on your phone',
      ]"
    >
      <div class="holder-content">
        <div class="holder-intro">
          <h2>Join the marketplace</h2>
          <p>
            To access the channel, ask your school, college, or education institution for an
            invitation. They will provide you with a link or QR code to join.
          </p>
        </div>

        <ConnectCard
          v-if="hasConnectionInfo"
          :active-invitation="activeInvitation"
          :pwa-url="pwaUrl"
        />

        <div v-else class="holder-no-invitation">
          <p class="no-invitation-message">
            <i class="pi pi-info-circle"></i>
            Connection details are provided by your institution. Contact your school or program
            administrator to receive an invitation to the marketplace channel.
          </p>
        </div>

        <router-link to="/" class="login-back-link">
          <i class="pi pi-arrow-left"></i>
          Back to marketplace
        </router-link>
      </div>
    </LoginLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import LoginLayout from '@/components/LoginLayout.vue';
import ConnectCard from '@/components/ConnectCard.vue';
import { getActiveInvitation } from '@/api/oob';
import { getAppDomain } from '@/services/configService';

const activeInvitation = ref<{ invitation_url: string | null; qr_url: string | null }>({
  invitation_url: null,
  qr_url: null,
});

const pwaUrl = computed(() => {
  try {
    return getAppDomain().replace(/\/$/, '');
  } catch {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
});

const hasConnectionInfo = computed(() =>
  !!(activeInvitation.value.invitation_url || activeInvitation.value.qr_url || pwaUrl.value)
);

onMounted(async () => {
  activeInvitation.value = await getActiveInvitation();
});
</script>

<style scoped lang="scss">
@use '@/assets/page-common.scss';
@use '@/assets/variables.scss' as *;

.credential-holder-login {
  width: 100%;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.holder-content {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.holder-intro {
  margin-bottom: 0;

  h2 {
    font-size: 1.35rem;
    font-weight: 700;
    color: $channel-primary;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 0.95rem;
    line-height: 1.55;
    color: $marketplace-text-muted;
    margin: 0;
  }
}

.holder-no-invitation {
  padding: 20px;
  background: rgba($channel-primary, 0.06);
  border: 1px solid rgba($channel-primary, 0.2);
  border-radius: 10px;
}

.no-invitation-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: $marketplace-text-muted;
  margin: 0;

  i {
    flex-shrink: 0;
    font-size: 1.25rem;
    color: $channel-primary;
    margin-top: 2px;
  }
}

</style>
