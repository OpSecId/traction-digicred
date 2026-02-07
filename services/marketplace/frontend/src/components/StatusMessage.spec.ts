import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StatusMessage from './StatusMessage.vue';

describe('StatusMessage', () => {
  it('renders loading state with spinner', () => {
    const wrapper = mount(StatusMessage, {
      props: { type: 'loading', message: 'Loading...' },
    });
    expect(wrapper.find('i').classes()).toContain('pi-spinner');
    expect(wrapper.find('p').text()).toBe('Loading...');
  });

  it('renders error state with triangle icon', () => {
    const wrapper = mount(StatusMessage, {
      props: { type: 'error', message: 'Something went wrong' },
    });
    expect(wrapper.find('i').classes()).toContain('pi-exclamation-triangle');
    expect(wrapper.find('p').text()).toBe('Something went wrong');
  });

  it('renders empty state with inbox icon', () => {
    const wrapper = mount(StatusMessage, {
      props: { type: 'empty', message: 'No items found' },
    });
    expect(wrapper.find('i').classes()).toContain('pi-inbox');
    expect(wrapper.find('p').text()).toBe('No items found');
  });

  it('uses custom icon when provided', () => {
    const wrapper = mount(StatusMessage, {
      props: { type: 'empty', message: 'No applicants', icon: 'pi-users' },
    });
    expect(wrapper.find('i').classes()).toContain('pi-users');
  });
});
