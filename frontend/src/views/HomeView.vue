<script setup>
import { computed } from 'vue'
import ArtworkTile from '../components/common/ArtworkTile.vue'
import SectionBlock from '../components/common/SectionBlock.vue'
import SongCard from '../components/tracks/SongCard.vue'
import { useLibraryStore } from '../stores/library'
import { usePlayerStore } from '../stores/player'
import EmptyLibrary from '../components/common/EmptyLibrary.vue'

const library = useLibraryStore()
const player = usePlayerStore()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})
</script>

<template>
  <div class="space-y-10 px-8 pb-10">
    <h1 class="text-3xl font-semibold tracking-tight">{{ greeting }}</h1>

        <EmptyLibrary v-if="library.isEmpty" />

    <SectionBlock v-if="library.recentlyAdded.length" title="Recently added">
      <SongCard
        v-for="track in library.recentlyAdded"
        :key="track.id"
        :track="track"
        @play="player.playTrack(track, library.recentlyAdded)"
      />
    </SectionBlock>

    <SectionBlock v-if="library.recentlyPlayed.length" title="Recently played">
      <SongCard
        v-for="track in library.recentlyPlayed"
        :key="track.id"
        :track="track"
        @play="player.playTrack(track, library.recentlyPlayed)"
      />
    </SectionBlock>

    <SectionBlock v-if="library.favorites.length" title="Favorites">
      <SongCard
        v-for="track in library.favorites"
        :key="track.id"
        :track="track"
        @play="player.playTrack(track, library.favorites)"
      />
    </SectionBlock>

    <SectionBlock v-if="library.recentPlaylists.length" title="Recent playlists">
      <div
        v-for="playlist in library.recentPlaylists"
        :key="playlist.id"
        class="min-w-0 rounded-xl bg-card/60 p-3 transition-colors hover:bg-card"
      >
        <ArtworkTile :hue="playlist.hue" class="aspect-square w-full rounded-lg" />
        <p class="mt-3 truncate text-sm font-medium">{{ playlist.name }}</p>
        <p class="text-xs text-muted">{{ playlist.trackIds.length }} songs</p>
      </div>
    </SectionBlock>
  </div>
</template>
