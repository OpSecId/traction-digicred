import { createWebHistory, createRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'Discovery',
        component: () => import('@/views/Discovery.vue'),
        meta: { title: 'Job Board', nav: 'discover', marketplaceType: 'jobs' },
      },
      {
        path: 'scholarships',
        name: 'Scholarships',
        component: () => import('@/views/Scholarships.vue'),
        meta: { title: 'Scholarships', nav: 'discover', marketplaceType: 'scholarships' },
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('@/views/Services.vue'),
        meta: { title: 'Services', nav: 'discover', marketplaceType: 'services' },
      },
      {
        path: 'education',
        name: 'Education',
        component: () => import('@/views/Education.vue'),
        meta: { title: 'Education', nav: 'discover', marketplaceType: 'education' },
      },
      {
        path: 'employer',
        name: 'Employer',
        component: () => import('@/views/EmployerHub.vue'),
        meta: { title: 'Employer', nav: 'employer' },
      },
      {
        path: 'employer/onboard',
        name: 'EmployerOnboard',
        component: () => import('@/views/EmployerOnboard.vue'),
        meta: { title: 'Become an Employer' },
      },
      {
        path: 'employer/jobs',
        name: 'EmployerJobs',
        component: () => import('@/views/EmployerJobs.vue'),
        meta: { title: 'My Job Postings' },
      },
      {
        path: 'employer/jobs/:jobId',
        name: 'JobDetail',
        component: () => import('@/views/JobDetail.vue'),
        meta: { title: 'Job Details' },
      },
      {
        path: 'employer/jobs/:jobId/applicants',
        name: 'JobApplicants',
        component: () => import('@/views/JobApplicants.vue'),
        meta: { title: 'Applicants' },
      },
      {
        path: 'job/:jobId',
        name: 'JobView',
        component: () => import('@/views/JobView.vue'),
        meta: { title: 'Job Details' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} | Apply Utopia`;
  }
});

export default router;
