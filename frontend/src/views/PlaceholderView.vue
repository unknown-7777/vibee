<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="px-8">
    <h1 class="text-3xl font-semibold tracking-tight">{{ route.meta.title }}</h1>
    <p class="mt-2 text-muted">Coming in a later phase.</p>
  </div>
</template>
