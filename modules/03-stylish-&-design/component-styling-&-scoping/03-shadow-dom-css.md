# LWC - Shadow DOM CSS 

In Lightning Web Components (and modern web development), **Shadow DOM CSS Scoping** encapsulates styles. Rules defined in your component's CSS file cannot bleed out to affect other components, and parent or global CSS cannot bleed in to alter your component’s internal DOM structure.

---

### The Fundamental Boundary Rules

1. **No Outward Bleed:** A selector like `button { background: red; }` defined in your component's CSS only affects `<button>` tags inside your component’s own HTML template. Global buttons and child components remain untouched.
2. **No Inward Penetration:** Rules defined outside the component (even with `!important`) cannot reach through the shadow boundary to target internal elements like `.custom-title`.
3. **Inherited CSS Properties Pass Through:** Properties that inherit by nature (like `color`, `font-family`, `line-height`, and CSS Custom Properties) still cascade down into the shadow tree from the outer document.

---

### Key Selectors for Scoped Styling

#### 1. Styling the Host Element: `:host`

The host element is the custom element itself (e.g., `<c-my-card>`). Because the host sits on the boundary between the parent and the shadow root, use `:host` to target it:

```css
/* myCard.css */

/* Applies display, border, and width to <c-my-card> */
:host {
    display: block;
    border: 1px solid #e5e5e5;
    background-color: #ffffff;
}

/* Conditionally style the host if it has an attribute or class */
:host([data-variant="compact"]) {
    padding: 0.5rem;
}

:host(.is-active) {
    border-color: #0176d3;
}

```

#### 2. Contextual Host Styling: `:host-context()`

`:host-context()` matches the host element only if it (or any of its ancestor elements in the outer DOM) matches the given selector. This is useful for theme-based adaptations:

```css
/* myCard.css */

/* Styles the host only if an ancestor has the class 'dark-theme' */
:host-context(.dark-theme) {
    background-color: #1a1a1a;
    color: #ffffff;
}

```

#### 3. Styling Injected Markup: `::slotted()`

When content is projected into your component via `<slot>`, it technically belongs to the parent’s DOM tree, not your shadow tree. You can target it from inside the child component using `::slotted()`:

```css
/* myCard.css */

/* Target top-level <p> tags placed directly inside a slot */
::slotted(p) {
    font-size: 0.875rem;
    color: #444;
}

/* Target a specific slotted class */
::slotted(.highlight) {
    background-color: #fef08a;
}

```

**Constraints on `::slotted()`:**

* It can only target **top-level elements** directly assigned to the slot.
* It cannot style nested descendants (e.g., `::slotted(div p)` or `::slotted(ul > li)` are **invalid**).

---

### Crossing the Shadow Boundary: CSS Custom Properties

Because direct class selectors cannot cross the boundary, the standard, supported way to theme or customize child components from a parent or global stylesheet is via **CSS Custom Properties (CSS variables)**.

CSS variables pierce through shadow roots automatically because they inherit down the DOM tree.

#### Component Implementation (Child)

Use `var()` with a sensible default fallback:

```css
/* childBadge.css */
.badge {
    background-color: var(--badge-bg-color, #706e6b);
    color: var(--badge-text-color, #ffffff);
    padding: 4px 8px;
    border-radius: 4px;
}

```

#### Parent Customization

The parent defines the variable on the host element or any ancestor:

```css
/* parentPage.css */
c-child-badge {
    --badge-bg-color: #2e844a;
    --badge-text-color: #ffffff;
}

```

---

### Synthetic Shadow DOM vs. Native Light DOM

Salesforce LWC historically utilized **Synthetic Shadow DOM** (a JavaScript-based polyfill) and has been transitioning to **Native Shadow DOM** and **Light DOM**.

* **Synthetic Shadow:** Implemented via automatic attribute scoping (classes and tags are prefixed or transformed at build time).
* **Native Shadow:** Uses the browser’s actual `attachShadow({ mode: 'open' })`. Strict boundary enforcement.
* **Light DOM (`renderMode = 'light'`):** If you need third-party CSS frameworks or external styling to penetrate directly without shadow encapsulation:

```javascript
// myLightComponent.js
import { LightningElement } from 'lwc';

export default class MyLightComponent extends LightningElement {
    static renderMode = 'light'; // Opts out of Shadow DOM entirely
}

```

*In Light DOM, the component renders standard DOM nodes directly into the host element, allowing global styles (like full Salesforce SLDS utility classes) to apply seamlessly.*

---

### Summary of Styling Targets

| Selector / Mechanism | What It Targets | Notes |
| --- | --- | --- |
| **Standard Tag/Class** (e.g., `.title`, `p`) | Elements inside the component's own template | Cannot affect parents or slotted markup |
| **`:host`** | The custom element wrapper itself | Perfect for layouts (`display: block`, margins) |
| **`:host-context()`** | The host, based on ancestor classes | Great for dark mode or specific page contexts |
| **`::slotted()`** | Direct children projected into `<slot>` | Cannot select nested descendant nodes |
| **CSS Variables** (`var(--custom-prop)`) | Any element reading that variable | **The primary way to pass styles across boundaries** |