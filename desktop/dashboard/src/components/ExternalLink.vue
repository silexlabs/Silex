<script setup lang="ts">
defineProps<{
  href: string
  name: string
  arrow?: boolean
}>()
</script>

<template>
  <a
    :href="href"
    target="_blank"
    rel="noopener"
    :aria-label="$t('{name} (opens in your browser)', { name })"
  >
    <slot>{{ name }}</slot>{{ arrow ? '\u00a0↗' : '' }}
  </a>
</template>
