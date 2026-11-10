<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import ExternalLink from './ExternalLink.vue'
import { useMenuAction } from '../menu'
import type { Account, CatalogEntry, explain } from '../api'
import { accountKey, needsYou, signIns, tooOld } from '../integrations'

/** A chosen account, or the program of an integration in use that Silex cannot run when there is none */
const props = defineProps<{
  entry: CatalogEntry
  account?: Account
  busy: boolean
  installing?: boolean
  /** Why the last install failed, until one works */
  failed?: ReturnType<typeof explain>
}>()

const emit = defineEmits<{
  checkAgain: []
  install: [from: Element]
  signInAgain: [from: Element]
  check: []
  stopUsing: []
  signOut: []
}>()

const { t } = useI18n()

const id = computed(() => `line-${props.entry.id}-${props.account?.id ?? 'program'}`.replace(/[^\w-]/g, '-'))

const signIn = computed(() => (props.account ? signIns.value[accountKey(props.entry.id, props.account.id)] : undefined))

const state = computed((): { tone: 'ok' | 'problem' | 'unknown'; label: string; detail: string } => {
  const { entry } = props
  if (!props.account) {
    if (entry.needs) return { tone: 'problem', label: t('Too old'), detail: tooOld(entry) }
    return entry.broken
      ? { tone: 'problem', label: t('Does not start'), detail: t('{program} is on this computer but does not start.', { program: entry.program }) }
      : { tone: 'problem', label: t('Not found'), detail: t('{program} is not on this computer.', { program: entry.program }) }
  }
  const said = signIn.value
  if (said === 'accepted') return { tone: 'ok', label: t('Signed in'), detail: t('Checked just now') }
  if (said === 'refused') return { tone: 'problem', label: t('Sign-in not accepted'), detail: entry.accountForm ? t('Sign out of this server, then add it again with the right password.') : t('Sign in again to use it.') }
  // What the program said is the only thing that tells a network down from a server that moved, when Silex has no sentence for it
  if (typeof said === 'object') return { tone: 'unknown', label: t('Could not check'), detail: (entry.accountForm ? said.unreachable.message : said.unreachable.detail) ?? '' }
  return { tone: 'unknown', label: t('Checking…'), detail: '' }
})

const more = useTemplateRef<InstanceType<typeof DropdownMenuTrigger>>('more')
const { choose, afterClose } = useMenuAction(more)
</script>

<template>
  <li
    class="account-line"
    :class="{ 'account-line--problem': needsYou(entry, account) }"
  >
    <span
      class="tile logo"
      aria-hidden="true"
      v-html="entry.icon"
    />
    <div>
      <p
        :id="id"
        class="account-line__name"
      >
        {{ account?.name ?? entry.name }}
      </p>
      <p class="account-line__meta">
        {{ account ? [entry.name, account.summary].filter(Boolean).join(' · ') : $t('Program {program}', { program: entry.program }) }}
      </p>
    </div>
    <p class="account-line__state">
      <span
        class="account-line__dot"
        :class="`account-line__dot--${state.tone}`"
        aria-hidden="true"
      />
      <span>{{ state.label }}</span>
      <span class="account-line__detail">{{ state.detail }}</span>
    </p>
    <div class="account-line__actions">
      <template v-if="!account">
        <button
          v-if="entry.installable"
          type="button"
          class="button"
          :aria-describedby="id"
          :aria-disabled="busy"
          @click="emit('install', $event.currentTarget as Element)"
        >
          {{ installing ? $t('Installing…') : failed !== undefined ? $t('Try again') : $t('Install') }}
        </button>
        <ExternalLink
          v-if="!entry.installable || failed !== undefined"
          class="button"
          :href="entry.installUrl"
          :name="$t('How to install {program}', { program: entry.program })"
          arrow
        />
        <button
          type="button"
          class="button"
          :aria-describedby="id"
          :aria-disabled="busy"
          @click="emit('checkAgain')"
        >
          {{ $t('Check again') }}
        </button>
      </template>
      <button
        v-else-if="signIn === 'refused' && !entry.accountForm"
        type="button"
        class="button"
        :aria-describedby="id"
        @click="emit('signInAgain', $event.currentTarget as Element)"
      >
        {{ $t('Sign in again…') }}
      </button>
    </div>
    <DropdownMenuRoot v-if="account">
      <DropdownMenuTrigger
        ref="more"
        class="card__more"
        :aria-label="$t('More actions for {name}', { name: account.name })"
      >
        <span aria-hidden="true">⋯</span>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          class="menu"
          align="end"
          loop
          :side-offset="4"
          @close-auto-focus="afterClose"
        >
          <DropdownMenuItem
            class="menu__item"
            @select="emit('check')"
          >
            {{ $t('Check again') }}
          </DropdownMenuItem>
          <DropdownMenuItem
            class="menu__item"
            @select="emit('stopUsing')"
          >
            {{ $t('Stop using in Silex') }}
          </DropdownMenuItem>
          <DropdownMenuSeparator class="menu__separator" />
          <DropdownMenuItem
            class="menu__item menu__item--danger"
            @select="choose(() => emit('signOut'))"
          >
            {{ $t('Sign out…') }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
    <p
      v-if="!account && failed !== undefined"
      class="account-line__failed"
      role="alert"
    >
      {{ $t('Silex could not install {name}.', { name: entry.name }) }} {{ failed.message }}
    </p>
    <pre
      v-if="!account && failed?.detail"
      class="account-line__failed-detail technical-detail"
    >{{ failed.detail }}</pre>
  </li>
</template>

<style scoped>
.account-line__failed,
.account-line__failed-detail {
  grid-column: 2 / -1;
}

.account-line__failed {
  margin: 0;
  color: var(--silex-status-error);
  font-size: 12px;
}

.account-line {
  display: grid;
  grid-template-columns: auto minmax(0, 300px) minmax(0, 1fr) auto auto;
  align-items: center;
  gap: var(--silex-space-3);
  padding: var(--silex-space-3) var(--silex-space-4);
}

.account-line + .account-line {
  border-top: 1px solid var(--silex-border-color);
}

.account-line--problem {
  box-shadow: inset 3px 0 0 var(--silex-status-error);
}

.account-line__name,
.account-line__meta,
.account-line__state {
  margin: 0;
}

.account-line__meta,
.account-line__detail {
  color: var(--silex-text-secondary);
  font-size: 12px;
}

.account-line__state {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  column-gap: var(--silex-space-2);
}

.account-line__detail {
  grid-column: 2;
}

.account-line__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.account-line__dot--ok {
  background: var(--silex-status-success);
}

.account-line__dot--problem {
  background: var(--silex-status-error);
}

.account-line__dot--unknown {
  background: var(--silex-text-secondary);
}

.account-line__actions {
  display: flex;
  gap: var(--silex-space-2);
}

[aria-disabled='true'] {
  opacity: 0.6;
  cursor: progress;
}
</style>
