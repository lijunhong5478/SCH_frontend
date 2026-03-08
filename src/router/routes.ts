import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/admin/AdminDashboard.vue'),
    meta: { requiresAuth: true, role: 'admin' },
  },
  {
    path: '/doctor',
    name: 'doctor',
    component: () => import('@/views/doctor/DoctorDashboard.vue'),
    meta: { requiresAuth: true, role: 'doctor' },
  },
  {
    path: '/resident',
    name: 'resident',
    component: () => import('@/views/resident/ResidentDashboard.vue'),
    meta: { requiresAuth: true, role: 'resident' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
];

export default routes;