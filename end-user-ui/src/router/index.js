import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';

const routes = [
  {
    path: '/',
    name: 'Chat',
    component: () => import(/* webpackChunkName: "chat" */ '../views/chat/Chat.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackChunkName: "login" */ '../views/auth/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import(/* webpackChunkName: "register" */ '../views/auth/Register.vue'),
    meta: { guest: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import(/* webpackChunkName: "forgot-password" */ '../views/auth/ForgotPassword.vue'),
    meta: { guest: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import(/* webpackChunkName: "profile" */ '../views/user/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import(/* webpackChunkName: "contact" */ '../views/Contact.vue')
  },  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import(/* webpackChunkName: "not-found" */ '../views/NotFound.vue')
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0, left: 0 };
  }
});

// Điều hướng bảo vệ cho các trang yêu cầu đăng nhập
router.beforeEach((to, from) => {
  const isAuthenticated = store.getters['auth/isAuthenticated'];
  
  try {
    if (to.matched.some(record => record.meta.requiresAuth)) {
      if (!isAuthenticated) {
        return {
          path: '/login',
          query: { redirect: to.fullPath }
        };
      }
    } else if (to.matched.some(record => record.meta.guest)) {
      if (isAuthenticated) {
        return '/';
      }
    }
    
    // Nếu không có điều hướng, tiếp tục bình thường
    return true;
  } catch (error) {
    console.error('Router navigation error:', error);
    return false;
  }
});

export default router;