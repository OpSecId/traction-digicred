import { createWebHistory, createRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import { useAdminStore } from '@/store/adminStore';
import { isMobile } from '@/utils/isMobile';

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
        path: 'reservation/check',
        name: 'CheckReservation',
        component: () => import('@/views/CheckReservation.vue'),
        meta: { title: 'Check reservation | Marketplace' },
      },
      {
        path: 'connect',
        name: 'Connect',
        component: () => import('@/views/Discovery.vue'),
        meta: { title: 'Channel', nav: 'channel', marketplaceType: 'jobs' },
        // OOB deep link: /connect?_oobid=xxx — renders channel, _oobid available in route.query
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
        path: 'innkeeper',
        component: () => import('@/views/AdminDashboard.vue'),
        meta: { title: 'Innkeeper', nav: 'innkeeper', requiresInnkeeper: true },
        redirect: '/innkeeper/requests',
        children: [
          {
            path: 'requests',
            name: 'AdminRequests',
            component: () => import('@/views/admin/AdminRequests.vue'),
            meta: { title: 'Reservations | Innkeeper' },
          },
          {
            path: 'tenants',
            name: 'AdminTenants',
            component: () => import('@/views/admin/AdminTenants.vue'),
            meta: { title: 'Tenants | Innkeeper' },
          },
          {
            path: 'trust-registries',
            name: 'AdminTrustRegistries',
            component: () => import('@/views/admin/AdminTrustRegistries.vue'),
            meta: { title: 'Trust Registry | Innkeeper' },
          },
          {
            path: 'credential-analysis',
            name: 'AdminCredentialAnalysis',
            component: () => import('@/views/admin/AdminCredentialAnalysis.vue'),
            meta: { title: 'Credential Analysis | Innkeeper' },
          },
          {
            path: 'workflows',
            name: 'AdminWorkflows',
            component: () => import('@/views/admin/AdminWorkflows.vue'),
            meta: { title: 'Workflows | Innkeeper' },
          },
          {
            path: 'marketplace',
            component: () => import('@/views/admin/AdminMarketplace.vue'),
            redirect: '/innkeeper/marketplace/invitation',
            children: [
              {
                path: 'invitation',
                name: 'AdminInvitation',
                component: () => import('@/views/admin/AdminInvitation.vue'),
                meta: { title: 'Create invitation | Innkeeper' },
              },
              {
                path: 'action-menu',
                name: 'AdminActionMenu',
                component: () => import('@/views/admin/AdminActionMenu.vue'),
                meta: { title: 'Action menu | Innkeeper' },
              },
            ],
          },
        ],
      },
      {
        path: 'innkeeper/login',
        name: 'InnkeeperLogin',
        component: () => import('@/views/AdminLogin.vue'),
        meta: { title: 'Innkeeper Sign In' },
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
  // Mobile users: redirect root to channel view
  if (to.path === '/' && isMobile()) {
    return { path: '/channel', replace: true };
  }
  if (to.meta.requiresInnkeeper && to.path !== '/innkeeper/login') {
    const adminStore = useAdminStore();
    if (!adminStore.isAdmin) {
      return { path: '/innkeeper/login', query: { redirect: to.fullPath } };
    }
  }
});

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} | Apply Utopia`;
  }
});

export default router;
