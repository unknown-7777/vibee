<script setup>
import { Music, Plus } from 'lucide-vue-next'
import { useLibraryStore } from '../../stores/library'

const library = useLibraryStore()
</script>

<template>
  <div class="grid place-items-center py-24 text-center">
    <div class="max-w-sm">
      <div class="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-card text-muted">
        <Music :size="28" :stroke-width="1.5" />
      </div>
      <h2 class="text-lg font-semibold">Your library is empty</h2>
      <p class="mt-2 text-sm text-muted">
        Import songs or a whole folder from your Mac to get started. Your files stay where they are.
      </p>
      <button
        type="button"
        class="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
        :disabled="library.isImporting"
        @click="library.importMusic()"
      >
        <Plus :size="16" :stroke-width="2.25" />
        Import Music
      </button>
    </div>
  </div>
</template>
