# LWC - Component Styling

Salesforce Lightning Web Components (LWC) implement the **Shadow DOM** standard (or synthetic shadow DOM in older runtimes), meaning styles declared inside a component bundle are encapsulated and strictly scoped to that component's template by default.

---

### Core Styling & Scoping Mechanics

* **Local Component Scope:** CSS rules defined in `myComponent.css` only apply to tags within `myComponent.html`. They do not leak into parent containers or bleed down into child components.
* **The `:host` Selector:** Targets the outer custom element itself (`<c-my-component>`).
```css
/* Applies to the outer element wrapper */
:host {
  display: block;
  margin: 1rem;
}
/* Contextual matching: apply only when parent/host has a specific class */
:host(.active) {
  border: 2px solid green;
}

```


* **Light DOM Components:** Setting `static renderMode = 'light';` in your JS class removes the Shadow DOM boundary. The template renders into normal DOM, allowing global parent CSS and standard SLDS rules to target inner elements directly.

---

### Styling Across Component Boundaries

Because Shadow DOM blocks normal child-element selectors (e.g., `c-child div` won't style the child's `div`), Salesforce provides standard extension points:

| Technique | How It Works | Best Used For |
| --- | --- | --- |
| **SLDS Styling Hooks** | Overriding CSS Custom Properties (`--slds-c-*` or `--sds-c-*`) exposed by standard base components. | Changing colors, borders, and padding of `lightning-button`, `lightning-card`, etc. |
| **Slots (`::slotted()`)** | Targets markup passed into `<slot>` elements from a parent. | Styling slotted markup while respecting shadow boundaries. |
| **Shared CSS Modules** | Bundling common CSS variables and utilities into an independent LWC and importing via `@import`. | Design systems and shared company palettes. |
| **`loadStyle`** | Dynamically loading an external `.css` static resource via `lightning/platformResourceLoader`. | Legacy third-party CSS or full global overrides. |

---

### Tips & Tricks

* **Override Base Components with Styling Hooks:** Never try to hack standard classes inside a base component (like `.slds-button`). Instead, set the supported CSS variables on the host or a wrapper:
```css
/* Targets a base button inside your component */
lightning-button {
  --slds-c-button-brand-color-background: #0070d2;
  --slds-c-button-brand-color-border: #0070d2;
}

```


* **Use CSS Modules for DRY Styling:** Create a module containing only CSS (e.g., `cssLibrary/cssLibrary.css`) and import it directly into any component:
```css
@import 'c/cssLibrary';

```


* **Leverage Custom Properties for Dynamic Theming:** Expose your own custom CSS properties within `:host` so parent components can re-theme child elements without touching their internal markup:
```css
:host {
  --my-card-bg: #ffffff;
}
.custom-card {
  background-color: var(--my-card-bg);
}

```


* **Slot Targeting Caveats:** The `::slotted()` pseudo-element can only target top-level slotted nodes, not nested descendants.
```css
/* Works on direct slotted node */
::slotted(p) { color: #333; }

/* Fails - cannot reach nested children inside the slotted item */
::slotted(p span) { color: #333; }

```


* **Prefer SLDS Utility Classes:** Base SLDS utility classes (such as `slds-p-around_medium`, `slds-m-top_small`, `slds-grid`) are available out-of-the-box in template markup and prevent bundle bloat from redundant custom rules.