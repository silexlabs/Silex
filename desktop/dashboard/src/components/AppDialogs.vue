<script lang="ts">
import { shallowRef } from 'vue'

interface PromptOptions {
  title: string
  label: string
  value?: string
  confirmLabel: string
}

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
}

interface ErrorOptions {
  title: string
  message: string
}

type Request =
  | ({ kind: 'prompt'; resolve: (value: string | null) => void } & PromptOptions)
  | ({ kind: 'confirm'; resolve: (confirmed: boolean) => void } & ConfirmOptions)
  | ({ kind: 'error'; resolve: () => void } & ErrorOptions)

export const dialog = shallowRef<(Request & { id: number }) | null>(null)

const waiting: (Request & { id: number })[] = []
let last = 0

function open(request: Request) {
  const next = { ...request, id: ++last }
  if (dialog.value) waiting.push(next)
  else dialog.value = next
}

export function answer(result: string | boolean | null) {
  const request = dialog.value
  if (!request) return
  if (request.kind === 'prompt') request.resolve(typeof result === 'string' ? result : null)
  else if (request.kind === 'confirm') request.resolve(result === true)
  else request.resolve()
  dialog.value = waiting.shift() ?? null
}

export function prompt(options: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => open({ kind: 'prompt', ...options, resolve }))
}

export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => open({ kind: 'confirm', ...options, resolve }))
}

export function showError(options: ErrorOptions): Promise<void> {
  return new Promise((resolve) => open({ kind: 'error', ...options, resolve }))
}
</script>

<script setup lang="ts">
import { nextTick, ref, useId, useTemplateRef, watch } from 'vue'
const element = useTemplateRef<HTMLDialogElement>('element')
const name = ref('')
const empty = ref(false)
const titleId = useId()
const messageId = useId()
const problemId = useId()
let focusedBefore: Element | null = null

watch(
  () => dialog.value?.id,
  async (id, previous) => {
    if (previous === undefined) focusedBefore = document.activeElement
    empty.value = false
    name.value = dialog.value?.kind === 'prompt' ? (dialog.value.value ?? '') : ''
    await nextTick()
    if (id === undefined) {
      if (focusedBefore instanceof HTMLElement) focusedBefore.focus()
      return
    }
    element.value?.showModal()
    element.value?.querySelector('input')?.select()
  },
)

function submit() {
  const text = name.value.trim()
  empty.value = !text
  if (text) answer(text)
}
</script>

<template>
  <dialog
    v-if="dialog"
    :key="dialog.id"
    ref="element"
    class="dialog"
    :class="{ 'dialog--alert': dialog.kind === 'error' }"
    :aria-labelledby="titleId"
    :aria-describedby="dialog.kind === 'prompt' ? undefined : messageId"
    @close="answer(null)"
  >
    <h2
      :id="titleId"
      class="dialog__title"
    >
      {{ dialog.title }}
    </h2>

    <form
      v-if="dialog.kind === 'prompt'"
      novalidate
      @submit.prevent="submit"
    >
      <label class="field">
        {{ dialog.label }}
        <input
          v-model="name"
          class="field__input"
          :aria-invalid="empty"
          :aria-describedby="empty ? problemId : undefined"
        >
      </label>
      <p
        v-if="empty"
        :id="problemId"
        class="field__problem"
        role="alert"
      >
        {{ $t('This field is required.') }}
      </p>
      <div class="dialog__actions">
        <button
          type="button"
          class="button"
          @click="answer(null)"
        >
          {{ $t('Cancel') }}
        </button>
        <button
          type="submit"
          class="button button--primary"
        >
          {{ dialog.confirmLabel }}
        </button>
      </div>
    </form>

    <template v-else>
      <p
        :id="messageId"
        class="dialog__message"
      >
        {{ dialog.message }}
      </p>
      <div class="dialog__actions">
        <button
          v-if="dialog.kind === 'confirm'"
          type="button"
          class="button"
          :autofocus="dialog.danger"
          @click="answer(false)"
        >
          {{ $t('Cancel') }}
        </button>
        <button
          type="button"
          class="button"
          :class="dialog.kind === 'confirm' && dialog.danger ? 'button--danger' : 'button--primary'"
          :autofocus="!(dialog.kind === 'confirm' && dialog.danger)"
          @click="answer(true)"
        >
          {{ dialog.kind === 'error' ? $t('Close') : dialog.confirmLabel }}
        </button>
      </div>
    </template>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(480px, calc(100vw - 2 * var(--silex-space-6)));
  padding: var(--silex-space-6);
  border: 1px solid var(--silex-border-color-strong);
  border-radius: var(--silex-radius-md);
  background: var(--silex-bg-main);
  color: var(--silex-text-primary);
}

.dialog--alert {
  border-top: 3px solid var(--silex-status-error);
}

.dialog::backdrop {
  background: var(--silex-backdrop);
}

.dialog__title {
  margin-bottom: var(--silex-space-4);
  font-size: 20px;
  line-height: 28px;
}

.dialog__message {
  margin: 0;
  color: var(--silex-text-secondary);
}

.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--silex-space-2);
  margin-top: var(--silex-space-6);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--silex-space-1);
  font-weight: 500;
}

.field__input {
  height: 36px;
  padding: 0 var(--silex-space-3);
  border: 1px solid var(--silex-input-border);
  border-radius: var(--silex-radius-sm);
  background: var(--silex-bg-main);
  font-weight: 400;
}

.field__input[aria-invalid='true'] {
  border-color: var(--silex-status-error);
  outline-color: var(--silex-status-error);
}

.field__problem {
  margin: var(--silex-space-1) 0 0;
  color: var(--silex-status-error);
}
</style>
