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
        :style="{ backgroundColor: `hsl(${hue} 45% 32%)` }"
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
      <DropdownMenuRoot>
        <DropdownMenuTrigger
          ref="more"
          class="card__more"
          :aria-label="$t('More actions for {name}', { name: website.name })"
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
              @select="choose(() => emit('rename'))"
            >
              {{ $t('Rename…') }}
            </DropdownMenuItem>
            <DropdownMenuItem
              class="menu__item"
              @select="choose(() => emit('duplicate'))"
            >
              {{ $t('Duplicate') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator class="menu__separator" />
            <DropdownMenuItem
              class="menu__item menu__item--danger"
              @select="choose(() => emit('delete'))"
            >
              {{ $t('Delete…') }}
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
  color: var(--silex-text-inverse);
  font-size: 40px;
  font-weight: 600;
}

.card__body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--silex-space-2);
  padding: var(--silex-space-3) var(--silex-space-4);
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
  margin: calc(-1 * var(--silex-space-1)) calc(-1 * var(--silex-space-2)) 0 0;
  border: none;
  border-radius: 6px;
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

<style>
/* Not scoped: the menu is rendered at the end of the body */
.menu {
  z-index: 5;
  min-width: 220px;
  padding: var(--silex-space-1);
  border: 1px solid var(--silex-border-color-visible);
  border-radius: var(--silex-radius-md);
  background: var(--silex-button-bg);
  box-shadow: 0 4px 16px rgb(0 0 0 / 50%);
}

.menu__item {
  padding: var(--silex-space-2) var(--silex-space-3);
  border-radius: var(--silex-radius-sm);
  cursor: pointer;
  outline: none;
}

.menu__item[data-highlighted] {
  background: var(--silex-button-hover-bg);
}

.menu__item--danger {
  color: var(--silex-status-error);
}

.menu__separator {
  margin: var(--silex-space-1) 0;
  border-top: 1px solid var(--silex-border-color);
}
</style>
