# Shadow DOM Encapsulation

The **Shadow DOM** provides style and DOM encapsulation for Web Components. Without it, global CSS rules bleed into your component, and your component's internal styles bleed out into the rest of the page.

With a Shadow DOM, your component's markup and CSS live in a private, isolated subtree attached to the element.

Want to know more about Shadow DOM Visit : [Mozilla MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)

---

### The Problem vs. The Solution

* **Light DOM (Standard):** If your page has `p { color: red; }`, every `<p>` inside your custom element turns red. If your custom element targets `button { padding: 20px; }`, every button on the entire site gets swollen.
* **Shadow DOM (Encapsulated):** Styles declared inside the shadow tree apply **only** to elements inside that shadow tree. External selectors cannot reach inside by default.

```
[Document / Light DOM]
  ├── <h1> Page Title </h1>
  └── <profile-card>  <────────── Shadow Host
        #shadow-root (open) <──── Boundary protects inside from outside CSS
          ├── <style> p { color: blue; } </style>
          ├── <h2> User Name </h2>
          └── <p> Bio text </p>

```

---

### Basic Implementation

Attach a shadow root inside the element's constructor using `this.attachShadow({ mode: 'open' })`:

```javascript
class EncapsulatedCard extends HTMLElement {
  constructor() {
    super();

    // 1. Create and attach the isolated shadow root
    const shadow = this.attachShadow({ mode: 'open' });

    // 2. Add scoped styles and markup
    shadow.innerHTML = `
      <style>
        /* These styles ONLY apply inside this component */
        :host {
          display: inline-block;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          font-family: sans-serif;
        }

        h3 {
          margin: 0 0 8px 0;
          color: #2b6cb0;
        }

        p {
          margin: 0;
          color: #4a5568;
        }
      </style>

      <h3>Shadow Component</h3>
      <p>My paragraph styles will not bleed into the page!</p>
    `;
  }
}

customElements.define('encapsulated-card', EncapsulatedCard);

```

---

### Core Concepts

#### 1. Open vs. Closed Mode

When calling `this.attachShadow({ mode: '...' })`:

* **`mode: 'open'` (Standard):** Allows outside JavaScript to inspect the shadow tree via `element.shadowRoot`. This is the recommended mode because true security through "closed" mode is rarely needed and complicates testing or accessibility.
* **`mode: 'closed'`:** Returns `null` when accessing `element.shadowRoot` from the outside.

#### 2. The `:host` Selector

Inside your shadow `<style>`, `:host` targets the outer custom element wrapper itself (the tag you registered):

```css
:host {
  display: block; /* Custom elements default to inline */
  background: white;
}

/* Style the host only if it has a specific attribute */
:host([theme="dark"]) {
  background: #1a202c;
  color: white;
}

```

#### 3. Slots: Passing Content from the Outside

To let the consumer pass in custom text or markup while keeping your layout intact, use the `<slot>` element:

```javascript
shadow.innerHTML = `
  <style>
    .card { padding: 12px; border: 1px solid #ccc; }
  </style>
  <div class="card">
    <!-- Slot acts as a placeholder for user-provided HTML -->
    <slot name="title">Default Title</slot>
    <hr>
    <slot></slot> <!-- Default unnamed slot -->
  </div>
`;

```

Usage in HTML:

```html
<encapsulated-card>
  <span slot="title">Special Heading</span>
  <p>This body text projects into the default slot.</p>
</encapsulated-card>

```

> **Important on Slotted Content:** Elements placed inside a `<slot>` still belong to the **Light DOM**. Their styles are primarily governed by the main page's stylesheet, though you can apply fallback rules inside the shadow root using the `::slotted(selector)` pseudo-element.

---

### What Pierces the Boundary?

While class names, IDs, and element selectors cannot cross the boundary, two things do:

1. **Inherited CSS Properties:** Inheritable text properties like `color`, `font-family`, and `line-height` cascade down from the parent document into the shadow tree unless overridden inside.
2. **CSS Custom Properties (Variables):** CSS variables (e.g., `var(--brand-color)`) penetrate the shadow boundary. This is the standard, intentional way to build themeable components:

```css
/* Inside shadow DOM */
button {
  background-color: var(--button-bg, #0070f3); /* Reads global variable if set */
}

```
