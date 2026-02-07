import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useEmployerStore } from './employerStore';

describe('employerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with no employer', () => {
    const store = useEmployerStore();
    expect(store.currentEmployerId).toBeNull();
    expect(store.isEmployer).toBe(false);
  });

  it('setEmployer sets current employer', () => {
    const store = useEmployerStore();
    store.setEmployer('emp-123');
    expect(store.currentEmployerId).toBe('emp-123');
    expect(store.isEmployer).toBe(true);
  });

  it('clearEmployer resets to null', () => {
    const store = useEmployerStore();
    store.setEmployer('emp-123');
    store.clearEmployer();
    expect(store.currentEmployerId).toBeNull();
    expect(store.isEmployer).toBe(false);
  });

  it('setEmployer(null) clears employer', () => {
    const store = useEmployerStore();
    store.setEmployer('emp-123');
    store.setEmployer(null);
    expect(store.currentEmployerId).toBeNull();
    expect(store.isEmployer).toBe(false);
  });
});
