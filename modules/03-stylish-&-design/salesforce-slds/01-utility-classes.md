# Salesforce SLDS Utility Classes

Salesforce Lightning Design System (**SLDS**) utility classes are pre-built CSS helper classes that handle spacing, typography, grid layouts, alignment, and visibility. They let you build consistent, responsive UIs directly in your template without writing custom CSS.

---

### Anatomy of an SLDS Class

SLDS follows a strict naming convention:

$$\text{slds-} + \text{category} + \text{\_} + \text{property/direction} + \text{\_} + \text{size/modifier}$$

* Example: `slds-m-top_medium` $\rightarrow$ Salesforce LDS (`slds-`), Margin (`m`), Top (`-top`), Medium scale (`_medium`).

---

### Core Utility Categories

**1. Spacing (Margin & Padding)**

* Format: `slds-m-` (margin) or `slds-p-` (padding).
* Directions: `top`, `bottom`, `left`, `right`, `horizontal`, `vertical`, `around`.
* Scales: `none`, `xxx-small`, `xx-small`, `x-small`, `small`, `medium`, `large`, `x-large`, `xx-large`.

```html
<!-- Padding all around medium (1rem), margin only at bottom small (0.75rem) -->
<div class="slds-p-around_medium slds-m-bottom_small">
    Card content
</div>

```

**2. Grid & Flexbox Layouts**

* Built entirely on CSS Flexbox.
* Key classes: `slds-grid`, `slds-wrap`, `slds-col`, and size fraction helpers (`slds-size_1-of-2`, `slds-size_1-of-3`, `slds-size_12-of-12`).

```html
<div class="slds-grid slds-wrap slds-gutters">
    <!-- Two-column layout on desktop: 50% width each -->
    <div class="slds-col slds-size_1-of-2">Column A</div>
    <div class="slds-col slds-size_1-of-2">Column B</div>
</div>

```

* Alignment helpers:
* Vertical: `slds-grid_vertical-align-center`
* Horizontal: `slds-grid_align-spread`, `slds-grid_align-center`, `slds-grid_align-end`



**3. Typography**

* Headings: `slds-text-heading_large`, `slds-text-heading_medium`, `slds-text-heading_small`.
* Body sizes: `slds-text-body_regular`, `slds-text-body_small`.
* Text modifiers:
* Colors: `slds-text-color_weak`, `slds-text-color_error`, `slds-text-color_success`.
* Alignment: `slds-text-align_center`, `slds-text-align_right`.
* Truncation: `slds-truncate` (applies ellipsis `...` to overflowing text).



```html
<h2 class="slds-text-heading_medium slds-truncate" title="Long Account Name">
    Acme Corp - Global Implementation
</h2>
<p class="slds-text-body_small slds-text-color_weak">Last modified: Yesterday</p>

```

**4. Visibility & Display**

* `slds-hide`: Sets `display: none !important;` (preserves the element in the DOM, unlike `lwc:if`).
* `slds-show`: Resets display back to default.
* `slds-is-relative` / `slds-is-absolute`: Positioning helpers (often used with spinners and modals).

```html
<div class="slds-is-relative slds-p-around_large">
    <!-- Spinner centers itself relative to this container -->
    <lightning-spinner alternative-text="Loading" size="small"></lightning-spinner>
    <p>Content loading...</p>
</div>

```

**5. Borders & Dividers**

* Borders: `slds-border_top`, `slds-border_bottom`, `slds-border_right`, `slds-border_left`.
* Separation lines: `slds-has-divider_top`, `slds-has-divider_bottom-space`.

---

### Responsive Design Modifiers

SLDS supports responsive breakpoints using media-query prefixes:

* `@small` (Min-width: 480px / phone landscape)
* `@medium` (Min-width: 768px / tablet)
* `@large` (Min-width: 1024px / desktop)

Place the breakpoint after the size fraction:

```html
<div class="slds-grid slds-wrap">
    <!-- Full width on mobile, half width on desktop -->
    <div class="slds-col slds-size_1-of-1 slds-large-size_1-of-2">
        Column 1
    </div>
    <div class="slds-col slds-size_1-of-1 slds-large-size_1-of-2">
        Column 2
    </div>
</div>

```

---

### Key Rules & Gotchas in LWC

* **Shadow DOM Compatibility:** Standard SLDS utility classes **work natively** inside an LWC template because Salesforce injects the base SLDS design tokens and common utilities into the synthetic/native shadow root automatically.
* **Component Internals Are Protected:** You can apply an SLDS class to your own HTML tags (`<div>`, `<p>`, `<span>`) or to the outer tag of a base component (`<lightning-input class="slds-m-bottom_medium">`). You **cannot** use an SLDS class in your template to reach inside the internal shadow DOM of `<lightning-input>` to change its inner `<input>` field.
* **Don't Override SLDS Selectors in CSS:** Avoid writing `.slds-m-top_medium { margin-top: 50px; }` in your local `.css` file. Overriding global design framework classes breaks predictable design tokens across the org.
