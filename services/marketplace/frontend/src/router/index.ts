import { createWebHistory, createRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import ChannelLayout from '@/components/ChannelLayout.vue';
import { useAdminStore } from '@/store/adminStore';
import { isMobile } from '@/utils/isMobile';

const CHANNEL_PATHS = ['/connect', '/channel', '/scholarships', '/services', '/education', '/job/'];

function isChannelPath(path: string): boolean {
  return CHANNEL_PATHS.some((p) => path === p || (p.endsWith('/') && path.startsWith(p)));
}

const routes = [
  // Main app: landing, reservation, tenant, innkeeper (desktop + mobile for non-channel)
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
        path: 'reservation',
        name: 'TenancyReservationHub',
        component: () => import('@/views/TenancyReservationHub.vue'),
        meta: { title: 'Tenancy Reservation | Marketplace' },
      },
      {
        path: 'reservation/check',
        name: 'CheckReservation',
        component: () => import('@/views/CheckReservation.vue'),
        meta: { title: 'Check reservation | Marketplace' },
      },
      {
        path: 'innkeeper',
        component: () => import('@/views/AdminDashboard.vue'),
        meta: { title: "Innkeeper's Desk", nav: 'innkeeper', requiresInnkeeper: true },
        redirect: '/innkeeper/requests',
        children: [
          {
            path: 'requests',
            name: 'AdminRequests',
            component: () => import('@/views/admin/AdminRequests.vue'),
            meta: { title: "Reservations | Innkeeper's Desk" },
          },
          {
            path: 'tenants',
            name: 'AdminTenants',
            component: () => import('@/views/admin/AdminTenants.vue'),
            meta: { title: "Tenants | Innkeeper's Desk" },
          },
          {
            path: 'trust-registries',
            name: 'AdminTrustRegistries',
            component: () => import('@/views/admin/AdminTrustRegistries.vue'),
            meta: { title: "Trust Registry | Innkeeper's Desk" },
          },
          {
            path: 'credential-analysis',
            name: 'AdminCredentialAnalysis',
            component: () => import('@/views/admin/AdminCredentialAnalysis.vue'),
            meta: { title: "Credential Analysis | Innkeeper's Desk" },
          },
          {
            path: 'workflows',
            name: 'AdminWorkflows',
            component: () => import('@/views/admin/AdminActionMenu.vue'),
            meta: { title: "Configure workflow | Innkeeper's Desk" },
          },
          {
            path: 'settings',
            name: 'AdminSettings',
            component: () => import('@/views/admin/AdminSettings.vue'),
            meta: { title: "Settings | Innkeeper's Desk" },
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
                meta: { title: "Create invitation | Innkeeper's Desk" },
              },
              {
                path: 'action-menu',
                redirect: '/innkeeper/workflows',
              },
            ],
          },
        ],
      },
      {
        path: 'innkeeper/login',
        name: 'InnkeeperLogin',
        component: () => import('@/views/AdminLogin.vue'),
        meta: { title: "Innkeeper's Desk Sign In" },
      },
      {
        path: 'holder',
        name: 'CredentialHolderLogin',
        component: () => import('@/views/CredentialHolderLogin.vue'),
        meta: { title: 'Student or Job Seeker' },
      },
      {
        path: 'tenant',
        name: 'TenancyHub',
        component: () => import('@/views/TenancyHub.vue'),
        meta: { title: 'Marketplace Hub', nav: 'tenant' },
      },
      {
        path: 'tenant/onboard',
        name: 'TenancyReservation',
        component: () => import('@/views/TenancyReservation.vue'),
        meta: { title: 'Request Tenancy' },
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
        path: 'tenant/jobs/:jobId/applicants',
        name: 'JobApplicants',
        component: () => import('@/views/JobApplicants.vue'),
        meta: { title: 'Applicants' },
      },
    ],
  },
  // Channel: mobile-only, Uber Eats–like (no sign-in, bottom nav) — matched after main app
  {
    path: '/',
    component: ChannelLayout,
    meta: { channel: true },
    children: [
      {
        path: 'connect',
        name: 'Connect',
        component: () => import('@/views/Discovery.vue'),
        meta: { title: 'Channel', marketplaceType: 'jobs' },
      },
      {
        path: 'channel',
        name: 'Discovery',
        component: () => import('@/views/Discovery.vue'),
        meta: { title: 'Channel', marketplaceType: 'jobs' },
      },
      {
        path: 'scholarships',
        name: 'Scholarships',
        component: () => import('@/views/Scholarships.vue'),
        meta: { title: 'Scholarships', marketplaceType: 'scholarships' },
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('@/views/Services.vue'),
        meta: { title: 'Services', marketplaceType: 'services' },
      },
      {
        path: 'education',
        name: 'Education',
        component: () => import('@/views/Education.vue'),
        meta: { title: 'Education', marketplaceType: 'education' },
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
  // Channel: mobile-only — desktop users redirect to landing
  if (isChannelPath(to.path) && !isMobile()) {
    return { path: '/', replace: true };
  }
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
