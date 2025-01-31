# `<popin-form>`

`<popin-form>` is a lightweight pop-up form component that displays content in a dialog-like overlay. It can handle focus management, closing behavior, and form submission. It provides named slots for **header**, **body**, and **footer**, and also supports custom styles through CSS properties.

> **Note:** This component is part of a bigger project: [Silex no-code website builder](https://www.silex.me).

---

## Overview

1. **Pop-up Overlay**: 
   - Appears above other content, can capture focus, and closes when users click outside or press <kbd>Escape</kbd>.
   - You can disable automatic closing by using `no-auto-close`.
   - Supports two events when showing or hiding: `popin-opened` and `popin-closed`.

2. **Form Container**: 
   - Embeds a native `<form>` element inside the overlay.
   - Can be integrated with a parent `<form>` via the `for` and `name` attributes.
   - Submits its internal fields through standard form submission events or `FormData` usage.

3. **Slots**:
   - **`slot="header"`**: Header area (often contains a title).
   - **default slot**: Main body content (place your fields, text, etc.).
   - **`slot="footer"`**: Footer area (often contains buttons like “Submit” or “Cancel”).

---

## Basic Usage

```html
<popin-form hidden style="width: 400px">
  <div slot="header">Header</div>
  <div slot="body">
    <!-- Form elements here -->
    <label>
      Name:
      <input type="text" name="username" />
    </label>
  </div>
  <div slot="footer">
    <button type="button" class="secondary" onclick="this.closest('popin-form').close()">Cancel</button>
    <button type="submit">Apply</button>
  </div>
</popin-form>

<!-- Show the popin via removing the 'hidden' attribute -->
<button onclick="document.querySelector('popin-form').removeAttribute('hidden')">
  Open Popin
</button>
```

- The `hidden` attribute keeps the pop-up hidden initially.
- Clicking the “Open Popin” button removes `hidden`, making it visible.
- By default, clicking outside the pop-up or pressing <kbd>Escape</kbd> closes it (unless `no-auto-close` is set).

---

## Attributes

| Attribute        | Type      | Description                                                                 |
|------------------|-----------|-----------------------------------------------------------------------------|
| **`hidden`**     | boolean   | If present, the pop-up is hidden. Remove the attribute to show the pop-up.   |
| **`no-auto-close`** | boolean   | If set, the pop-up **does not** close when the user clicks outside or loses focus. |
| **`for`**        | string    | The `id` of a parent `<form>` to integrate with. If not set, `<popin-form>` finds the nearest `<form>` ancestor. |
| **`name`**       | string    | Name used to prefix internal form data keys, e.g. `myPopinField-username`.   |

---

## Events

| Event            | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| **`popin-opened`**  | Dispatched when the pop-up becomes visible (i.e., `hidden` is removed).    |
| **`popin-closed`**  | Dispatched when the pop-up is hidden (i.e., `hidden` is added).            |
| **`change`**        | Fired after the pop-up form is submitted (the “Apply” button by default).  |

### Closing Behavior

- **Clicking outside** the pop-up or pressing <kbd>Escape</kbd> will close it by default.  
- Disable with `no-auto-close`.  
- Programmatically close by calling `close()` method or setting `hidden` attribute.

---

## Form Logic

- `<popin-form>` internally wraps its content in a `<form>` element.
- When users submit (e.g., pressing “Apply”), it dispatches a `change` event and closes.  
- If you specify `for="mainForm"` and have a `<form id="mainForm">` in the page, `<popin-form>` can merge its data into the parent form’s submission using the standard [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) event.  
- Each input inside `<popin-form>` is collected into an internal `FormData`. The keys are prefixed by `<popin-form name>-<input name>` if `name` is set.

### Example: Integration with a Parent Form

```html
<form id="mainForm">
  <popin-form for="mainForm" name="popinField" hidden style="width: 300px">
    <div slot="header">Edit Fields</div>
    <div slot="body">
      <input type="text" name="title" placeholder="Title" />
      <select name="category">
        <option value="News">News</option>
        <option value="Blog" selected>Blog</option>
      </select>
    </div>
    <div slot="footer">
      <button type="button" class="secondary" onclick="this.closest('popin-form').close()">Cancel</button>
      <button type="submit">Apply</button>
    </div>
  </popin-form>

  <!-- The main form can have other fields too -->
  <label>
    Main Form Field:
    <input type="text" name="mainField" value="Hello" />
  </label>
  <button type="submit">Submit All</button>
</form>

<script>
  document.getElementById('mainForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    // popinField-title and popinField-category are included if changed in the popin
    for (const pair of fd.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
  });
</script>
```

---

## CSS Custom Properties

The pop-up/form layout can be styled with CSS variables:

| CSS Property                             | Description                                      |
|-----------------------------------------|--------------------------------------------------|
| **`--popin-form-header-background`**    | Background color of the header area              |
| **`--popin-form-header-color`**         | Text color of the header                         |
| **`--popin-form-body-background`**      | Background color of the body area                |
| **`--popin-form-body-color`**           | Text color of the body                           |
| **`--popin-form-footer-background`**    | Background color of the footer area              |
| **`--popin-form-footer-color`**         | Text color of the footer                         |
| **`--popin-form-header-border-bottom`** | Border style for the header-bottom (e.g., `1px solid #ccc`) |
| **`--popin-form-footer-border-top`**    | Border style for the footer-top                  |
| **`--popin-form-header-padding`**       | Padding for the header                           |
| **`--popin-form-body-padding`**         | Padding for the body                             |
| **`--popin-form-footer-padding`**       | Padding for the footer                           |
| **`--popin-button-background`**         | Background color of the primary button(s)        |
| **`--popin-button-color`**              | Text color of the primary button(s)              |
| **`--popin-button-hover-background`**   | Hover background color of the primary button(s)  |
| **`--popin-button-hover-color`**        | Hover text color of the primary button(s)        |
| **`--popin-button-border`**             | Border of the primary button(s)                  |
| **`--popin-button-hover-border`**       | Hover border of the primary button(s)            |
| **`--popin-button-padding`**            | Padding of the primary button(s)                 |
| **`--popin-button-hover-padding`**      | Hover padding of the primary button(s)           |
| **`--popin-button-margin`**             | Margin of the primary button(s)                  |
| **`--popin-button-hover-margin`**       | Hover margin of the primary button(s)            |
| **`--popin-form-border-radius`**        | Border radius of the form container              |
| **`--popin-button-background--secondary`** | Background color of the secondary button(s)    |
| **`--popin-button-color--secondary`**   | Text color of the secondary button(s)            |
| **`--popin-button-hover-background--secondary`** | Hover background for the secondary button(s) |
| **`--popin-button-hover-color--secondary`**      | Hover text color for the secondary button(s) |
| **`--popin-button-border--secondary`**  | Border of the secondary button(s)                |
| **`--popin-button-hover-border--secondary`** | Hover border of the secondary button(s)      |
| **`--popin-button-padding--secondary`** | Padding of the secondary button(s)               |
| **`--popin-button-hover-padding--secondary`** | Hover padding of the secondary button(s)     |
| **`--popin-button-margin--secondary`**  | Margin of the secondary button(s)                |
| **`--popin-button-hover-margin--secondary`** | Hover margin of the secondary button(s)      |

---

## Methods

| Method        | Description                                                                     |
|---------------|---------------------------------------------------------------------------------|
| **`close()`** | Hides the pop-up, adds the `hidden` attribute, and fires `popin-closed`.        |

---

## Example: Programmatic Show/Hide

```html
<popin-form hidden id="myPopin" style="width: 300px;">
  <div slot="header">Edit Something</div>
  <div slot="body">
    <input type="text" name="myField" placeholder="Type here..." />
  </div>
  <div slot="footer">
    <button type="button" class="secondary" onclick="this.closest('popin-form').close()">Cancel</button>
    <button type="submit">Ok</button>
  </div>
</popin-form>

<button
  onclick="document.getElementById('myPopin').removeAttribute('hidden')">
  Show Popin
</button>
```

---

## Notes

- Pressing <kbd>Escape</kbd> closes the pop-in unless `no-auto-close` is set.
- By default, when `<popin-form>` is shown, focus is set to it. Once it loses focus (user clicks outside), it closes automatically (again, unless `no-auto-close` is set).
- Upon form submission, `<popin-form>` triggers its own `change` event and closes by default. If you need to prevent closure, override the default `submit(event)` handler, or remove/replace the default footer buttons.

---

That’s it! For more details on complementary components, see:

- **[Expression Input docs](./expression-input.md)**  
- **[Input Chain docs](./input-chain.md)**  

Enjoy creating rich pop-up forms with `<popin-form>`!
