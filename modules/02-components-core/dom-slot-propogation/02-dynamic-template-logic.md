# Dynamic Template Logic

In Lightning Web Components, interacting with the DOM and conditionally rendering markup requires a firm understanding of **Shadow DOM encapsulation** and **template directives**.

---

### Part 1: Querying the DOM via `this.template`

LWC enforces Shadow DOM boundaries. You cannot use global lookups like `document.querySelector()`. Instead, you query within your component’s internal shadow tree using `this.template`.

#### Primary Query Methods

* **`this.template.querySelector(selector)`**: Returns the **first** matching element within your component's shadow root, or `null`.
* **`this.template.querySelectorAll(selector)`**: Returns a static **`NodeList`** of all matching elements (empty if none match).

```javascript
import { LightningElement } from 'lwc';

export default class DomQueryDemo extends LightningElement {
    handleValidate() {
        // Single element query
        const emailField = this.template.querySelector('.email-input');
        if (emailField) {
            emailField.reportValidity();
        }

        // Multiple element query (NodeList -> Array methods)
        const inputs = this.template.querySelectorAll('lightning-input');
        const allValid = [...inputs].every((input) => input.checkValidity());
    }
}

```

#### Selection Strategies & Best Practices

1. **Prefer `data-*` attributes over CSS classes for JS logic:**
CSS class names change during redesigns, which breaks queries. Use `data-id` or descriptive data attributes instead.
```html
<lightning-button data-action="submit" onclick={handleClick}></lightning-button>

```


```javascript
const submitBtn = this.template.querySelector('[data-action="submit"]');

```


2. **Never query by Salesforce-mangled IDs:**
LWC transforms static `id` values in HTML at compile time (e.g., `id="my-box"` becomes `id="my-box-123"` to ensure document-wide uniqueness). Never query with `#id`.
3. **Where are queries safe to run?**
* **`renderedCallback()`**: DOM is available. (Guard it to avoid infinite loops).
* **Event Handlers**: Safe; elements exist once the user interacts with them.
* **`constructor()` / `connectedCallback()**`: **Forbidden / unsafe**. The shadow tree has not mounted yet (`querySelector` returns `null`).



---

### Part 2: Dynamic Template Logic

LWC does not allow arbitrary inline JavaScript in HTML templates. Instead, conditional rendering and iteration rely on **template directives** and **backing getters**.

#### 1. Conditional Directives: `lwc:if`, `lwc:elseif`, `lwc:else`

Modern LWC uses `lwc:if` syntax (which replaced the legacy `if:true` / `if:false` directives). These can be applied directly to HTML elements or `<template>` wrappers.

```html
<template>
    <!-- Direct element conditioning -->
    <div lwc:if={isReady} class="container">
        <p>Data loaded successfully.</p>
    </div>

    <div lwc:elseif={hasError} class="error-banner">
        <p>Failed to load data.</p>
    </div>

    <div lwc:else class="loading-state">
        <lightning-spinner alternative-text="Loading"></lightning-spinner>
    </div>
</template>

```

> **Key Performance Detail:** `lwc:if={false}` completely **destroys and unmounts** the node from the DOM. If you run `querySelector` on an unrendered element, it returns `null`. To simply hide an element visually while keeping it in the DOM, use the CSS class `slds-hide` instead.

#### 2. Iteration Directives: `for:each` vs. `iterator`

When looping over lists, each child item **must** have a unique, primitive `key` attribute on its outermost element.

**Pattern A: `for:each` (Standard Loops)**

```html
<template>
    <ul>
        <template for:each={contacts} for:item="contact">
            <li key={contact.id}>
                {contact.name} - {contact.email}
            </li>
        </template>
    </ul>
</template>

```

**Pattern B: `iterator:iteratorName` (Index & Boundary Control)**

Use the iterator directive when you need special handling for the `first` or `last` elements without calculating them in JavaScript:

```html
<template>
    <ul>
        <template iterator:it={contacts}>
            <li key={it.value.id} class={it.first ? 'first-item' : ''}>
                <span>{it.value.name}</span>
                <!-- it.first and it.last return booleans -->
                <span lwc:if={it.last} class="tag">Final Record</span>
            </li>
        </template>
    </ul>
</template>

```

#### 3. Dynamic Styles and Classes via Computed Getters

To apply dynamic styling or conditional classes, bind attributes to pure getters in your JavaScript:

```javascript
export default class DynamicStyling extends LightningElement {
    isExpanded = false;
    sentimentScore = 85;

    get containerClass() {
        return `card-wrapper ${this.isExpanded ? 'is-open' : 'is-collapsed'}`;
    }

    get dynamicInlineStyle() {
        return `opacity: ${this.sentimentScore / 100};`;
    }
}

```

```html
<template>
    <div class={containerClass} style={dynamicInlineStyle}>
        Card Content
    </div>
</template>

```

---

### DOM Querying vs. Dynamic Templates: Summary

| Requirement | Preferred Approach | Why? |
| --- | --- | --- |
| **Hiding/Showing elements** | `lwc:if` or `slds-hide` | Declarative; avoids direct DOM manipulation |
| **Modifying element text** | Bound template variable `{text}` | Reactive, declarative |
| **Validating input components** | `this.template.querySelectorAll()` | Calls public methods like `.checkValidity()` |
| **Attaching third-party DOM plugins** | `this.template.querySelector()` in `renderedCallback()` | Requires actual HTML element references |