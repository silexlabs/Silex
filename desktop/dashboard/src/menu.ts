import type { Ref } from 'vue'

// Reka gives the focus back later: a dialog opened before that would give it back to an item that is gone
export function useMenuAction(trigger: Readonly<Ref<{ $el: HTMLElement } | null>>) {
  let chosen: (() => void) | null = null
  return {
    choose(action: () => void) {
      chosen = action
    },
    afterClose(event: Event) {
      if (!chosen) return
      event.preventDefault()
      trigger.value?.$el.focus()
      chosen()
      chosen = null
    },
  }
}
