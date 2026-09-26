<script setup lang="ts">
import { computed, ref, useId, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import { type Website, hostOf, thumbnailOf } from '../api'
import { ariaKeys, handleShortcut, keyLabel } from '../shortcuts'

const props = defineProps<{ website: Website }>()
const emit = defineEmits<{ open: []; showFolder: []; rename: []; duplicate: []; delete: [] }>()

const { t, locale } = useI18n()
const nameId = useId()
const more = useTemplateRef<{ $el: HTMLElement }>('more')

const steps: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

const edited = computed(() => {
  if (!props.website.updatedAt) return ''
  const seconds = (new Date(props.website.updatedAt).getTime() - Date.now()) / 1000
  const step = steps.find(([, size]) => Math.abs(seconds) >= size)
  if (!step) return t('Edited just now')
  const [unit, size] = step
  const format = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })
  return t('Edited {when}', { when: format.format(Math.round(seconds / size), unit) })
})

const host = computed(() => hostOf(props.website))

const broken = ref(false)
watch(() => props.website.imageUrl, () => {
  broken.value = false
})
const thumbnail = computed(() => (broken.value ? '' : thumbnailOf(props.website)))

const initials = computed(() =>
  props.website.name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => [...word][0]).join('').toUpperCase(),
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

let chosen: (() => void) | null = null

function choose(action: () => void) {
  chosen = action
}

// Reka gives the focus back later: a dialog opened before that would give it back to an item that is gone
function afterClose(event: Event) {
  if (!chosen) return
  event.preventDefault()
  more.value?.$el.focus()
  chosen()
  chosen = null
}
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
            type="button"
            class="card__open"
            @click="emit('open')"
            @keydown="onKeydown"
            @contextmenu.prevent="menuOpen = true"
          >
            {{ website.name }}
          </button>
        </h2>
        <p class="card__meta">
          {{ edited }}<template v-if="edited && host">
            ·
          </template>{{ host }}
        </p>
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
              @select="choose(() => emit('open'))"
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

.card__meta {
  margin: 0;
  overflow: hidden;
  color: var(--silex-text-secondary);
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
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

