<script setup>
import { ref } from 'vue'
import { bridge, isElectron } from './services/bridge'

const reply = ref('Not tested yet')

async function testIpc() {
  reply.value = isElectron ? await bridge.ping() : 'Not running inside Electron'
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex min-h-0 flex-1">
      <!-- Sidebar -->
      <aside class="flex w-60 shrink-0 flex-col border-r border-line bg-sidebar">
        <!-- Empty strip: the macOS traffic lights sit here, and it drags the window -->
        <div class="drag h-14 shrink-0"></div>
        <p class="px-5 text-sm text-muted">Sidebar</p>
      </aside>

      <!-- Main content -->
      <main class="flex min-w-0 flex-1 flex-col">
        <div class="drag h-14 shrink-0"></div>
        <div class="px-8">
          <h1 class="text-3xl font-semibold tracking-tight">Vibee</h1>
          <p class="mt-2 text-muted">Scaffold is running.</p>

          <button
            class="no-drag mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
            @click="testIpc"
          >
            Test IPC bridge
          </button>
          <p class="mt-3 text-sm text-muted">
            Reply: <span class="text-fg">{{ reply }}</span>
          </p>
        </div>
      </main>
    </div>

    <!-- Bottom player bar -->
    <footer class="flex h-24 shrink-0 items-center border-t border-line bg-sidebar px-6 text-sm text-muted">
      Player bar
    </footer>
  </div>
</template>
