# `<expression-input>`

The `<expression-input>` component lets users build an expression from multiple selectable tokens or switch to a fixed value. It is designed to behave like a standard form input (supports `name`, can be used in `<form>` elements, works with `FormData` API, etc.).

> **Note:** This component is part of a bigger project: [Silex no-code website builder](https://www.silex.me).

---

## Overview

- **Expression Mode**: Users pick from one or more `<select>` elements (or any child inputs) to form a chain of values.
- **Fixed Mode**: Users can directly enter a text (or other types) in a single input field.

When fixed mode is active, the component hides the chain of `<select>` elements and shows the fixed input instead.

> [**Interactive Demo**](https://codepen.io/lexoyo/full/dPbrQzY)

---

## Basic Usage

```html
<!-- Expression mode with multiple <select> elements -->
<expression-input name="myExpression">
  <span slot="label">My Expression</span>

  <!-- The default slot holds all the tokens in expression mode -->
  <select>
    <option value="">+</option>
    <option value="BlogPost" selected>BlogPost</option>
    <option value="Page">Page</option>
  </select>

  <select>
    <option value="">+</option>
    <option value="title">title</option>
    <option value="content" selected>content</option>
  </select>

  <!-- The fixed slot is only visible if `fixed` is true -->
  <span slot="fixed">
    <input type="text" value="Fixed Value Here" />
  </span>
</expression-input>
```

### Toggling Fixed/Expression

- Include the `allow-fixed` attribute to show toggle buttons labeled **Fixed** / **Expression**.
- Add the `fixed` attribute to activate fixed mode by default:

```html
<expression-input allow-fixed fixed name="myExpression">
  <span slot="label">My Value</span>
  <span slot="fixed">
    <input type="text" value="Some fixed text" />
  </span>
  <!-- Expression slot is hidden when `fixed` is true -->
  <select>
    <option value="">+</option>
    <option value="BlogPost">BlogPost</option>
    <option value="Page">Page</option>
  </select>
</expression-input>
```

---

## Form Integration

Use it inside a `<form>` just like a standard input:

```html
<form id="myForm">
  <expression-input name="contentPath" allow-fixed></expression-input>
  <button type="submit">Submit</button>
</form>
<script>
  const form = document.getElementById('myForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    console.log('Submitted contentPath:', formData.getAll('contentPath'));
  });
</script>
```

---

## Attributes

| Attribute      | Type     | Description                                                                                                                |
|----------------|----------|----------------------------------------------------------------------------------------------------------------------------|
| `name`         | `string` | Standard HTML input `name`; used when submitting in a form.                                                                |
| `fixed`        | `boolean`| Toggles whether the component is in “fixed value” mode.                                                                    |
| `allow-fixed`  | `boolean`| Shows toggle tabs labeled **Fixed** / **Expression** to let users switch modes.                                            |
| `placeholder`  | `string` | Placeholder text shown in expression mode if no `<select>` elements or they have no selected values.                       |

---

## Properties

| Property   | Type          | Description                                                                                                       |
|------------|---------------|-------------------------------------------------------------------------------------------------------------------|
| `value`    | `string[]`    | **Read-only.** In expression mode, an array of all selected option values. In fixed mode, an array with the fixed input’s value (or empty). |
| `dirty`    | `boolean`     | **Read-only.** Indicates if the user has entered anything. Default implementation checks if `value.length > 0`.   |
| `options`  | `HTMLOptionElement[]` | **Read-only.** The selected `<option>` elements (only relevant in expression mode).                                 |

---

## Events

| Event   | Description                                                         |
|---------|---------------------------------------------------------------------|
| `change`| Fired whenever the user changes the value (either in expression or fixed mode). |

---

## Methods

| Method  | Description                                                            |
|---------|------------------------------------------------------------------------|
| `reset()` | Clears the current value and resets to the initial state (empty chain or empty fixed input). |

---

## Example: Dynamic Expressions

```html
<expression-input
  name="dynamicExpr"
  onchange="console.log('Expression changed:', event.target.value)"
>
  <!-- Label for the input -->
  <span slot="label">Dynamic Expression</span>

  <!-- Expression tokens -->
  <select>
    <option value="">+</option>
    <option value="User" selected>User</option>
    <option value="Settings">Settings</option>
  </select>
  <select>
    <option value="">+</option>
    <option value="Name" selected>Name</option>
    <option value="Email">Email</option>
  </select>

  <!-- Fixed slot if needed -->
  <span slot="fixed">
    <input type="text" placeholder="Enter a fixed value" />
  </span>
</expression-input>
```

---

## Notes

- If the component is in **fixed mode** (`fixed` attribute present), the `<expression-input>` will ignore the `<select>` elements in the default slot. Its `value` will be the content of the `<input>` or `<textarea>` in the `slot="fixed"`.
- If you want to dynamically remove or add `<select>` elements in expression mode, consider pairing `<expression-input>` with the `[reactive]` approach from [`<input-chain>`](./input-chain.md), or handle it via external JS logic.

---

That’s it! For more advanced usage, check out:

- **[Input Chain docs](./input-chain.md)**  
- **[Popin Form docs](./popin-form.md)**  

Enjoy building expressions with `<expression-input>`!
