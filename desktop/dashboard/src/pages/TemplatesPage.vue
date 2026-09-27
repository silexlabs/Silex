<script setup lang="ts">
import { reactive, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Language } from '../i18n'
import { createWebsiteFromTemplate, explain, openEditor } from '../api'
import { prompt, showError } from '../components/AppDialogs.vue'
import { dismiss, toast } from '../components/AppToasts.vue'
import ExternalLink from '../components/ExternalLink.vue'
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
  if (copying.value) return
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
    openEditor(await createWebsiteFromTemplate(name, template.repo))
  } catch (error) {
    dismiss(copyingToast)
    await showError({ title: t('Silex could not copy the template'), ...explain(error) })
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
        <ExternalLink
          class="template__more"
          href="https://www.silex.me/templates/"
          :name="$t('More templates on silex.me')"
          arrow
        />
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
          <ExternalLink
            class="template__preview"
            :href="localized(template).preview"
            :name="$t('Live demo of {name}', { name: template.name })"
          >
            {{ $t('Live demo') }} <span aria-hidden="true">↗</span>
          </ExternalLink>
          <div
            v-if="group.link"
            class="template__donate"
          >
            <ExternalLink
              class="button"
              :href="donateByCard"
              :name="$t('Pay what you want')"
              arrow
              :aria-describedby="`${id}-${g}-${index}`"
            />
            <ExternalLink
              v-if="locale === 'fr'"
              class="button"
              :href="donateTaxDeductible"
              :name="$t('Tax-deductible')"
              arrow
              :title="$t('Tax-deductible donation in France, through HelloAsso')"
              :aria-describedby="`${id}-${g}-${index}`"
            />
          </div>
          <button
            v-if="!group.link"
            type="button"
            class="button template__use"
            :aria-disabled="copying"
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
  place-self: end start;
  height: var(--silex-space-8);
  margin-top: var(--silex-space-2);
}

.card:hover .template__use:not([aria-disabled='true']) {
  background: var(--silex-accent-strong);
  color: var(--silex-text-inverse);
}

/* Not `disabled`, which would take the focus away from the keyboard */
.template__use[aria-disabled='true'] {
  opacity: 0.6;
  cursor: progress;
}
</style>
