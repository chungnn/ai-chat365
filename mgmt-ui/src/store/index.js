import { createStore } from 'vuex';
import VuexPersistence from 'vuex-persist';
import { setStore } from '@/config/api';
import auth from './modules/auth';
import chat from './modules/chat';
import notification from './modules/notification';
import tags from './modules/tags';
import urlMetadata from './modules/urlMetadata';
import categories from './modules/categories';
import users from './modules/users';
import knowledge from './modules/knowledge';

// Create vuex persistence for storing state in localStorage
const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  key: 'mgmt-ui',
  modules: ['auth']
});

const store = createStore({  modules: {
    auth,
    chat,
    notification,
    tags,
    urlMetadata,
    categories,
    users,
    knowledge
  },
  plugins: [vuexLocal.plugin]
});

// Set store reference in API module to handle authentication errors
setStore(store);

export default store;
