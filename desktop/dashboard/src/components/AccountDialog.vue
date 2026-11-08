<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import ExternalLink from './ExternalLink.vue'
import { type Account, type CatalogEntry, connectAccount, explain, stopConnectingAccount } from '../api'

const props = defineProps<{
  integration: CatalogEntry
  /** The account to sign in to again, without asking where */
  account?: Account
  /** Signed in to with the program but not used in Silex, offered first */
  others?: Account[]
}>()

const emit = defineEmits<{
  /** The account signed in to is null when the user stopped */
  done: [accounts: Account[], account: string | null]
  chose: [account: Account]
  failed: [error: ReturnType<typeof explain>]
}>()

const { t } = useI18n()
const element = useTemplateRef<HTMLDialogElement>('element')
const stop = useTemplateRef<HTMLButtonElement>('stop')
const titleId = useId()
const otherId = useId()
const addressHint = useId()
const clientIdHint = useId()
const problemId = useId()

const OTHER = ''
const chosen = ref(props.account?.id ?? props.integration.servers.find((server) => !props.integration.accounts.includes(server)) ?? OTHER)
const address = ref('')
const clientId = ref('')
const missing = ref(false)
const choosing = ref(!props.account && !!props.others?.length)
const signingIn = ref<string | null>(null)
const page = ref<string | null>(null)
let stopped = false

const typed = computed(() => (chosen.value === OTHER ? address.value.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '') : chosen.value))

onMounted(async () => {
  element.value?.showModal()
  if (props.account) await signIn()
})

// A shortcut can change the page under the dialog, and glab would wait for a browser nobody looks at
onBeforeUnmount(() => {
  if (signingIn.value) stopSigningIn()
})

async function signIn() {
  missing.value = chosen.value === OTHER && (!typed.value || !clientId.value.trim())
  if (missing.value) return
  const server = typed.value
  signingIn.value = server
  page.value = null
  await nextTick()
  stop.value?.focus()
  try {
    const connected = await connectAccount(props.integration.program, server, chosen.value === OTHER ? clientId.value.trim() : null, (shown) => {
      page.value = shown
    })
    emit('done', connected.accounts, stopped ? null : connected.account)
  } catch (error) {
    emit('failed', explain(error))
  }
}

// The button goes away with the list: the focus moves to the first choice of the form
async function useAnother() {
  choosing.value = false
  await nextTick()
  element.value?.querySelector<HTMLInputElement>('input[type=radio]:not(:disabled)')?.focus()
}

function stopSigningIn() {
  stopped = true
  stopConnectingAccount().catch((error: unknown) => emit('failed', explain(error)))
}

function cancel() {
  if (signingIn.value) stopSigningIn()
  else emit('done', [], null)
}
</script>

<template>
  <dialog
    ref="element"
    class="dialog"
    :aria-labelledby="titleId"
    @cancel.prevent="cancel"
  >
    <template v-if="signingIn">
      <h2
        :id="titleId"
        class="dialog__title"
      >
        {{ t('Sign in to {server}', { server: signingIn }) }}
      </h2>
      <div role="status">
        <p class="dialog__message">
          {{ t('Finish in your browser. Silex waits for you here.') }}
        </p>
        <p
          v-if="page"
          class="dialog__message account__page"
        >
          {{ t('Your browser did not open.') }}
          <ExternalLink
            :href="page"
            :name="t('Open the sign-in page')"
            arrow
          />
        </p>
      </div>
      <div class="dialog__actions">
        <button
          ref="stop"
          type="button"
          class="button"
          @click="cancel"
        >
          {{ t('Cancel') }}
        </button>
      </div>
    </template>

    <template v-else-if="choosing">
      <h2
        :id="titleId"
        class="dialog__title"
      >
        {{ t('Choose a {name} account', { name: integration.name }) }}
      </h2>
      <p class="dialog__message">
        {{ t('Signed in on this computer, not used in Silex yet:') }}
      </p>
      <ul class="account__others">
        <li
          v-for="other in others"
          :key="other.id"
        >
          <button
            type="button"
            class="account__other"
            @click="emit('chose', other)"
          >
            <span>{{ other.name }}</span>
            <span
              v-if="other.summary"
              class="account__summary"
            >{{ other.summary }}</span>
          </button>
        </li>
      </ul>
      <div class="dialog__actions">
        <button
          type="button"
          class="button"
          @click="cancel"
        >
          {{ t('Cancel') }}
        </button>
        <button
          type="button"
          class="button"
          @click="useAnother"
        >
          {{ t('Use another account…') }}
        </button>
      </div>
    </template>

    <form
      v-else
      novalidate
      @submit.prevent="signIn"
    >
      <h2
        :id="titleId"
        class="dialog__title"
      >
        {{ t('Add a {name} account', { name: integration.name }) }}
      </h2>
      <fieldset class="account__choices">
        <legend class="account__legend">
          {{ t('Where is your account?') }}
        </legend>
        <label
          v-for="known in integration.servers"
          :key="known"
          class="account__choice"
        >
          <input
            v-model="chosen"
            type="radio"
            name="server"
            :value="known"
            :disabled="integration.accounts.includes(known)"
          >
          {{ known }}
          <span
            v-if="integration.accounts.includes(known)"
            class="account__added"
          >{{ t('Already added') }}</span>
        </label>
        <label class="account__choice">
          <input
            v-model="chosen"
            type="radio"
            name="server"
            :value="OTHER"
            :aria-describedby="otherId"
          >
          {{ t('Another server') }}
        </label>
        <p
          :id="otherId"
          class="account__hint account__hint--choice"
        >
          {{ t('Your company, your school, or your own server') }}
        </p>
        <div
          v-if="chosen === OTHER"
          class="account__fields"
        >
          <label class="field">
            {{ t('Server address') }}
            <input
              v-model="address"
              class="field__input"
              autocomplete="off"
              :aria-invalid="missing && !typed"
              :aria-describedby="missing && !typed ? `${addressHint} ${problemId}` : addressHint"
            >
          </label>
          <p
            :id="addressHint"
            class="account__hint"
          >
            {{ t('The address you open in your browser. You can leave out https://') }}
          </p>
          <label class="field">
            {{ t('Application ID') }}
            <input
              v-model="clientId"
              class="field__input"
              autocomplete="off"
              :aria-invalid="missing && !clientId.trim()"
              :aria-describedby="missing && !clientId.trim() ? `${clientIdHint} ${problemId}` : clientIdHint"
            >
          </label>
          <p
            :id="clientIdHint"
            class="account__hint"
          >
            {{ t('Your server admin must allow Silex first: they create an application for Silex on the server and give you its ID.') }}
          </p>
          <p
            v-if="missing"
            :id="problemId"
            class="field__problem"
            role="alert"
          >
            {{ t('Fill in both fields.') }}
          </p>
        </div>
      </fieldset>
      <p class="dialog__message account__next">
        {{ t('Next, you sign in in your browser. Silex does not see your password.') }}
      </p>
      <div class="dialog__actions">
        <button
          type="button"
          class="button"
          @click="cancel"
        >
          {{ t('Cancel') }}
        </button>
        <button
          type="submit"
          class="button button--primary"
        >
          {{ t('Continue') }}
        </button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.account__added {
  margin-left: var(--silex-space-1);
  color: var(--silex-text-secondary);
  font-size: 12px;
}

.account__choices {
  display: grid;
  gap: var(--silex-space-2);
  margin: 0;
  padding: 0;
  border: none;
}

.account__legend {
  margin-bottom: var(--silex-space-2);
  padding: 0;
  font-weight: 500;
}

.account__choice {
  display: flex;
  align-items: center;
  gap: var(--silex-space-2);
}

.account__hint {
  margin: calc(-1 * var(--silex-space-2)) 0 0;
  color: var(--silex-text-secondary);
}

.account__hint--choice {
  margin-left: var(--silex-space-6);
}

.account__fields {
  display: grid;
  gap: var(--silex-space-3);
  margin-left: var(--silex-space-6);
}

.account__others {
  display: grid;
  gap: var(--silex-space-2);
  margin: var(--silex-space-4) 0 0;
  padding: 0;
  list-style: none;
}

.account__other {
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: var(--silex-space-3);
  padding: var(--silex-space-3);
  border: 1px solid var(--silex-border-color);
  border-radius: var(--silex-radius-sm);
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.account__other:hover {
  background: var(--silex-hover-bg);
}

.account__summary {
  color: var(--silex-text-secondary);
}

.account__page,
.account__next {
  margin-top: var(--silex-space-4);
}
</style>
