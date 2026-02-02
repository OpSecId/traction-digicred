import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Simulated employer session - in demo mode, user can "log in" as an employer
export const useEmployerStore = defineStore('employer', () => {
  const currentEmployerId = ref<string | null>(null);

  const isEmployer = computed(() => !!currentEmployerId.value);

  function setEmployer(id: string | null) {
    currentEmployerId.value = id;
  }

  function clearEmployer() {
    currentEmployerId.value = null;
  }

  return {
    currentEmployerId,
    isEmployer,
    setEmployer,
    clearEmployer,
  };
});
