# `<input-chain>`

`<input-chain>` is a Lit-based web component to create a chain of selectable inputs (usually `<select>` elements), enabling users to build multi-step selections. It can be included in a standard `<form>` element and uses the native `FormData` event to submit its values.

> **Note:** This component is part of a bigger project: [Silex no-code website builder](https://www.silex.me).

---

## Overview

- Dynamically handles a sequence of selects or custom inputs.
- Supports form submission with a `name`.
- Optional “reactive” approach: if `reactive` is true, the component emits a `change` event without automatically removing subsequent selects. You can then decide how to refresh available options.

---

## Basic Usage

```html
<!-- Simple chain of two <select> elements -->
<input-chain name="myChain">
  <select>
    <option value="">+</option>
    <option value="posts" selected>posts</option>
    <option value="pages">pages</option>
  </select>
  <select>
    <option value="">+</option>
    <option value="title">title</option>
    <option value="content" selected>content</option>
  </select>
</input-chain>
```

### Submitting With a Form

```html
<form id="myForm">
  <input-chain name="chainData">
    <select>
      <option value="">+</option>
      <option value="opt1" selected>Option1</option>
      <option value="opt2">Option2</option>
    </select>
    <select>
      <option value="">+</option>
      <option value="subOptA">SubOptionA</option>
      <option value="subOptB" selected>SubOptionB</option>
    </select>
  </input-chain>
  <button type="submit">Submit</button>
</form>
<script>
  document.getElementById('myForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    // If multiple options are selected across the chain, 
    // each gets appended under the same FormData key:
    console.log('chainData:', fd.getAll('chainData'));
  });
</script>
```

---

## Attributes

| Attribute       | Type      | Description                                                                      |
|-----------------|-----------|----------------------------------------------------------------------------------|
| `name`          | `string`  | Standard HTML input `name`; used when submitting in a form.                      |
| `for`           | `string`  | The `id` of a `<form>` to associate with (if not nested directly in the form).   |
| `reactive`      | `boolean` | If set, emits a `change` event whenever a selection changes, without removing subsequent `<select>` elements automatically. |

---

## Properties

| Property       | Type                    | Description                                                                                                                          |
|----------------|-------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `options`      | `HTMLOptionElement[]`  | **Read-only.** Returns all `<option>` elements (both selected and unselected) within the chained selects or custom inputs.            |

---

## Events

| Event      | Description                                                                                                    |
|------------|----------------------------------------------------------------------------------------------------------------|
| `change`   | Fired whenever one of the chained selects changes. In non-`reactive` mode, `<input-chain>` also removes subsequent selects after the changed element. |

---

## Non-Reactive vs. Reactive Mode

- **Non-Reactive (default):** Changing a select resets/removes subsequent selects in the chain. This enforces a strict step-by-step logic.
- **Reactive Mode (`reactive` attribute present):** `<input-chain>` still fires a `change` event when a select changes, but it **does not** automatically remove subsequent elements. Instead, you decide how to update the chain via external logic.

Example (Reactive mode):

```html
<input-chain name="myReactiveChain" reactive>
  <select>
    <option value="">Choose...</option>
    <option value="a" selected>A</option>
    <option value="b">B</option>
  </select>
  <select>
    <option value="">Next...</option>
    <option value="1" selected>1</option>
    <option value="2">2</option>
  </select>
</input-chain>
<script>
  const chain = document.querySelector('input-chain[reactive]');
  chain.addEventListener('change', (e) => {
    console.log('Reactive chain changed. Current options:', e.target.options);
    // If you want to add/remove selects or update them, do it here.
  });
</script>
```

---

## Example: Dynamic Selects on Change

```html
<input-chain name="myDynamicChain">
  <select id="select1">
    <option value="">+</option>
    <option value="fruit" selected>Fruit</option>
    <option value="animal">Animal</option>
  </select>
  <select id="select2">
    <option value="">+</option>
    <option value="banana" selected>banana</option>
    <option value="apple">apple</option>
  </select>
</input-chain>

<script>
  const chain = document.querySelector('input-chain[name="myDynamicChain"]');
  chain.addEventListener('change', () => {
    console.log('Chain changed! Current selection array:', chain.options
      .filter(opt => opt.selected)
      .map(opt => opt.value)
    );
  });
</script>
```

---

## Notes

- You can use the same `<input-chain>` multiple times within a form, giving each a different `name`.
- If you need custom tags for `<select>` and `<option>`, see `select-tag-name` and `option-tag-name` in the source code.
- `<input-chain>` automatically calls `event.preventDefault()` and `event.stopImmediatePropagation()` on its internal `change` event to unify its behavior. If you need the raw event data, listen to `<input-chain>`’s external `change` event.

---

For further reading, check out:

- **[Expression Input docs](./expression-input.md)**  
- **[Popin Form docs](./popin-form.md)**  

Enjoy chaining your selects with `<input-chain>`!
