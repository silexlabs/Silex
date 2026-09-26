<script setup lang="ts">
import { reactive, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Language } from '../i18n'
import { type TemplateNotUsed, createWebsiteFromTemplate } from '../api'
import { prompt, showError } from '../components/AppDialogs.vue'
import { dismiss, toast } from '../components/AppToasts.vue'
import list from '../templates.json'

type Localized = { description: string; preview: string }
type Template = { name: string; image: string; repo: string; paymentLink?: string; en: Localized; fr?: Localized }

// The donation pages of the one pack there is so far
const donateByCard = 'https://donate.stripe.com/5kQ4gA0hy4Lz2cTeMo5ZC00?client_reference_id=61'
const donateTaxDeductible = 'https://www.helloasso.com/associations/silex-labs/formulaires/2'

const templates: Template[] = list
const groups: { link?: string; templates: Template[] }[] = [
  { templates: templates.filter((template) => !template.paymentLink) },
  ...[...new Set(templates.map((template) => template.paymentLink).filter(Boolean))].map((link) => ({
    link,
    templates: templates.filter((template) => template.paymentLink === link),
  })),
]
const { t, locale } = useI18n()
const id = useId()
const broken = reactive(new Set<string>())
const copying = ref(false)

const localized = (template: Template) => template[locale.value as Language] ?? template.en

async function use(template: Template) {
  const name = await prompt({
    title: t('New website from “{name}”', { name: template.name }),
    label: t('Name'),
    value: template.name,
    confirmLabel: t('Create and open'),
  })
  if (!name) return
  copying.value = true
  const copyingToast = toast(t('Copying the template…'))
  try {
    const websiteId = await createWebsiteFromTemplate(name, template.repo)
    window.location.href = `/?id=${encodeURIComponent(websiteId)}&lang=${locale.value}`
  } catch (error) {
    dismiss(copyingToast)
    const { unreachable, message } = error as TemplateNotUsed
    await showError({
      title: t('Silex could not copy the template'),
      message: unreachable ? t('Check your internet connection, then try again.') : message,
    })
    copying.value = false
  }
}
</script>

<template>
  <div class="page__head">
    <div>
      <h1 tabindex="-1">
        {{ $t('Templates') }}
      </h1>
      <p class="page__lead">
        {{ $t('Websites made with Silex by the community. Start a new website from one of them.') }}
        <a
          class="template__more"
          href="https://www.silex.me/templates/"
          target="_blank"
          rel="noopener"
        >{{ $t('More templates on silex.me') }} <span aria-hidden="true">↗</span><span class="visually-hidden"> {{ $t('(opens in your browser)') }}</span></a>
      </p>
    </div>
  </div>

  <section
    v-for="(group, g) in groups"
    :key="group.link ?? ''"
    :class="{ 'template-pack': group.link }"
    :aria-labelledby="group.link && `${id}-pack-${g}`"
  >
    <div
      v-if="group.link"
      class="page__head"
    >
      <div>
        <h2
          :id="`${id}-pack-${g}`"
          class="template-pack__title"
        >
          {{ $t('Templates being funded') }}
        </h2>
        <p class="page__lead">
          {{ $t('Your donations fund new Creative Commons templates. Donors get these templates by email right away. When donations reach €2,000, these templates are added to Silex for everyone.') }}
        </p>
      </div>
    </div>
    <div class="card-grid">
      <article
        v-for="(template, index) in group.templates"
        :key="template.name"
        class="card"
        :aria-labelledby="`${id}-${g}-${index}`"
      >
        <div class="card__thumb">
          <img
            v-if="template.image && !broken.has(template.name)"
            class="card__image"
            :src="template.image"
            alt=""
            loading="lazy"
            @error="broken.add(template.name)"
          >
          <span
            v-if="group.link"
            class="template__locked"
          >{{ $t('Locked') }}</span>
        </div>
        <div class="template__body">
          <component
            :is="group.link ? 'h3' : 'h2'"
            :id="`${id}-${g}-${index}`"
            class="card__name"
          >
            {{ template.name }}
          </component>
          <p class="template__description">
            {{ localized(template).description }}
          </p>
          <a
            class="template__preview"
            :href="localized(template).preview"
            target="_blank"
            rel="noopener"
            :aria-label="`${$t('Live demo of {name}', { name: template.name })} ${$t('(opens in your browser)')}`"
          >{{ $t('Live demo') }} <span aria-hidden="true">↗</span></a>
          <div
            v-if="group.link"
            class="template__donate"
          >
            <a
              class="button"
              :href="donateByCard"
              target="_blank"
              rel="noopener"
              :aria-describedby="`${id}-${g}-${index}`"
            >{{ $t('Pay what you want') }} <span aria-hidden="true">↗</span><span class="visually-hidden"> {{ $t('(opens in your browser)') }}</span></a>
            <a
              v-if="locale === 'fr'"
              class="button"
              :href="donateTaxDeductible"
              target="_blank"
              rel="noopener"
              :title="$t('Tax-deductible donation in France, through HelloAsso')"
              :aria-describedby="`${id}-${g}-${index}`"
            >{{ $t('Tax-deductible') }} <span aria-hidden="true">↗</span><span class="visually-hidden"> {{ $t('(opens in your browser)') }}</span></a>
          </div>
          <button
            v-if="!group.link"
            type="button"
            class="button template__use"
            :disabled="copying"
            :aria-describedby="`${id}-${g}-${index}`"
            @click="use(template)"
          >
            {{ $t('Use this template…') }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.template__body {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto auto 1fr;
  gap: var(--silex-space-2);
  padding-top: var(--silex-space-2);
}

.template__description {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--silex-text-secondary);
  font-size: 12px;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.template__preview {
  justify-self: start;
  color: var(--silex-text-secondary);
  font-size: 12px;
}

.template__preview:hover {
  color: var(--silex-text-primary);
}

.template__donate {
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  align-self: end;
  gap: var(--silex-space-2);
  margin-top: var(--silex-space-2);
}

.template__more {
  color: var(--silex-text-secondary);
  white-space: nowrap;
}

.template__more:hover {
  color: var(--silex-text-primary);
}

.template-pack {
  margin-top: var(--silex-space-8);
}

.template-pack__title {
  font-size: 18px;
}

.template__locked {
  position: absolute;
  top: var(--silex-space-2);
  left: var(--silex-space-2);
  padding: var(--silex-space-1) var(--silex-space-2);
  border: 1px solid var(--silex-border-color-visible);
  border-radius: var(--silex-radius-sm);
  background: var(--silex-bg-darker);
  color: var(--silex-text-primary);
  font-size: 12px;
}

.template__use {
  align-self: end;
  width: 100%;
  margin-top: var(--silex-space-2);
}

.card:hover .template__use:is(a, :enabled) {
  background: var(--silex-accent-strong);
  color: var(--silex-text-inverse);
}
</style>
