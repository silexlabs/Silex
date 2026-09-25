<script lang="ts">
import { ref } from 'vue'

export type ToastKind = 'success' | 'info' | 'error'

export interface Toast {
  id: number
  message: string
  kind: ToastKind
  count: number
}

export const toasts = ref<Toast[]>([])

const timers = new Map<number, ReturnType<typeof setTimeout>>()
let last = 0

export function hold(id: number) {
  clearTimeout(timers.get(id))
  timers.delete(id)
}

export function release(item: Toast) {
  hold(item.id)
  if (item.kind !== 'error') timers.set(item.id, setTimeout(() => dismiss(item.id), 20000))
}

export function dismiss(id: number) {
  hold(id)
  toasts.value = toasts.value.filter((item) => item.id !== id)
}

export function toast(message: string, kind: ToastKind = 'info') {
  const same = toasts.value.find((item) => item.message === message && item.kind === kind)
  if (same) {
    same.count++
    if (timers.has(same.id)) release(same)
    return same.id
  }
  const item = { id: ++last, message, kind, count: 1 }
  toasts.value.push(item)
  release(item)
  if (toasts.value.length > 4) {
    const oldest = toasts.value.find((other) => other.kind !== 'error') ?? toasts.value[0]
    dismiss(oldest.id)
  }
  return item.id
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const kinds = computed<Record<ToastKind, string>>(() => ({
  success: t('Success:'),
  info: t('Information:'),
  error: t('Error:'),
}))

const icons: Record<ToastKind, string> = {
  success: 'M5 10.5l3.5 3.5L15 7',
  info: 'M10 9v5M10 6.5v.5',
  error: 'M10 6v5M10 13.5v.5',
}
</script>

<template>
  <div
    class="toasts"
    aria-live="polite"
  >
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -- the pointer only holds the timer, the keyboard does the same through focus -->
    <div
      v-for="item in toasts"
      :key="item.id"
      class="toast"
      :class="`toast--${item.kind}`"
      :role="item.kind === 'error' ? 'alert' : undefined"
      @mouseenter="hold(item.id)"
      @mouseleave="release(item)"
      @focusin="hold(item.id)"
      @focusout="release(item)"
    >
      <svg
        class="toast__icon"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <circle
          cx="10"
          cy="10"
          r="8.5"
        />
        <path :d="icons[item.kind]" />
      </svg>
      <p class="toast__message">
        <span class="visually-hidden">{{ kinds[item.kind] }}</span>
        {{ item.message }}
      </p>
      <span
        v-if="item.count > 1"
        class="toast__count"
      ><span aria-hidden="true">×{{ item.count }}</span><span class="visually-hidden">{{ $t('({count} times)', { count: item.count }) }}</span></span>
      <button
        type="button"
        class="toast__close"
        :aria-label="$t('Dismiss this message')"
        @click="dismiss(item.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  right: var(--silex-space-6);
  bottom: var(--silex-space-6);
  display: flex;
  flex-direction: column;
  gap: var(--silex-space-2);
  width: min(380px, calc(100vw - 2 * var(--silex-space-6)));
}

.toast {
  --toast-color: var(--silex-status-info);

  display: flex;
  align-items: center;
  gap: var(--silex-space-3);
  padding: var(--silex-space-2) var(--silex-space-2) var(--silex-space-2) var(--silex-space-4);
  border: 1px solid var(--silex-border-color-visible);
  border-left: 4px solid var(--toast-color);
  border-radius: var(--silex-radius-sm);
  background: var(--silex-button-bg);
  box-shadow: var(--silex-shadow-md);
}

.toast--success {
  --toast-color: var(--silex-status-success);
}

.toast--error {
  --toast-color: var(--silex-status-error);
}

.toast__icon {
  flex: none;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: var(--toast-color);
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.toast__message {
  flex: 1;
  margin: 0;
}

.toast__count {
  flex: none;
  padding: 0 var(--silex-space-2);
  border-radius: var(--silex-radius-sm);
  background: var(--silex-hover-bg);
  color: var(--silex-text-secondary);
  font-size: 12px;
  line-height: 20px;
}

.toast__close {
  flex: none;
  width: 32px;
  height: 32px;
  margin: -6px 0;
  border: none;
  border-radius: var(--silex-radius-sm);
  background: none;
  color: var(--silex-text-secondary);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
}

.toast__close:hover {
  background: var(--silex-hover-bg);
  color: var(--silex-text-primary);
}
</style>
