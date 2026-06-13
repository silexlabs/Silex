import { Editor, PluginOptions } from 'grapesjs'
import { KeymapsDialog } from './KeymapsDialog'

interface KeymapsInfo {
    name: string,
    keys: string[]
}

interface KeymapsRegistry {
    [key: string]: KeymapsInfo[]
}

/**
 * Capitalizes the first letter of a string and lowercases the rest.
 * @param str The string to capitalize.
 */
export function titleCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Manages the state of the keymaps help dialog.
 */
export class KeymapsDialogManager {
    editor: Editor
    dialog: KeymapsDialog
    keymapsRegistry: KeymapsRegistry

    constructor(editor: Editor, opts: PluginOptions) {
        this.editor = editor
        this.dialog = new KeymapsDialog(this, opts)
        this.keymapsRegistry = {}

        // Updates the keymaps registry when a keymap is added or removed
        editor.on('keymap:add keymap:remove', () => {
            this.updateRegistry()
        })
    }

    /**
     * Creates/updates the keymaps registry
     * (categorized keymaps depending on their namespaces).
     */
    updateRegistry(): void {
        const keymaps = this.editor.Keymaps.getAll()
        this.keymapsRegistry = {}

        for (const keymapId in keymaps) {
            const splitKeymapId = keymapId.split(':')

            const category = titleCase(splitKeymapId[0])
            const name = splitKeymapId[1].split('-').map(titleCase).join(' ')
            // TODO: For now, it only displays the first keymap
            const keys = keymaps[keymapId].keys.split(',')[0]
              .replace(/\b/, '').split('+').map(titleCase)

            if (!this.keymapsRegistry[category]) {
                this.keymapsRegistry[category] = []
            }

            this.keymapsRegistry[category].push({name, keys})
        }
    }

    /**
     * Opens the keymaps help dialog.
     */
    openDialog(): void {
        this.dialog.open()
    }

    /**
     * Closes the keymaps help dialog.
     */
    closeDialog(): void {
        this.dialog.close()
    }
}