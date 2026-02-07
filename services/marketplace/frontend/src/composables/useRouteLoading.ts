import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

/**
 * Track route loading state for navigation (avoids experimental Suspense).
 */
export function useRouteLoading() {
  const router = useRouter();
  const isPending = ref(false);

  let removeBefore: (() => void) | undefined;
  let removeAfter: (() => void) | undefined;

  onMounted(() => {
    removeBefore = router.beforeEach(() => {
      isPending.value = true;
    });
    removeAfter = router.afterEach(() => {
      isPending.value = false;
    });
  });

  onBeforeUnmount(() => {
    removeBefore?.();
    removeAfter?.();
  });

  return { isPending };
}
