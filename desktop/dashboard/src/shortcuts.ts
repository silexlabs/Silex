import { onMounted, onUnmounted } from 'vue'
import { i18n } from './i18n'
import { dialog } from './components/AppDialogs.vue'

const mac = navigator.userAgent.includes('Mac')

/** Written like `Mod+N`, `Mod+1`, `F2`: Mod is Cmd on macOS and Ctrl elsewhere */
export type Shortcut = string

export function matches(event: KeyboardEvent, shortcut: Shortcut) {
  const [key, mod] = shortcut.startsWith('Mod+') ? [shortcut.slice(4), true] : [shortcut, false]
  if (event.altKey || event.shiftKey || (mac ? event.ctrlKey : event.metaKey)) return false
  if ((mac ? event.metaKey : event.ctrlKey) !== mod) return false
  // By code for the digits: on an AZERTY keyboard they need Shift
  return /^\d$/.test(key) ? event.code === `Digit${key}` : event.key.toLowerCase() === key.toLowerCase()
}

export const ariaKeys = (shortcut: Shortcut) => shortcut.replaceAll('Mod+', mac ? 'Meta+' : 'Control+')

export function keyLabel(shortcut: Shortcut) {
  const label = shortcut.replace('Mod+', mac ? '⌘' : 'Ctrl+')
  return label === 'Delete' ? i18n.global.t('Del') : label
}

/** Ignored while a dialog is open, which has keys of its own */
export function handleShortcut(event: KeyboardEvent, actions: Record<Shortcut, () => void>) {
  if (dialog.value || event.defaultPrevented) return
  const shortcut = Object.keys(actions).find((candidate) => matches(event, candidate))
  if (!shortcut) return
  event.preventDefault()
  actions[shortcut]?.()
}

export function useShortcuts(actions: Record<Shortcut, () => void>) {
  const listener = (event: KeyboardEvent) => handleShortcut(event, actions)
  onMounted(() => window.addEventListener('keydown', listener))
  onUnmounted(() => window.removeEventListener('keydown', listener))
}
