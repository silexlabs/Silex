<script setup lang="ts">
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Language } from '../i18n'
import logo from '../../../../public/assets/logo-silex-small.png'

const { t, locale } = useI18n()

const helpId = useId()

const localized = (urls: Record<Language, string>) => urls[locale.value as Language] ?? urls.en

const home = computed(() => localized({ en: 'https://www.silex.me/', fr: 'https://www.silex.me/fr/' }))

const forum = { en: 'https://short.silex.me/community_en', fr: 'https://short.silex.me/community_fr' }

const links = computed(() => [
  { text: t('Documentation'), href: localized({ en: 'https://short.silex.me/docs', fr: 'https://docs.silex.me/fr/home' }) },
  { text: t('Videos'), href: localized({ en: 'https://short.silex.me/video_en', fr: 'https://short.silex.me/video_fr' }) },
  { text: t('Forum'), href: localized(forum) },
  { text: t('Report a bug'), href: localized(forum) },
  { text: t('Roadmap'), href: 'https://short.silex.me/roadmap' },
  ...(locale.value === 'fr'
    ? [
        { text: t('Donate via Open Collective'), href: 'https://short.silex.me/donate' },
        { text: t('Tax-deductible donation via HelloAsso'), href: 'https://short.silex.me/donate_fr' },
      ]
    : [{ text: t('Donate to Silex Labs'), href: 'https://short.silex.me/donate' }]),
])
</script>

<template>
  <div class="sidebar">
    <a
      class="sidebar__brand"
      :href="home"
      target="_blank"
      rel="noopener"
    >
      <img
        class="sidebar__mark"
        :src="logo"
        alt=""
      >
      Silex<span class="visually-hidden"> {{ $t('(opens in your browser)') }}</span>
    </a>
    <nav
      class="sidebar__nav"
      :aria-label="$t('Main')"
    >
      <RouterLink
        to="/"
        class="sidebar__item"
      >
        <svg
          class="sidebar__icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        ><rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="2"
        /><path d="M3 9h18" /></svg>
        {{ $t('Websites') }}
      </RouterLink>
      <RouterLink
        to="/templates"
        class="sidebar__item"
      >
        <svg
          class="sidebar__icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        ><rect
          x="3"
          y="3"
          width="7"
          height="9"
          rx="1"
        /><rect
          x="14"
          y="3"
          width="7"
          height="5"
          rx="1"
        /><rect
          x="14"
          y="12"
          width="7"
          height="9"
          rx="1"
        /><rect
          x="3"
          y="16"
          width="7"
          height="5"
          rx="1"
        /></svg>
        {{ $t('Templates') }}
      </RouterLink>
      <RouterLink
        to="/integrations"
        class="sidebar__item"
      >
        <svg
          class="sidebar__icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        ><path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0z" /><path d="M12 16v5" /></svg>
        {{ $t('Integrations') }}
      </RouterLink>
      <RouterLink
        to="/settings"
        class="sidebar__item"
      >
        <svg
          class="sidebar__icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        ><circle
          cx="12"
          cy="12"
          r="3"
        /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
        {{ $t('Settings') }}
      </RouterLink>
    </nav>
    <nav
      :aria-labelledby="helpId"
      class="sidebar__nav-links"
    >
      <div
        :id="helpId"
        class="sidebar__label"
      >
        {{ $t('Help and community') }}
      </div>
      <ul class="sidebar__links">
        <li
          v-for="link in links"
          :key="link.text"
        >
          <a
            class="sidebar__link"
            :href="link.href"
            target="_blank"
            rel="noopener"
          >{{ link.text }} <span aria-hidden="true">↗</span><span class="visually-hidden"> {{ $t('(opens in your browser)') }}</span></a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--silex-space-6);
  height: 100%;
  padding: var(--silex-space-8) var(--silex-space-3) var(--silex-space-6);
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: var(--silex-space-3);
  height: 30px;
  padding: 0 var(--silex-space-3);
  font-size: 16px;
  border-radius: 6px;
  color: inherit;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-decoration: none;
}

.sidebar__brand:hover {
  background: var(--silex-hover-bg);
}

.sidebar__mark {
  width: 28px;
  height: 28px;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: var(--silex-space-1);
}

.sidebar__nav-links {
  margin-top: auto;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: var(--silex-space-3);
  padding: var(--silex-space-2) var(--silex-space-3);
  border-radius: 6px;
  color: var(--silex-text-secondary);
  font-weight: 500;
  text-decoration: none;
}

.sidebar__item:hover {
  background: var(--silex-hover-bg);
  color: var(--silex-text-primary);
}

.sidebar__item[aria-current='page'] {
  background: color-mix(in srgb, var(--silex-accent-primary) 14%, transparent);
  box-shadow: inset 3px 0 0 var(--silex-accent-primary);
  color: color-mix(in srgb, var(--silex-accent-primary), var(--silex-text-inverse) 40%);
}

.sidebar__icon {
  flex: none;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentcolor;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sidebar__label {
  padding: 0 var(--silex-space-3) var(--silex-space-1);
  color: var(--silex-text-secondary);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sidebar__links {
  margin: 0;
  padding: 0;
  list-style: none;
}

.sidebar__link {
  display: flex;
  justify-content: space-between;
  padding: var(--silex-space-1) var(--silex-space-3);
  border-radius: 6px;
  color: var(--silex-text-secondary);
  font-size: 13px;
  text-decoration: none;
}

.sidebar__link:hover {
  background: var(--silex-hover-bg);
  color: var(--silex-text-primary);
}
</style>
