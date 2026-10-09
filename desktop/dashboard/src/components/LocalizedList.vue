<script setup lang="ts" generic="Item extends { name: string }">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ items: Item[] }>()
defineSlots<{ default(props: { item: Item }): unknown }>()

const { locale } = useI18n()

// The separators and their order are the language's, the items stay whatever the slot makes of them
const parts = computed(() => {
  let next = 0
  return new Intl.ListFormat(locale.value, { type: 'conjunction' })
    .formatToParts(props.items.map(({ name }) => name))
    .map((part) => (part.type === 'element' ? { item: props.items[next++] } : { text: part.value }))
})
</script>

<template>
  <template
    v-for="(part, index) in parts"
    :key="index"
  >
    <slot
      v-if="part.item"
      :item="part.item"
    /><template v-else>
      {{ part.text }}
    </template>
  </template>
</template>
