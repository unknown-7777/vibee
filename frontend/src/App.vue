<script setup>
import { onMounted } from 'vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import PlayerBar from './components/player/PlayerBar.vue'
import QueuePanel from './components/player/QueuePanel.vue'
import { useShortcuts } from './composables/useShortcuts'
import { useLibraryStore } from './stores/library'
import { useUiStore } from './stores/ui'

const library = useLibraryStore()
const ui = useUiStore()
useShortcuts()

onMounted(async () => {
  await library.load()
  library.verify() // silent background check for songs that moved or vanished
})
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex min-h-0 flex-1">
      <AppSidebar />

      <main class="flex min-w-0 flex-1 flex-col">
        <div class="drag h-14 shrink-0"></div>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <RouterView v-slot="{ Component }">
            <Transition name="page" mode="out-in">
              <component :is="Component" />
            </Transition>
          </RouterView>
        </div>
      </main>

      <!-- The queue slides open by animating the width of this wrapper; the panel inside keeps a
           fixed width, so its content never gets squashed mid-animation. -->
      <div
        class="shrink-0 overflow-hidden transition-[width] duration-200 ease-out"
        :class="ui.isQueueOpen ? 'w-80' : 'w-0'"
        :inert="!ui.isQueueOpen"
      >
        <QueuePanel />
      </div>
    </div>

    <!-- Outside <RouterView>, so it never unmounts when you change page -->
    <PlayerBar />
  </div>
</template>
