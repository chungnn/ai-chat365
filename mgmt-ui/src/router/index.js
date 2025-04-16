import { createRouter, createWebHistory } from 'vue-router';
import store from '../store';

// Lazy-loaded views
const Login = () => import('../views/auth/Login.vue');
const Dashboard = () => import('../views/dashboard/Dashboard.vue');
const ChatManagement = () => import('../views/chat/ChatManagement.vue');
const ChatDetail = () => import('../views/chat/ChatDetail.vue');
const TagManagement = () => import('../views/tags/TagManagement.vue');
const CategoryManagement = () => import('../views/categories/CategoryManagement.vue');
const UserManagement = () => import('../views/users/UserManagement.vue');
const KnowledgeManagement = () => import('../views/knowledge/KnowledgeManagement.vue');
const NotFound = () => import('../views/NotFound.vue');

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/chats',
    name: 'ChatManagement',
    component: ChatManagement,
    meta: { requiresAuth: true }
  },  {
    path: '/chats/:id',
    name: 'ChatDetail',
    component: ChatDetail,
    meta: { requiresAuth: true }
  },  {
    path: '/tags',
    name: 'TagManagement',
    component: TagManagement,
    meta: { requiresAuth: true }
  },
  {
    path: '/categories',
    name: 'CategoryManagement',
    component: CategoryManagement,
    meta: { requiresAuth: true }
  },  {
    path: '/users',
    name: 'UserManagement',
    component: UserManagement,
    meta: { requiresAuth: true }
  },
  {
    path: '/knowledge',
    name: 'KnowledgeManagement',
    component: KnowledgeManagement,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Navigation guards
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters['auth/isAuthenticated'];
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
