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

export interface Problem {
  /** An SVG drawn in the color of the text */
  icon: string | null
  place: string
  message: string
  detail?: string
  action: {
    label: string
    /** When the label alone does not say what the button does */
    name?: string
    external?: boolean
    /** What failed replaces the list */
    run: () => Promise<ErrorOptions | void>
  }
}

interface ErrorOptions {
  title: string
  message?: string
  /** What the system said, shown as it is */
  detail?: string
  /** Read again each time they change, as the user fixes them */
  problems?: () => Problem[]
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
const detailId = useId()
const problemId = useId()
let focusedBefore: Element | null = null
let around: Element[] = []

// What the dialog fixed may have taken the element away: the first control left near it gets the focus
function focusBack() {
  if (focusedBefore instanceof HTMLElement && focusedBefore.isConnected) return focusedBefore.focus()
  around.find((element) => element.isConnected)?.querySelector<HTMLElement>('button, a[href], input')?.focus()
}

watch(
  () => dialog.value?.id,
  async (id, previous) => {
    if (previous === undefined) {
      focusedBefore = document.activeElement
      around = []
      for (let element = focusedBefore?.parentElement; element; element = element.parentElement) around.push(element)
    }
    empty.value = false
    name.value = dialog.value?.kind === 'prompt' ? (dialog.value.value ?? '') : ''
    await nextTick()
    if (id === undefined) return focusBack()
    element.value?.showModal()
    element.value?.querySelector('input')?.select()
  },
)

function described() {
  const request = dialog.value
  if (!request || request.kind === 'prompt') return undefined
  const detail = request.kind === 'error' && request.detail ? detailId : ''
  return [request.message ? messageId : '', detail].filter(Boolean).join(' ') || undefined
}

const acting = ref(false)
async function act({ run }: Problem['action']) {
  const request = dialog.value
  if (acting.value) return
  acting.value = true
  const failure = await run().finally(() => {
    acting.value = false
  })
  const shown = dialog.value === request
  if (failure) {
    if (shown) answer(null)
    showError(failure)
  } else if (shown && request?.kind === 'error' && !request.problems?.().length) answer(null)
}

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
    :role="dialog.kind === 'prompt' ? undefined : 'alertdialog'"
    :aria-labelledby="titleId"
    :aria-describedby="described()"
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
        v-if="dialog.message"
        :id="messageId"
        class="dialog__message"
      >
        {{ dialog.message }}
      </p>
      <ul
        v-if="dialog.kind === 'error' && dialog.problems"
        class="problems"
      >
        <li
          v-for="(problem, index) in dialog.problems()"
          :key="problem.place"
          class="problem"
        >
          <p
            :id="`${titleId}-${index}`"
            class="problem__place"
          >
            <span
              v-if="problem.icon"
              class="logo"
              aria-hidden="true"
              v-html="problem.icon"
            />{{ problem.place }}
          </p>
          <p class="problem__message">
            {{ problem.message }}
          </p>
          <details v-if="problem.detail">
            <summary>{{ $t('Technical details') }}</summary>
            <pre class="dialog__detail">{{ problem.detail }}</pre>
          </details>
          <button
            type="button"
            class="button problem__action"
            :aria-label="problem.action.name"
            :aria-describedby="`${titleId}-${index}`"
            :aria-disabled="acting"
            @click="act(problem.action)"
          >
            {{ problem.action.label }}<span
              v-if="problem.action.external"
              aria-hidden="true"
            >&nbsp;↗</span>
          </button>
        </li>
      </ul>
      <pre
        v-if="dialog.kind === 'error' && dialog.detail"
        :id="detailId"
        class="dialog__detail"
        tabindex="0"
        role="region"
        :aria-label="$t('Technical details')"
      >{{ dialog.detail }}</pre>
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

.dialog__detail {
  max-height: 240px;
  margin: var(--silex-space-3) 0 0;
  padding: var(--silex-space-2) var(--silex-space-3);
  overflow: auto;
  border-radius: var(--silex-radius-sm);
  background: var(--silex-bg-darker);
  color: var(--silex-text-secondary);
  font: 12px / 1.5 ui-monospace, 'Ubuntu Mono', Menlo, Consolas, monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  user-select: text;
}

.dialog__title + .dialog__detail {
  margin-top: 0;
}

.problems {
  margin: 0;
  padding: 0;
  list-style: none;
}

.problem + .problem {
  margin-top: var(--silex-space-4);
  padding-top: var(--silex-space-4);
  border-top: 1px solid var(--silex-border-color);
}

.problem__place {
  margin: 0;
  font-weight: 500;
}

.problem__message {
  margin: var(--silex-space-1) 0 0;
  color: var(--silex-text-secondary);
}

.problem__action {
  margin-top: var(--silex-space-2);
}

.problem__action[aria-disabled='true'] {
  opacity: 0.6;
  cursor: progress;
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
