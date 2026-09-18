# HTML Template

The **`<template>`** tag holds client-side HTML markup that the browser parses upon page load, but does **not render or execute** until you activate it via JavaScript.

Before `<template>`, developers had to concatenate strings (`element.innerHTML = '<div>...'`) or hide DOM nodes with `display: none`—both of which have drawbacks like parsing overhead, script execution leaks, or premature image downloads.

---

### Why Use `<template>`?

* **Inert content:** Images inside a `<template>` don't trigger network requests, scripts (`<script>`) don't execute, and styles aren't applied until cloned and appended to the visible document.
* **Parsed once, cloned many times:** Browsers validate and parse the template HTML once on load. Cloning an already-parsed DOM tree via `cloneNode()` is significantly faster than re-parsing an HTML string with `innerHTML` repeatedly.
* **Separation of concerns:** Keeps component markup in clean HTML structure rather than long, messy JavaScript strings.

---

### Basic Pattern: Plain HTML & JS

Templates have a `.content` property, which is a **DocumentFragment** (a lightweight container holding the nodes).

```html
<!-- 1. The inert blueprint -->
<template id="card-template">
  <div class="user-card">
    <h3 class="user-name"></h3>
    <p class="user-role"></p>
  </div>
</template>

<div id="container"></div>

<script>
  const template = document.getElementById('card-template');
  const container = document.getElementById('container');

  function renderUser(name, role) {
    // 2. Clone the DocumentFragment (true = deep clone with all children)
    const clone = template.content.cloneNode(true);

    // 3. Fill in dynamic data
    clone.querySelector('.user-name').textContent = name;
    clone.querySelector('.user-role').textContent = role;

    // 4. Append to visible DOM
    container.appendChild(clone);
  }

  renderUser('Alex Rivera', 'Frontend Engineer');
  renderUser('Sam Chen', 'DevOps Specialist');
</script>

```

---

### Combining `<template>` with Custom Elements & Shadow DOM

The standard Web Component pattern is to define a template once, then clone it directly into the shadow root inside the component constructor:

```html
<template id="user-badge-template">
  <style>
    :host {
      display: inline-block;
      font-family: system-ui, sans-serif;
    }
    .badge {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      background: #f8fafc;
    }
    ::slotted(span) {
      font-size: 0.85rem;
      color: #64748b;
    }
  </style>

  <div class="badge">
    <h4 id="display-name"></h4>
    <!-- Slot accepts light DOM text passed from the outside -->
    <slot></slot>
  </div>
</template>

<script>
  // Cache the template reference once
  const badgeTemplate = document.getElementById('user-badge-template');

  class UserBadge extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });

      // Clone template markup directly into the private shadow root
      shadow.appendChild(badgeTemplate.content.cloneNode(true));
    }

    connectedCallback() {
      const name = this.getAttribute('name') || 'Anonymous';
      this.shadowRoot.getElementById('display-name').textContent = name;
    }
  }

  customElements.define('user-badge', UserBadge);
</script>

<!-- Usage -->
<user-badge name="Jordan Lee">
  <span>Staff Designer</span>
</user-badge>

```

---

### `<template>` vs. Other Approaches

| Feature | `<template>` Tag | `element.innerHTML = '...'` | Hidden DOM (`display: none`) |
| --- | --- | --- | --- |
| **Media loading** | Inert (no images fetched) | Not applicable until inserted | Images fetch immediately |
| **Script execution** | Scripts do not run until cloned | Runs if inserted via certain DOM APIs | Scripts run immediately |
| **Syntax checking** | Validated as real HTML on parse | Parsed as plain string at runtime | Validated on parse |
| **Performance** | Fast (`cloneNode` is native C++) | Slower (re-invokes HTML parser) | Clones node hierarchy |

---

### Key Gotchas for Beginners

* **Always clone, don't append directly:** Never do `shadow.appendChild(template.content)`. Doing this removes the nodes from the template itself, meaning you can only render the component once. Always pass `true` to make a deep clone: `template.content.cloneNode(true)`.
* **Templates are DOM fragments, not strings:** You interact with the cloned content using standard DOM methods (`querySelector`, `textContent`, `addEventListener`) rather than string interpolation.