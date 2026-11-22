<script setup>
defineProps({ title: { type: String, required: true } })
</script>

<template>
  <section>
    <h2 class="mb-4 text-lg font-semibold tracking-tight">{{ title }}</h2>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4">
      <slot />
    </div>
  </section>
</template>
