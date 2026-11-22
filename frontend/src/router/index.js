import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AllSongsView from '../views/AllSongsView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/songs', name: 'songs', component: AllSongsView },
    { path: '/albums', name: 'albums', component: PlaceholderView, meta: { title: 'Albums' } },
    { path: '/artists', name: 'artists', component: PlaceholderView, meta: { title: 'Artists' } },
    { path: '/playlists', name: 'playlists', component: PlaceholderView, meta: { title: 'Playlists' } },
    { path: '/favorites', name: 'favorites', component: PlaceholderView, meta: { title: 'Favorites' } },
  ],
})
