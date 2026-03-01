# grapesjs-css-variables — Test Scenarios

## Prerequisites
- Dev server running: `cd packages/grapesjs-css-variables && npm start`
- Open http://localhost:8086/ in browser

---

## 1. Modal Opens/Closes
- [ ] Click "Open CSS Variables" button
- [ ] Modal opens with title "CSS Variables"
- [ ] "No variables defined" message shown when empty
- [ ] Click close button (X) — modal closes

## 2. Add Variables via Type Picker
- [ ] Open modal, click "+ New variable" button
- [ ] Type picker dropdown appears with 3 options: Color, Size, Font Family
- [ ] Click "Color" — new row appears with color picker and default value "#3498db"
- [ ] Click "+ New variable" again, pick "Size" — new row with number input + unit dropdown, default "16px"
- [ ] Click "+ New variable" again, pick "Font Family" — new row with font `<select>`, default "Inter"
- [ ] Clicking outside the type picker closes it

## 3. Rename Variable
- [ ] Clear a name field and type "primary"
- [ ] Tab out or press Enter to trigger change
- [ ] Verify via CssComposer: `:root` should have the renamed variable (e.g. `--color-primary`)

## 4. Change Color Value
- [ ] Click the color picker and select a new color (e.g. red #e74c3c)
- [ ] The text value input updates to match
- [ ] The `:root` rule updates in CssComposer

## 5. Change Size Value
- [ ] Change a size variable's number input to "24"
- [ ] Change the unit dropdown to "rem"
- [ ] Verify `:root` has the combined value "24rem"
- [ ] Clear the number field — value is removed from `:root`

## 6. Change Font Family Value
- [ ] Select a different font from the dropdown
- [ ] Verify `:root` has the new font-family value

## 7. Breakpoint Values
- [ ] Set a color variable value in Desktop column
- [ ] Set a different value in Tablet column
- [ ] Verify base `:root` has Desktop value
- [ ] Verify `@media (max-width: ...)` `:root` has Tablet value
- [ ] Clear the Tablet value — breakpoint rule should no longer contain the variable

## 8. Delete Variable
- [ ] Click delete (trash) icon on a variable row
- [ ] The row disappears
- [ ] The variable is removed from ALL breakpoint `:root` rules
- [ ] Any component styles using `var(--...)` referencing it are cleared

## 9. Drag-to-Reorder
- [ ] Add 3+ variables
- [ ] Grab the grip handle on a row and drag it to a different position
- [ ] Row order changes and persists on modal re-open

## 10. Multiple Variables
- [ ] Add 3 color variables: primary, secondary, accent
- [ ] Add 2 size variables: spacing-sm, spacing-lg
- [ ] All appear in the modal table with correct type icons
- [ ] All are present in the `:root` rule

## 11. StyleManager Variable Button
- [ ] Close the modal
- [ ] Click on a component in the canvas (e.g. "Box 1")
- [ ] Open Style Manager
- [ ] Find "Background color" — a small "+" trigger should appear next to it
- [ ] Find "Color" (text color) — "+" trigger should also appear
- [ ] Find "Width" in dimension — "+" trigger should appear (size variables)

## 12. Apply Variable via Popover
- [ ] Click "+" next to background-color
- [ ] Popover appears listing color variables (primary, secondary, accent)
- [ ] Click "primary" — the field is replaced by a pill showing "primary"
- [ ] The component's style should become `background-color: var(--color-primary)`

## 13. Remove Variable via Pill Clear
- [ ] A pill is showing (e.g. "primary" on background-color)
- [ ] Click the "x" button on the pill
- [ ] The pill disappears and the normal input field returns
- [ ] The `var()` reference is removed from the component's style

## 14. Variable Change Propagation
- [ ] Apply a color variable to a component's background-color
- [ ] Open the CSS Variables modal
- [ ] Change the variable's color value
- [ ] Close the modal
- [ ] The component should now show the new color

## 15. Size Variable Pill in Style Manager
- [ ] Create a size variable (e.g. "spacing")
- [ ] Select a component, apply the size variable to "Width" via the "+" trigger
- [ ] A pill should appear showing the variable name
- [ ] The component's style should be `width: var(--size-spacing)`

## 16. Composite Properties (Margin/Padding/Border-radius)
- [ ] Expand the Margin composite property
- [ ] Each sub-property (top, right, bottom, left) should have a "+" trigger
- [ ] Apply a size variable to margin-top — pill shows
- [ ] Same for Padding and Border-radius sub-properties

## 17. Font Family Variable in Style Manager
- [ ] Create a typography variable
- [ ] Select a component, find font-family property
- [ ] Click "+" — popover lists typography variables
- [ ] Select one — pill shows, style becomes `font-family: var(--typo-...)`

## 18. Font Weight Does NOT Show Font Family Variables
- [ ] Create typography variables (font-family type)
- [ ] Select a component, find font-weight property in Typography sector
- [ ] Font-weight should NOT have a "+" variable button
- [ ] Font-weight is numeric/keyword and doesn't use font-family variables

## 19. GrapesJS "x" Clear Button Works with Variables
- [ ] Apply a variable (e.g. size variable on width)
- [ ] A pill shows in the Style Manager
- [ ] Click the GrapesJS built-in "x" (clear) button next to the property label
- [ ] The variable should be removed from the component's style
- [ ] The pill should disappear and the normal input should return

## 20. Multi-Class Variable Isolation
- [ ] Select an element (e.g. "Box 1")
- [ ] Add CSS class `class-a` and `class-b` via the selector manager
- [ ] With `.class-a` selected as target, set Color to a CSS variable via the "+" trigger → pill shows
- [ ] Deselect `class-a` (click its checkbox) so only `.class-b` is selected
- [ ] The Color property should show **normal UI**: text input + "+" trigger, **no pill**
- [ ] The "+" trigger should be available to set a variable for `.class-b` independently
- [ ] Re-enable `class-a` so both are selected (`.class-a.class-b`)
- [ ] The combined selector also shows normal UI (no pill) since the var() is on `.class-a` alone
- [ ] Deselect `class-b` so only `.class-a` is selected → the pill returns (variable is on this class)

## 21. Apply Variable at Different Breakpoints (Style Manager)
- [ ] Create a color variable "primary" and a size variable "spacing" in the modal
- [ ] Select a component (e.g. "Box 1")
- [ ] In Desktop device, apply "primary" to background-color via the "+" trigger → pill shows
- [ ] Switch to Tablet device (via GrapesJS device switcher)
- [ ] The same component should still show the "primary" pill (inherited from Desktop rule)
- [ ] Apply a different color variable "secondary" to background-color at Tablet breakpoint
- [ ] The pill should update to show "secondary"
- [ ] Switch back to Desktop — pill should show "primary" (Desktop's own value)
- [ ] Switch to Tablet — pill should show "secondary" (Tablet's override)
- [ ] Verify CSS: Desktop rule has `background-color: var(--color-primary)`, Tablet `@media` rule has `background-color: var(--color-secondary)`

## 22. Override Size Variable per Breakpoint (Style Manager)
- [ ] Create size variables "spacing-lg" (32px) and "spacing-sm" (16px)
- [ ] Select a component, in Desktop device apply "spacing-lg" to Width → pill shows
- [ ] Switch to Mobile device
- [ ] Apply "spacing-sm" to Width → pill shows "spacing-sm"
- [ ] Switch back to Desktop — pill should show "spacing-lg"
- [ ] Clear the Mobile override (switch to Mobile, click × on the pill)
- [ ] The pill should disappear, and the inherited Desktop value should be visible in the field
- [ ] Verify CSS: only the Desktop rule has `width: var(--size-spacing-lg)`, no Mobile `@media` rule for width

## 23. Breakpoint Variable Does Not Leak to Other Devices
- [ ] Apply a variable only at Tablet breakpoint (not Desktop)
- [ ] Switch to Desktop — no pill should show, the property should be empty/default
- [ ] Switch to Mobile — if no Mobile-specific value, the Tablet value may cascade (CSS cascade), but no pill should show (it's inherited, not own)

## 24. Undo/Redo Updates
- [ ] Apply a variable to a component
- [ ] Undo (Ctrl+Z) — the variable should be removed, pill disappears
- [ ] Redo (Ctrl+Shift+Z) — the variable returns, pill shows again
- [ ] Open the modal — variable list should reflect the current undo/redo state

## 25. Size Input Robustness (Modal)
- [ ] Open the modal, add a size variable
- [ ] Type random non-numeric text (e.g. "abc") into the size number input → the row should NOT be deleted
- [ ] Type "16px" into the input → number 16 extracted, unit dropdown set to "px", value stored as "16px"
- [ ] Type "2.5rem" → number 2.5, unit "rem", stored as "2.5rem"
- [ ] Clear the input for a non-base breakpoint → that breakpoint value is removed
- [ ] Clear the input for the base/Desktop breakpoint → value should NOT be deleted (row survives)

## 26. Persistence
- [ ] Variables are stored in `:root` CSS rules
- [ ] Run `editor.Css.getRule(':root').getStyle()` in console
- [ ] Should return object with all defined variables
- [ ] Variable order is stored via `editor.getModel().get('cssVarOrder')`
