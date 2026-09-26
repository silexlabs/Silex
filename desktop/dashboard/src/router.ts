import { nextTick, watchEffect } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { i18n } from './i18n'
import WebsitesPage from './pages/WebsitesPage.vue'
import TemplatesPage from './pages/TemplatesPage.vue'
import IntegrationsPage from './pages/IntegrationsPage.vue'
import SettingsPage from './pages/SettingsPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title?: () => string
  }
}

export const router = createRouter({
  // The app serves index.html only at /, so the route cannot be in the path
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: WebsitesPage, meta: { title: () => i18n.global.t('Your websites') } },
    { path: '/templates', component: TemplatesPage, meta: { title: () => i18n.global.t('Templates') } },
    { path: '/integrations', component: IntegrationsPage, meta: { title: () => i18n.global.t('Integrations') } },
    {
      // Nested, so that the Settings link of the sidebar stays active on the licenses
      path: '/settings',
      children: [
        { path: '', component: SettingsPage, meta: { title: () => i18n.global.t('Settings') } },
        {
          path: 'licenses',
          component: () => import('./pages/LicensesPage.vue'),
          meta: { title: () => i18n.global.t('Open source licenses') },
        },
      ],
    },
  ],
})

// A screen reader stays on the link it followed unless the focus moves to the new page
router.afterEach(async (_, from) => {
  if (!from.matched.length) return
  await nextTick()
  document.querySelector<HTMLElement>('main h1')?.focus()
})

watchEffect(() => {
  const { title } = router.currentRoute.value.meta
  document.title = title ? `${title()} – Silex` : 'Silex'
})
