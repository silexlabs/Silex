<script setup lang="ts">
import { TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'

defineProps<{ text: string; side?: 'top' | 'right' | 'bottom' | 'left' }>()
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent
        class="tooltip"
        :side="side ?? 'bottom'"
        :side-offset="6"
      >
        {{ text }}
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>

<style>
/* Not scoped: the tooltip is rendered at the end of the body */
.tooltip {
  z-index: 6;
  padding: var(--silex-space-1) var(--silex-space-2);
  border: 1px solid var(--silex-border-color-visible);
  border-radius: var(--silex-radius-sm);
  background: var(--silex-button-bg);
  box-shadow: var(--silex-shadow-md);
  color: var(--silex-text-primary);
  font-size: 12px;
}
</style>
