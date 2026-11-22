<script setup>
import { computed, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useLibraryStore } from '../../stores/library'

const library = useLibraryStore()

const progress = computed(() => library.importProgress)
const isScanning = computed(() => progress.value?.stage === 'scanning')
const percent = computed(() =>
  progress.value?.total ? Math.round((progress.value.processed / progress.value.total) * 100) : 0,
)

const summaryLines = computed(() => {
  const summary = library.lastImport
  if (!summary) return []
  if (summary.total === 0) return ['No supported audio files found.']

  const lines = [
    summary.added > 0
      ? `${summary.added} new ${summary.added === 1 ? 'song' : 'songs'} added`
      : 'No new songs',
  ]
  if (summary.updated > 0) lines.push(`${summary.updated} already in your library`)
  if (summary.failedCount > 0) lines.push(`${summary.failedCount} could not be read`)
  return lines
})

// The summary fades away on its own after a few seconds.
let timer
watch(
  () => library.lastImport,
  (summary) => {
    clearTimeout(timer)
    if (summary) timer = setTimeout(() => library.dismissImportSummary(), 10000)
  },
)
</script>

<template>
  <!-- While importing -->
  <div v-if="progress" class="mx-3 mb-3 rounded-lg bg-card p-3 text-xs">
    <p class="font-medium">
      {{ isScanning ? 'Looking for music…' : `Importing ${progress.processed} / ${progress.total}` }}
    </p>
    <div class="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
      <div
        class="h-full rounded-full bg-accent transition-[width] duration-150"
        :class="isScanning ? 'w-1/3 animate-pulse' : ''"
        :style="isScanning ? null : { width: `${percent}%` }"
      ></div>
    </div>
  </div>

  <!-- After an import -->
  <div
    v-else-if="summaryLines.length"
    class="mx-3 mb-3 flex items-start justify-between gap-2 rounded-lg bg-card p-3 text-xs"
  >
    <div class="space-y-0.5">
      <p
        v-for="(line, index) in summaryLines"
        :key="line"
        :class="index === 0 ? 'font-medium text-fg' : 'text-muted'"
      >
        {{ line }}
      </p>
    </div>
    <button type="button" class="text-muted transition-colors hover:text-fg" @click="library.dismissImportSummary()">
      <X :size="14" />
    </button>
  </div>

  <!-- If something went wrong -->
  <div
    v-else-if="library.importError"
    class="mx-3 mb-3 flex items-start justify-between gap-2 rounded-lg bg-card p-3 text-xs"
  >
    <p class="text-fg">{{ library.importError }}</p>
    <button type="button" class="text-muted transition-colors hover:text-fg" @click="library.dismissImportSummary()">
      <X :size="14" />
    </button>
  </div>
</template>
