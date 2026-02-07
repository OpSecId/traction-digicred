import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAdminStore } from './adminStore';

describe('adminStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts logged out', () => {
    const store = useAdminStore();
    expect(store.isLoggedIn).toBe(false);
    expect(store.isAdmin).toBe(false);
  });

  it('setLoggedIn updates state', () => {
    const store = useAdminStore();
    store.setLoggedIn(true);
    expect(store.isLoggedIn).toBe(true);
    expect(store.isAdmin).toBe(true);
  });

  it('clearAdmin resets to logged out', () => {
    const store = useAdminStore();
    store.setLoggedIn(true);
    store.clearAdmin();
    expect(store.isLoggedIn).toBe(false);
    expect(store.isAdmin).toBe(false);
  });
});
