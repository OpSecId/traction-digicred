import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import AppFooter from './AppFooter.vue';

const router = createRouter({
  history: createMemoryHistory('/'),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/channel', component: { template: '<div/>' } },
    { path: '/tenant/onboard', component: { template: '<div/>' } },
    { path: '/innkeeper', component: { template: '<div/>' } },
  ],
});

describe('AppFooter', () => {
  it('renders footer with nav links', async () => {
    await router.replace('/');
    const wrapper = mount(AppFooter, {
      global: { plugins: [router] },
    });
    const links = wrapper.findAll('a');
    expect(links).toHaveLength(3);
    expect(links[0].attributes('href')).toBe('/channel');
    expect(links[1].attributes('href')).toBe('/tenant/onboard');
    expect(links[2].attributes('href')).toBe('/innkeeper');
  });

  it('renders copyright with current year', async () => {
    await router.replace('/');
    const wrapper = mount(AppFooter, {
      global: { plugins: [router] },
    });
    const year = new Date().getFullYear();
    expect(wrapper.text()).toContain(year.toString());
    expect(wrapper.text()).toContain('Apply Utopia');
    expect(wrapper.text()).toContain('DigiCred Marketplace');
  });
});
