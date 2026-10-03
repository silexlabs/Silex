<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import {
  type SyncPlace,
  type Website,
  explain,
  onSyncStatus,
  openLink,
  syncPlaces,
  syncWebsite,
  thumbnailOf,
  translate,
  websiteUrl,
} from '../api'
import { ariaKeys, handleShortcut, keyLabel } from '../shortcuts'
import { useMenuAction } from '../menu'
import { type Problem, showError } from './AppDialogs.vue'
import AppTooltip from './AppTooltip.vue'
import ExternalLink from './ExternalLink.vue'

const props = defineProps<{ website: Website }>()
const emit = defineEmits<{ open: []; showFolder: []; rename: []; duplicate: []; delete: [] }>()

const { t, locale } = useI18n()
const nameId = useId()
const more = useTemplateRef<{ $el: HTMLElement }>('more')
const openButton = useTemplateRef<HTMLButtonElement>('open')

defineExpose({ websiteId: props.website.websiteId, focus: () => openButton.value?.focus() })

const steps: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

// Date.now() is not reactive: without this, « 2 minutes ago » would stay so for good
const now = ref(Date.now())
const clock = setInterval(() => {
  now.value = Date.now()
}, 30000)
onBeforeUnmount(() => clearInterval(clock))

const edited = computed(() => {
  if (!props.website.updatedAt) return ''
  const seconds = (new Date(props.website.updatedAt).getTime() - now.value) / 1000
  const step = steps.find(([, size]) => Math.abs(seconds) >= size)
  if (!step) return t('Edited just now')
  const [unit, size] = step
  const format = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })
  return t('Edited {when}', { when: format.format(Math.round(seconds / size), unit) })
})

const places = ref<SyncPlace[]>([])
const url = ref<string | null>(null)
async function readSync() {
  [places.value, url.value] = await Promise.all([syncPlaces(props.website.websiteId), websiteUrl(props.website.websiteId)])
}
// The list gives new objects when it is refreshed, and the same one when a website is renamed
watch(() => props.website, readSync, { immediate: true })
// Read again once the sync has ended: until then, what it fixes would leave the dialog under the user
let syncing = false
const stopListening = onSyncStatus(() => syncing || readSync())
onBeforeUnmount(() => stopListening.then((stop) => stop()))

let synced: Promise<unknown> = Promise.resolve()
async function sync() {
  syncing = true
  const ended = syncWebsite(props.website.websiteId).then(
    () => undefined,
    (error: unknown) => ({ title: t('Silex could not sync “{name}”', { name: props.website.name }), ...explain(error) }),
  )
  synced = ended
  const failure = await ended
  syncing = false
  await readSync()
  return failure
}

// The editor would load the website while a sync rewrites its files, and save the old ones over them
async function open() {
  await synced
  emit('open')
}

const problems = computed(() => places.value
  .filter(({ failure, action, changesUrl }) => failure || action || changesUrl)
  .map(({ icon, place, label, action, changesUrl, failure }): Problem => ({
    icon,
    place,
    message: translate(failure ?? label),
    detail: failure?.detail,
    // Syncing would only be refused
    action: changesUrl
      ? {
          label: t('Open on {host}', { host: place }),
          name: t('Open on {host} (opens in your browser)', { host: place }),
          external: true,
          run: () => openLink(changesUrl).then(
            () => undefined,
            (error: unknown) => ({ title: t('Silex could not open {host}', { host: place }), ...explain(error) }),
          ),
        }
      : { label: action ? translate(action) : t('Sync'), run: sync },
  })))

const needsYou = computed(() => t('“{name}” needs you', { name: props.website.name }))

const broken = ref(false)
watch(() => props.website.imageUrl, () => {
  broken.value = false
})
const thumbnail = computed(() => (broken.value ? '' : thumbnailOf(props.website)))

const initials = computed(() =>
  props.website.name
    .split(/\s+/)
    .map((word) => word.match(/[\p{L}\p{N}]/u)?.[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)

// Keyed on the id so that renaming a website keeps its color
const hue = computed(() => [...props.website.websiteId].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 360, 0))

const menuOpen = ref(false)

function onKeydown(event: KeyboardEvent) {
  // WebKitGTK does not turn these keys into a contextmenu event
  if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
    event.preventDefault()
    menuOpen.value = true
    return
  }
  handleShortcut(event, {
    F2: () => emit('rename'),
    Delete: () => emit('delete'),
    'Mod+D': () => emit('duplicate'),
  })
}

const { choose, afterClose } = useMenuAction(more)
</script>

<template>
  <article
    class="card"
    :aria-labelledby="nameId"
  >
    <div class="card__thumb">
      <img
        v-if="thumbnail"
        class="card__image"
        :src="thumbnail"
        alt=""
        loading="lazy"
        @error="broken = true"
      >
      <div
        v-else
        class="card__placeholder"
        :style="{ backgroundColor: `hsl(${hue} 25% 24%)` }"
        aria-hidden="true"
      >
        {{ initials }}
      </div>
    </div>
    <div class="card__body">
      <div class="card__info">
        <h2 class="card__name">
          <button
            :id="nameId"
            ref="open"
            type="button"
            class="card__open"
            @click="open"
            @keydown="onKeydown"
            @contextmenu.prevent="menuOpen = true"
          >
            {{ website.name }}
          </button>
        </h2>
        <AppTooltip
          v-if="url"
          :text="url"
        >
          <ExternalLink
            class="card__url"
            dir="ltr"
            :href="url"
            :name="url"
            arrow
          >
            <span class="card__url-text">{{ url.replace(/^https?:\/\/|\/$/g, '') }}</span>
          </ExternalLink>
        </AppTooltip>
        <p class="card__meta">
          <span class="card__edited">{{ edited }}</span>
          <span
            v-for="({ place, icon, label }, index) in places"
            :key="place"
            class="card__place"
          >
            <span
              v-if="edited || index"
              aria-hidden="true"
            >·</span>
            <span
              v-if="icon"
              class="logo"
              aria-hidden="true"
              v-html="icon"
            />{{ place }}<span class="visually-hidden">{{ `, ${translate(label)}` }}</span>
          </span>
        </p>
        <AppTooltip
          v-if="problems.length"
          :text="$t('1 thing needs you | {count} things need you', problems.length)"
        >
          <button
            type="button"
            class="card__alert"
            :aria-label="needsYou"
            @click="showError({ title: needsYou, problems: () => problems })"
          />
        </AppTooltip>
      </div>
      <DropdownMenuRoot v-model:open="menuOpen">
        <DropdownMenuTrigger
          ref="more"
          class="card__more"
          :aria-label="$t('More actions for {name}', { name: website.name })"
          @keydown="onKeydown"
          @contextmenu.prevent="menuOpen = true"
        >
          <span aria-hidden="true">⋯</span>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent
            class="menu"
            align="end"
            :side-offset="14"
            @close-auto-focus="afterClose"
          >
            <DropdownMenuItem
              class="menu__item"
              @select="choose(open)"
            >
              {{ $t('Edit') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator class="menu__separator" />
            <DropdownMenuItem
              class="menu__item"
              @select="choose(() => emit('showFolder'))"
            >
              {{ $t('Show in folder') }}
            </DropdownMenuItem>
            <DropdownMenuItem
              class="menu__item"
              :aria-keyshortcuts="ariaKeys('F2')"
              @select="choose(() => emit('rename'))"
            >
              {{ $t('Rename…') }}
              <span
                class="menu__keys"
                aria-hidden="true"
              >{{ keyLabel('F2') }}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              class="menu__item"
              :aria-keyshortcuts="ariaKeys('Mod+D')"
              @select="choose(() => emit('duplicate'))"
            >
              {{ $t('Duplicate') }}
              <span
                class="menu__keys"
                aria-hidden="true"
              >{{ keyLabel('Mod+D') }}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator class="menu__separator" />
            <DropdownMenuItem
              class="menu__item menu__item--danger"
              :aria-keyshortcuts="ariaKeys('Delete')"
              @select="choose(() => emit('delete'))"
            >
              {{ $t('Delete…') }}
              <span
                class="menu__keys"
                aria-hidden="true"
              >{{ keyLabel('Delete') }}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>
  </article>
</template>

<style scoped>
.card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgb(255 255 255 / 85%);
  font-size: 28px;
  font-weight: 500;
}

.card__body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--silex-space-2);
  padding-top: var(--silex-space-2);
}

.card__info {
  min-width: 0;
}

.card__open {
  padding: 0;
  border: none;
  background: none;
  font-weight: inherit;
  text-align: left;
  overflow-wrap: anywhere;
  cursor: pointer;
}

/* The whole card opens the website, the button stays the one thing to focus */
.card__open::after {
  position: absolute;
  inset: 0;
  border-radius: var(--silex-radius-md);
  content: '';
}

.card__open:focus-visible {
  outline: none;
}

.card__open:focus-visible::after {
  outline: 2px solid var(--silex-focus-outline);
  outline-offset: 2px;
}

/* Above the link of the whole card, so that it opens the website and not the editor */
.card__url {
  position: relative;
  z-index: 1;
  display: inline-flex;
  max-width: 100%;
  font-size: 12px;
  line-height: 24px;
  white-space: nowrap;
  vertical-align: top;
}

/* Cut before the arrow, which says the link leaves Silex */
.card__url-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card__meta {
  display: flex;
  align-items: baseline;
  gap: var(--silex-space-1);
  margin: 0;
  overflow: hidden;
  color: var(--silex-text-secondary);
  font-size: 12px;
  white-space: nowrap;
}

/* The date gives way, never the host */
.card__edited {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card__place {
  flex: none;
}

.card__place .logo {
  margin-left: var(--silex-space-1);
}

/* Over the thumbnail, while it stays after the name in the order of the focus */
.card__alert {
  position: absolute;
  top: var(--silex-space-2);
  right: var(--silex-space-2);
  z-index: 1;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: var(--silex-danger);
  box-shadow: 0 0 0 2px var(--silex-bg-darker);
  color: var(--silex-text-inverse);
  font-weight: 700;
  cursor: pointer;
}

.card__alert::before {
  content: '!';
}

.card__alert:hover {
  background: var(--silex-danger-hover);
}

.card__more {
  position: relative;
  z-index: 1;
  flex: none;
  width: 30px;
  height: 30px;
  margin-top: calc(-1 * var(--silex-space-1));
  border: none;
  border-radius: var(--silex-radius-sm);
  background: none;
  color: var(--silex-text-secondary);
  font-size: 18px;
  cursor: pointer;
}

.card__more:hover,
.card__more[aria-expanded='true'] {
  background: var(--silex-hover-bg);
  color: var(--silex-text-primary);
}
</style>

