# LWC - Shadow DOM CSS Styling

Shadow DOM CSS scoping isolates the styles of a Web Component so its internal rules don't leak out to the document, and standard outer styles cannot bleed in.

---

### The Boundary: Shadow Boundary

In standard (Light) DOM, CSS cascades globally. When an element creates a shadow tree (`element.attachShadow({ mode: 'open' })`), browser rendering establishes a **Shadow Boundary**:

* **No outward leakage:** Styles declared inside the shadow tree (`<style>` tags or adopted stylesheets) never affect outside DOM elements.
* **No inward penetration:** Class names, IDs, or element selectors written in global CSS cannot select elements inside a shadow root.
* **Inheritance still works:** Inheritable CSS properties (like `color`, `font-family`, `font-size`, and `line-height`) flow past the shadow boundary from parent to child unless overridden.

---

### Key Selectors for Shadow Trees

Standard CSS selectors work inside the shadow tree to target its internal elements, but the spec introduces specialized selectors to manage the boundary.

#### 1. `:host`

Targets the custom element wrapper itself from *inside* the shadow tree.

```css
/* Inside the Shadow DOM stylesheet */
:host {
  display: block;
  padding: 1rem;
  background: #f8fafc;
}

/* Matches host only if it has a specific attribute or class */
:host([disabled]) {
  opacity: 0.5;
  pointer-events: none;
}

:host(.theme-dark) {
  background: #1e293b;
  color: #fff;
}

```

#### 2. `:host-context()`

Styles the host element based on whether an outer ancestor matches a selector. Useful for global theme awareness or layout context.

```css
/* Styles the component differently if inside an element with class .dark-mode */
:host-context(.dark-mode) {
  background: #0f172a;
  color: #e2e8f0;
}

```

#### 3. `::slotted()`

Styles content that is declared outside the component but injected inside via a `<slot>`.

```css
/* Styles top-level <p> tags passed into a slot */
::slotted(p) {
  margin: 0;
  color: #475569;
}

/* ❌ INVALID: Cannot target descendants inside the slotted node */
::slotted(p span) {
  font-weight: bold;
}

```

*Note:* The outer document still controls the slotted element's styles. If there is a specificity clash between outer document CSS and `::slotted()`, the outer document wins.

---

### Piercing the Boundary Cleanly

Direct element selection across the boundary is blocked, so the Web Components standard provides three intentional communication channels:

| Method | Syntax | Best Used For |
| --- | --- | --- |
| **CSS Custom Properties** | `var(--theme-accent, #0070d2)` | Theming tokens (colors, radius, spacing). Custom properties pierce through shadow boundaries by design. |
| **CSS Shadow Parts** | `::part(part-name)` | Exposing specific sub-elements for full style customization from outside. |
| **Constructable Stylesheets** | `shadowRoot.adoptedStyleSheets = [sheet];` | Programmatically sharing compiled CSS rules across many shadow trees with zero memory duplication. |

#### Example: CSS Shadow Parts (`::part`)

Inside component template:

```html
<button part="submit-btn" class="internal-btn">Submit</button>

```

Outside document CSS:

```css
/* Cleanly customizes the exposed button from global CSS */
my-form-component::part(submit-btn) {
  background-color: #2563eb;
  border-radius: 9999px;
}

```

---

### Constructable Stylesheets

Instead of injecting inline `<style>` tags in every shadow root, modern browsers support `CSSStyleSheet()` instances via `adoptedStyleSheets`:

```javascript
const sharedSheet = new CSSStyleSheet();
sharedSheet.replaceSync(`
  :host { font-family: system-ui, sans-serif; }
  button { cursor: pointer; }
`);

class MyElement extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.adoptedStyleSheets = [sharedSheet];
  }
}
customElements.define('my-element', MyElement);

```