# LWC - Unnamed/Name Slot Components

**Slots** are placeholders inside a component’s template that allow a parent component to inject arbitrary HTML, text, or other components into the child. They are based on the Web Components `<slot>` specification and form the foundation of flexible component composition in LWC.

---

### Unnamed vs. Named Slots

| Feature | Unnamed Slot (Default) | Named Slot |
| --- | --- | --- |
| **Tag Syntax** | `<slot></slot>` | `<slot name="header"></slot>` |
| **Quantity** | At most **one** per component | **Multiple** allowed (each must have a unique name) |
| **Parent Matching** | Receives any content without a `slot` attribute | Must match via the `slot="name"` attribute |
| **Use Case** | General body/content projection | Structured layouts (headers, footers, action bars) |

---

### 1. The Child Component: Defining the Layout

A child component declares where dynamic markup will land using `<slot>` elements.

```html
<!-- customCard.html (Child) -->
<template>
    <div class="slds-card slds-p-around_medium">
        <!-- Named Slot: Header -->
        <header class="slds-border_bottom slds-p-bottom_small">
            <slot name="header">
                <!-- Default / Fallback Content -->
                <h2 class="slds-text-heading_small">Default Card Title</h2>
            </slot>
        </header>

        <!-- Unnamed Slot: Body -->
        <main class="slds-p-vertical_medium">
            <slot>
                <!-- Fallback if parent passes nothing -->
                <p>No content provided.</p>
            </slot>
        </main>

        <!-- Named Slot: Footer -->
        <footer class="slds-border_top slds-p-top_small">
            <slot name="footer"></slot>
        </footer>
    </div>
</template>

```

#### Fallback Content

Content placed *inside* the `<slot>` tags in the child template serves as fallback content. It renders automatically if the parent passes nothing into that slot.

---

### 2. The Parent Component: Projecting the Content

The parent passes markup into the child. Markup targeting a named slot uses the `slot="slotName"` attribute. Any markup without a `slot` attribute automatically drops into the unnamed slot.

```html
<!-- parentView.html -->
<template>
    <c-custom-card>
        <!-- Injects into <slot name="header"> -->
        <div slot="header" class="slds-grid slds-grid_align-spread">
            <h2 class="slds-text-heading_medium">Case Details</h2>
            <lightning-badge label="High Priority"></lightning-badge>
        </div>

        <!-- Injects into the unnamed <slot> -->
        <p>Customer reported intermittent login failures since the morning update.</p>
        <lightning-button label="View Logs" class="slds-m-top_small"></lightning-button>

        <!-- Injects into <slot name="footer"> -->
        <div slot="footer">
            <lightning-button variant="brand" label="Escalate"></lightning-button>
        </div>
    </c-custom-card>
</template>

```

---

### Crucial Concepts: Scope, Styling, and DOM Access

#### 1. Execution Context & Scope (Who Owns What?)

Slotted content compiles and evaluates in the **parent’s context**, not the child’s.

* Event handlers on slotted elements execute in the parent’s JavaScript controller.
* Tracked properties referenced in slotted elements belong to the parent.

```html
<!-- parentView.html -->
<c-custom-card>
    <!-- handleAction belongs to parentView.js, NOT customCard.js -->
    <lightning-button 
        label="Click Me" 
        onclick={handleAction}>
    </lightning-button>
</c-custom-card>

```

#### 2. DOM Access & Querying

Because of Shadow DOM encapsulation, the child component **cannot** access slotted elements using `this.template.querySelector()`.

To access projected elements from inside the child, listen for the `slotchange` event:

```javascript
// customCard.js (Child)
export default class CustomCard extends LightningElement {
    handleSlotChange(event) {
        // Retrieve elements assigned to this specific slot
        const assignedNodes = event.target.assignedNodes({ flatten: true });
        console.log('Slotted nodes:', assignedNodes);
    }
}

```

```html
<!-- customCard.html -->
<slot onslotchange={handleSlotChange}></slot>

```

#### 3. CSS Styling Boundaries

* CSS written in the **child’s `.css` file cannot style slotted content directly**.
* The **parent’s CSS** styles the slotted markup.
* If a child component *must* style slotted content from within its own CSS, use the standard CSS pseudo-element `::slotted()`:

```css
/* customCard.css */
/* Styles top-level <p> tags passed into any slot inside this component */
::slotted(p) {
    font-weight: 600;
    color: #0176d3;
}

```

*Limitation:* `::slotted()` only targets **direct top-level children** passed into the slot, not nested descendants (e.g., `::slotted(div p)` will not work).

---

### Common Limitations

* **No Dynamic Slot Names:** You cannot bind slot names dynamically (e.g., `<slot name={dynamicName}>` or `<div slot={dynamicName}>` are invalid).
* **Multiple Unnamed Slots:** A component template cannot have more than one unnamed `<slot>`. If multiple unnamed slots exist, only the first one receives content.
* **Conditional Slots:** Wrapping a `<slot>` in `lwc:if` works, but destroying the slot disconnects and unmounts the slotted elements until re-rendered.