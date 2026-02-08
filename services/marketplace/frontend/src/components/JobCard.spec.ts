import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import JobCard from './JobCard.vue';
import type { JobWithEmployer } from '@/api/jobs';

const mockJob: JobWithEmployer = {
  id: 'job-1',
  name: 'Software Engineer',
  description: 'Build great products',
  category: 'Technology',
  location: 'Remote',
  employerId: 'emp-1',
  employerName: 'Acme Corp',
};

describe('JobCard', () => {
  it('renders job details', () => {
    const wrapper = mount(JobCard, {
      props: { job: mockJob },
    });
    expect(wrapper.find('h3').text()).toBe('Software Engineer');
    expect(wrapper.find('.employer-name').text()).toBe('Acme Corp');
    expect(wrapper.find('.job-description').text()).toBe('Build great products');
    expect(wrapper.find('.job-card-category').text()).toBe('Technology');
  });

  it('emits click with job id when clicked', async () => {
    const wrapper = mount(JobCard, {
      props: { job: mockJob },
    });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toEqual([['job-1']]);
  });
});
