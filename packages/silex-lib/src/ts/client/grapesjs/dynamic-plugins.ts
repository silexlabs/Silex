/**
 * Dynamic plugin loader for external GrapesJS plugins
 * These plugins are loaded at runtime to reduce initial bundle size
 */

export interface PluginDefinition {
  name: string
  value: any
}

/**
 * Load all external plugins dynamically
 */
export async function loadDynamicPlugins(): Promise<PluginDefinition[]> {
  const [
    blocksBasicPlugin,
    styleFilterPlugin,
    formPlugin,
    codePlugin,
    filterStyles,
    symbolsPlugin,
    loadingPlugin,
    fontsDialogPlugin,
    selectorPlugin,
    rateLimitPlugin,
    borderPlugin,
    backgroundPlugin,
    notificationsPlugin,
    keymapsDialogPlugin,
  ] = await Promise.all([
    import('grapesjs-blocks-basic').then(m => m.default),
    import('grapesjs-style-filter').then(m => m.default),
    import('grapesjs-plugin-forms').then(m => m.default),
    import('grapesjs-custom-code').then(m => m.default),
    import('@silexlabs/grapesjs-filter-styles').then(m => m.default),
    import('@silexlabs/grapesjs-symbols').then(m => m.default),
    import('@silexlabs/grapesjs-loading').then(m => m.default),
    import('@silexlabs/grapesjs-fonts').then(m => m.default),
    import('@silexlabs/grapesjs-advanced-selector').then(m => m.default),
    import('@silexlabs/grapesjs-storage-rate-limit').then(m => m.default),
    import('grapesjs-style-border').then(m => m.default),
    import('grapesjs-style-bg').then(m => m.default),
    import('@silexlabs/grapesjs-notifications').then(m => m.default),
    import('@silexlabs/grapesjs-keymaps-dialog').then(m => m.default),
  ])

  return [
    { name: 'grapesjs-blocks-basic', value: blocksBasicPlugin },
    { name: 'grapesjs-style-filter', value: styleFilterPlugin },
    { name: 'grapesjs-plugin-forms', value: formPlugin },
    { name: 'grapesjs-custom-code', value: codePlugin },
    { name: '@silexlabs/grapesjs-filter-styles', value: filterStyles },
    { name: '@silexlabs/grapesjs-symbols', value: symbolsPlugin },
    { name: '@silexlabs/grapesjs-loading', value: loadingPlugin },
    { name: '@silexlabs/grapesjs-fonts', value: fontsDialogPlugin },
    { name: '@silexlabs/grapesjs-advanced-selector', value: selectorPlugin },
    { name: '@silexlabs/grapesjs-storage-rate-limit', value: rateLimitPlugin },
    { name: 'grapesjs-style-border', value: borderPlugin },
    { name: 'grapesjs-style-bg', value: backgroundPlugin },
    { name: '@silexlabs/grapesjs-notifications', value: notificationsPlugin },
    { name: '@silexlabs/grapesjs-keymaps-dialog', value: keymapsDialogPlugin },
  ]
}