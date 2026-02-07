<template>
  <div :class="['status-message', `status-${type}`]">
    <i :class="['pi', iconClass]"></i>
    <p>{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    type: 'loading' | 'error' | 'empty';
    message: string;
    icon?: string;
  }>(),
  { icon: undefined }
);

const iconClass = computed(() => {
  if (props.icon) return props.icon;
  if (props.type === 'loading') return 'pi-spin pi-spinner';
  if (props.type === 'error') return 'pi-exclamation-triangle';
  return 'pi-inbox';
});
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.status-message {
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

  p {
    margin: 0;
    font-size: 0.95rem;
  }
}

.status-error i {
  color: $marketplace-danger;
}
</style>
