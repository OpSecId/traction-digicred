import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAdminStore = defineStore('admin', () => {
  const isLoggedIn = ref(false);

  const isAdmin = computed(() => isLoggedIn.value);

  function setLoggedIn(value: boolean) {
    isLoggedIn.value = value;
  }

  function clearAdmin() {
    isLoggedIn.value = false;
  }

  return {
    isLoggedIn,
    isAdmin,
    setLoggedIn,
    clearAdmin,
  };
});
