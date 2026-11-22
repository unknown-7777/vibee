<script setup>
import { Disc3, Heart, House, ListMusic, Mic, Music, Plus } from 'lucide-vue-next'
import ImportStatus from './ImportStatus.vue'
import { useLibraryStore } from '../../stores/library'

const library = useLibraryStore()

const items = [
  { to: '/', label: 'Home', icon: House },
  { to: '/songs', label: 'All Songs', icon: Music },
  { to: '/albums', label: 'Albums', icon: Disc3 },
  { to: '/artists', label: 'Artists', icon: Mic },
  { to: '/playlists', label: 'Playlists', icon: ListMusic },
  { to: '/favorites', label: 'Favorites', icon: Heart },
]
</script>

<template>
  <aside class="flex w-60 shrink-0 flex-col border-r border-line bg-sidebar">
    <div class="drag h-14 shrink-0"></div>

    <nav class="flex-1 space-y-0.5 px-3">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        v-slot="{ href, navigate, isActive }"
        :to="item.to"
        custom
      >
        <a
          :href="href"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          :class="isActive ? 'bg-white/10 text-fg' : 'text-muted hover:bg-white/5 hover:text-fg'"
          @click="navigate"
        >
          <component :is="item.icon" :size="18" :stroke-width="1.75" />
          {{ item.label }}
        </a>
      </RouterLink>
    </nav>

    <ImportStatus />

    <div class="p-3 pt-0">
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
        :disabled="library.isImporting"
        @click="library.importMusic()"
      >
        <Plus :size="16" :stroke-width="2.25" />
        {{ library.isImporting ? 'Importing…' : 'Import Music' }}
      </button>
    </div>
  </aside>
</template>
