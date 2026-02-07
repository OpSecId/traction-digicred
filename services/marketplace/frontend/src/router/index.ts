import { createWebHistory, createRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import { useAdminStore } from '@/store/adminStore';

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'Landing',
        component: () => import('@/views/Landing.vue'),
        meta: { title: 'Marketplace', nav: 'landing' },
      },
      {
        path: 'channel',
        name: 'Discovery',
        component: () => import('@/views/Discovery.vue'),
        meta: { title: 'Channel', nav: 'channel', marketplaceType: 'jobs' },
      },
      {
        path: 'scholarships',
        name: 'Scholarships',
        component: () => import('@/views/Scholarships.vue'),
        meta: { title: 'Scholarships', nav: 'channel', marketplaceType: 'scholarships' },
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('@/views/Services.vue'),
        meta: { title: 'Services', nav: 'channel', marketplaceType: 'services' },
      },
      {
        path: 'education',
        name: 'Education',
        component: () => import('@/views/Education.vue'),
        meta: { title: 'Education', nav: 'channel', marketplaceType: 'education' },
      },
      {
        path: 'admin',
        component: () => import('@/views/AdminDashboard.vue'),
        meta: { title: 'Platform Admin', nav: 'admin', requiresAdmin: true },
        redirect: '/admin/requests',
        children: [
          {
            path: 'requests',
            name: 'AdminRequests',
            component: () => import('@/views/admin/AdminRequests.vue'),
            meta: { title: 'Requests | Admin' },
          },
          {
            path: 'tenants',
            name: 'AdminTenants',
            component: () => import('@/views/admin/AdminTenants.vue'),
            meta: { title: 'Tenants | Admin' },
          },
          {
            path: 'trust-registries',
            name: 'AdminTrustRegistries',
            component: () => import('@/views/admin/AdminTrustRegistries.vue'),
            meta: { title: 'Trust Registry | Admin' },
          },
          {
            path: 'credential-analysis',
            name: 'AdminCredentialAnalysis',
            component: () => import('@/views/admin/AdminCredentialAnalysis.vue'),
            meta: { title: 'Credential Analysis | Admin' },
          },
          {
            path: 'workflows',
            name: 'AdminWorkflows',
            component: () => import('@/views/admin/AdminWorkflows.vue'),
            meta: { title: 'Workflows | Admin' },
          },
          {
            path: 'marketplace',
            component: () => import('@/views/admin/AdminMarketplace.vue'),
            redirect: '/admin/marketplace/invitation',
            children: [
              {
                path: 'invitation',
                name: 'AdminInvitation',
                component: () => import('@/views/admin/AdminInvitation.vue'),
                meta: { title: 'Create invitation | Admin' },
              },
              {
                path: 'action-menu',
                name: 'AdminActionMenu',
                component: () => import('@/views/admin/AdminActionMenu.vue'),
                meta: { title: 'Action menu | Admin' },
              },
            ],
          },
        ],
      },
      {
        path: 'admin/login',
        name: 'AdminLogin',
        component: () => import('@/views/AdminLogin.vue'),
        meta: { title: 'Admin Sign In' },
      },
      {
        path: 'tenant',
        name: 'Employer',
        component: () => import('@/views/EmployerHub.vue'),
        meta: { title: 'Marketplace Tenants Hub', nav: 'tenant' },
      },
      {
        path: 'tenant/onboard',
        name: 'EmployerOnboard',
        component: () => import('@/views/EmployerOnboard.vue'),
        meta: { title: 'Become an Employer' },
      },
      {
        path: 'tenant/jobs',
        name: 'EmployerJobs',
        component: () => import('@/views/EmployerJobs.vue'),
        meta: { title: 'My Job Postings' },
      },
      {
        path: 'tenant/workflows',
        name: 'EmployerWorkflows',
        component: () => import('@/views/EmployerWorkflows.vue'),
        meta: { title: 'Manage Workflows' },
      },
      {
        path: 'tenant/jobs/create',
        name: 'EmployerJobCreate',
        component: () => import('@/views/EmployerJobCreate.vue'),
        meta: { title: 'Create Job Posting' },
      },
      {
        path: 'tenant/jobs/:jobId',
        name: 'JobDetail',
        component: () => import('@/views/JobDetail.vue'),
        meta: { title: 'Job Details' },
      },
      {
        path: 'tenant/jobs/:jobId/applicants',
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

router.beforeEach((to) => {
  if (to.meta.requiresAdmin && to.path !== '/admin/login') {
    const adminStore = useAdminStore();
    if (!adminStore.isAdmin) {
      return { path: '/admin/login', query: { redirect: to.fullPath } };
    }
  }
});

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} | Apply Utopia`;
  }
});

export default router;
