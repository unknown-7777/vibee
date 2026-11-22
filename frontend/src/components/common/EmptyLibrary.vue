<script setup>
import { Music } from 'lucide-vue-next'
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
    </div>
  </div>
</template>
