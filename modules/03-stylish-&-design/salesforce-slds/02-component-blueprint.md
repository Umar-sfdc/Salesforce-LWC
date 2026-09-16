# SLDS Components Blueprint
An **SLDS Component Blueprint** is an accessible, framework-agnostic HTML and CSS specification provided by Salesforce.

It acts as the architectural pattern for how Salesforce UI components look, structure their semantic HTML, and behave for assistive technologies (ARIA).

Base components like `<lightning-card>` or `<lightning-button>` are pre-packaged implementations of these blueprints. When a base component lacks the flexibility you need, blueprints provide the raw markup to build your own.

---

### Why Blueprints Exist: Base Components vs. Blueprints

| Feature | Base Components (`<lightning-*>`) | SLDS Component Blueprints |
| --- | --- | --- |
| **Implementation** | Black-box, pre-built LWC | Raw semantic HTML + SLDS CSS classes |
| **Speed to Build** | Fast (plug-and-play attributes) | Requires custom wiring and state logic |
| **Customization** | Limited to available `@api` properties & slots | Full control over markup, DOM, and behavior |
| **Interactivity** | Out of the box (drop-downs open, tabs switch) | You must write JavaScript for all states |

---

### Anatomy of a Blueprint

A blueprint defines four core layers:

1. **Semantic DOM Hierarchy:** Standard HTML tags (`<section>`, `<header>`, `<ul>`) organized in a specific structure.
2. **SLDS Component Classes:** Dedicated component classes (`slds-modal`, `slds-tabs_default`, `slds-card`) rather than generic utility classes.
3. **Accessibility (ARIA) Roles & Attributes:** Pre-configured attributes (`role="dialog"`, `aria-expanded="false"`, `aria-haspopup="listbox"`) ensuring screen reader compatibility.
4. **State Classes:** Dynamic modifier classes that reflect component state:
* `slds-is-open` (for dropdowns, menus, popovers)
* `slds-is-active` (for tabs, navigation items)
* `slds-has-error` (for input fields)



---

### Real-World Example: Building a Custom Accordion Blueprint

Base `<lightning-accordion>` is rigid if you need custom action buttons or badges inside the header. By taking the **SLDS Accordion Blueprint**, you implement the markup directly in your template and manage the interaction with LWC reactivity.

#### 1. The Blueprint Markup (HTML)

```html
<!-- customAccordionSection.html -->
<template>
    <div class={sectionClass}>
        <!-- Semantic Section Header -->
        <h3 class="slds-accordion__summary">
            <button 
                type="button" 
                class="slds-button slds-button_reset slds-accordion__summary-action" 
                aria-expanded={isExpanded} 
                onclick={toggleSection}>
                
                <!-- Chevron Icon that rotates via CSS -->
                <lightning-icon 
                    icon-name="utility:switch" 
                    size="x-small" 
                    class="slds-accordion__summary-action-icon slds-m-right_x-small">
                </lightning-icon>
                
                <!-- Title & Custom Extra Elements -->
                <span class="slds-accordion__summary-content">{title}</span>
                <span lwc:if={badgeCount} class="slds-badge slds-m-left_auto">{badgeCount}</span>
            </button>
        </h3>

        <!-- Collapsible Content -->
        <div class="slds-accordion__content" hidden={isCollapsed}>
            <slot></slot>
        </div>
    </div>
</template>

```

#### 2. The Logic to Drive Blueprint State (JavaScript)

```javascript
// customAccordionSection.js
import { LightningElement, api } from 'lwc';

export default class CustomAccordionSection extends LightningElement {
    @api title = '';
    @api badgeCount = 0;
    
    // Internal state driving the blueprint classes
    isOpen = false;

    get isExpanded() {
        return String(this.isOpen);
    }

    get isCollapsed() {
        return !this.isOpen;
    }

    // Toggle the blueprint state class
    get sectionClass() {
        return `slds-accordion__section ${this.isOpen ? 'slds-is-open' : ''}`;
    }

    toggleSection() {
        this.isOpen = !this.isOpen;
    }
}

```

---

### Crucial Implementation Rules

* **Blueprints Are Completely Headless:** Blueprints provide zero JavaScript. If you copy the HTML for an SLDS Dropdown Menu or Modal, clicking it does nothing until you hook up `onclick` handlers, toggle state classes (`slds-is-open`), and update `aria-expanded`.
* **Preserve ARIA Relationships:** Blueprints often rely on pairing IDs for accessibility, such as `aria-controls="content-id"` pointing to `id="content-id"`. In LWC, IDs are transformed at runtime. Always verify that dynamic ARIA bindings resolve properly or use property bindings instead of hardcoded strings.
* **Do Not Copy/Paste Static SVGs:** Blueprints in the documentation often use `<svg aria-hidden="true" class="slds-button__icon">...<use href="..."></use></svg>` for icons. In LWC, replace those raw SVG snippets with `<lightning-icon>` or `<lightning-button-icon>` to avoid manual static resource path management.