<script setup>
import { onMounted } from 'vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import PlayerBar from './components/player/PlayerBar.vue'
import { useLibraryStore } from './stores/library'

const library = useLibraryStore()
onMounted(() => library.load())
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
    </div>

    <!-- Outside <RouterView>, so it never unmounts when you change page -->
    <PlayerBar />
  </div>
</template>
