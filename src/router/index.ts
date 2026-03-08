import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { useAuthStore } from '@/stores/auth.store';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Navigation guards
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth;
  const requiredRole = to.meta.role as 'admin' | 'doctor' | 'resident' | undefined;

  // 检查认证
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  // 已认证用户访问登录页，根据角色重定向
  if (to.name === 'login' && authStore.isAuthenticated) {
    const userRole = authStore.user?.role;
    switch (userRole) {
      case 'admin':
        next({ name: 'admin' });
        break;
      case 'doctor':
        next({ name: 'doctor' });
        break;
      case 'resident':
        next({ name: 'resident' });
        break;
      default:
        // 未知角色，清除无效token并重定向到登录页
        authStore.logout();
        next({ name: 'login' });
    }
    return;
  }

  // 检查角色权限
  if (requiresAuth && requiredRole && authStore.user?.role !== requiredRole) {
    // 角色不匹配，重定向到对应角色的主页或无权限页面
    const userRole = authStore.user?.role;
    switch (userRole) {
      case 'admin':
        next({ name: 'admin' });
        break;
      case 'doctor':
        next({ name: 'doctor' });
        break;
      case 'resident':
        next({ name: 'resident' });
        break;
      default:
        // 未知角色，清除无效token并重定向到登录页
        authStore.logout();
        next({ name: 'login' });
    }
    return;
  }

  next();
});

export default router;