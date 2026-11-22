<script setup>
defineProps({ active: Boolean })
</script>

<template>
  <button
    type="button"
    class="grid place-items-center rounded-full p-1.5 transition-colors disabled:pointer-events-none disabled:opacity-40"
    :class="active ? 'text-accent' : 'text-muted hover:text-fg'"
  >
    <slot />
  </button>
</template>
