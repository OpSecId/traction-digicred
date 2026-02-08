<template>
  <div v-if="hasConnectionInfo" class="connect-content">
    <div class="connect-header">
      <a
        v-if="qrClickUrl"
        :href="qrClickUrl"
        class="join-channel-qr-wrap qr-clickable"
        :aria-label="qrMode === 'didcomm' ? 'Join channel' : 'Open app'"
        @click.prevent="onQrClick"
      >
        <QrcodeVue
          v-if="qrValue"
          :value="qrValue"
          :size="140"
          level="H"
          render-as="svg"
          foreground="#003366"
          background="#ffffff"
          :margin="0"
          :gradient="true"
          gradient-type="linear"
          gradient-start-color="#003366"
          gradient-end-color="#3c5973"
          class="join-channel-qr"
        />
        <div class="join-channel-qr-badge">
          <img :src="appIconUrl" alt="" class="join-channel-qr-icon" />
        </div>
      </a>
      <div v-else class="join-channel-qr-wrap">
        <QrcodeVue
          v-if="qrValue"
          :value="qrValue"
          :size="140"
          level="H"
          render-as="svg"
          foreground="#003366"
          background="#ffffff"
          :margin="0"
          :gradient="true"
          gradient-type="linear"
          gradient-start-color="#003366"
          gradient-end-color="#3c5973"
          class="join-channel-qr"
        />
        <div class="join-channel-qr-badge">
          <img :src="appIconUrl" alt="" class="join-channel-qr-icon" />
        </div>
      </div>
      <div class="connect-title">
        <h3>DigiCred Wallet</h3>
        <div class="platform-icons" aria-label="Available on Android and iOS">
          <i class="pi pi-android" title="Android"></i>
          <i class="pi pi-apple" title="iOS"></i>
        </div>
        <div class="mode-badges">
          <button
            type="button"
            class="mode-badge"
            :class="{ active: qrMode === 'didcomm' }"
            :disabled="!invitation.qr_url && !invitation.invitation_url"
            @click="qrMode = 'didcomm'"
          >
            DIDComm
          </button>
          <button
            type="button"
            class="mode-badge"
            :class="{ active: qrMode === 'pwa' }"
            @click="qrMode = 'pwa'"
          >
            PWA
          </button>
        </div>
      </div>
    </div>
    <p class="join-channel-desc">
      <template v-if="qrMode === 'didcomm'">
        Scan or tap QR code with DigiCred Wallet to join the channel.
      </template>
      <template v-else>
        Scan or tap QR code to open the app in your browser.
      </template>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import QrcodeVue from 'qrcode.vue';
import { getAppIconUrl, getAppDomain } from '@/services/configService';
import { isMobile } from '@/utils/isMobile';

export interface ActiveInvitation {
  invitation_url: string | null;
  qr_url: string | null;
}

const props = withDefaults(
  defineProps<{
    activeInvitation?: ActiveInvitation | null;
    pwaUrl?: string;
  }>(),
  {
    activeInvitation: () => ({ invitation_url: null, qr_url: null }),
    pwaUrl: undefined,
  }
);

const toast = useToast();
const appIconUrl = getAppIconUrl();
const qrMode = ref<'didcomm' | 'pwa'>('didcomm');

const effectivePwaUrl = computed(() => {
  if (props.pwaUrl) return props.pwaUrl;
  try {
    return getAppDomain().replace(/\/$/, '');
  } catch {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
});

const invitation = computed(() => props.activeInvitation ?? { invitation_url: null, qr_url: null });

const qrValue = computed(() => {
  if (qrMode.value === 'pwa') {
    return effectivePwaUrl.value;
  }
  return invitation.value.qr_url ?? invitation.value.invitation_url ?? '';
});

const hasConnectionInfo = computed(
  () =>
    !!(invitation.value.invitation_url || invitation.value.qr_url || effectivePwaUrl.value)
);

const qrClickUrl = computed(() => {
  if (qrMode.value === 'didcomm' && invitation.value.invitation_url) {
    return invitation.value.invitation_url;
  }
  if (qrMode.value === 'pwa' && effectivePwaUrl.value) {
    return effectivePwaUrl.value;
  }
  return null;
});

function onQrClick() {
  const url = qrClickUrl.value;
  if (!url) return;
  if (qrMode.value === 'pwa') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  // DIDComm
  if (isMobile()) {
    toast.add({
      severity: 'secondary',
      life: 4500,
      summary: '',
      detail: 'Opens in DigiCred app.',
      closable: false,
    });
    window.location.href = url;
  } else {
    toast.add({
      severity: 'info',
      life: 8000,
      summary: 'Scan QR code',
      detail: 'On desktop, scan the QR code with your DigiCred wallet to join.',
      closable: true,
    });
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.connect-content {
  width: 100%;
}

.connect-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
}

.connect-title {
  min-width: 0;

  h3 {
    margin: 0 0 10px 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: $marketplace-primary;
  }

  .platform-icons {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;

    i {
      font-size: 1.25rem;
      color: $marketplace-text-muted;

      &.pi-android {
        color: #3ddc84;
      }

      &.pi-apple {
        color: $marketplace-text;
      }
    }
  }

  .mode-badges {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .mode-badge {
    display: block;
    width: 100%;
    padding: 8px 12px;
    font-size: 0.8rem;
    font-weight: 600;
    text-align: left;
    border: 1px solid $marketplace-panel-border;
    border-radius: 8px;
    background: $marketplace-bg;
    color: $marketplace-text-muted;
    cursor: pointer;
    transition: background 0.2s, color 0.2s, border-color 0.2s;

    &:hover:not(:disabled) {
      background: rgba(0, 51, 102, 0.06);
      color: $marketplace-primary;
      border-color: rgba(0, 51, 102, 0.3);
    }

    &.active {
      background: $marketplace-primary;
      color: white;
      border-color: $marketplace-primary;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.join-channel-qr-wrap {
  position: relative;
  flex-shrink: 0;
  width: 148px;
  height: 148px;
  display: block;
  text-decoration: none;

  &.qr-clickable {
    cursor: pointer;

    &:hover .join-channel-qr {
      box-shadow: 0 4px 16px rgba(0, 51, 102, 0.15);
    }
  }
}

.join-channel-qr {
  padding: 4px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 51, 102, 0.08);
  border: 1px solid rgba(0, 51, 102, 0.08);
  overflow: hidden;
  display: block;

  :deep(canvas),
  :deep(svg) {
    display: block;
    border-radius: 6px;
  }
}

.join-channel-qr-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 51, 102, 0.12);
  border: 2px solid white;
}

.join-channel-qr-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.join-channel-desc {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: $marketplace-text-muted;
}
</style>
