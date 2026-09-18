# Salesforce Child to Parent Communication

Upward data communication in Lightning Web Components follows the standard DOM event model: **events up, properties down**. A child component dispatches a `CustomEvent`, and an ancestor listens for it to handle the data or update state.

---

### Basic Implementation Pattern

#### 1. Child Dispatches the Event (`childItem.js`)

Pass payload data using the mandatory `detail` property inside the event options.

```javascript
import { LightningElement } from 'lwc';

export default class ChildItem extends LightningElement {
    handleSelect() {
        const payload = {
            id: '001xx000003DGS1',
            status: 'Approved'
        };

        // Standard custom event
        const selectEvent = new CustomEvent('itemselect', {
            detail: payload
        });

        this.dispatchEvent(selectEvent);
    }
}

```

#### 2. Parent Listens Declaratively (`parentList.html` / `parentList.js`)

In the template, prefix the event name with `on` (e.g., `itemselect` becomes `onitemselect`).

```html
<!-- parentList.html -->
<template>
    <c-child-item onitemselect={handleChildSelect}></c-child-item>
</template>

```

```javascript
// parentList.js
import { LightningElement } from 'lwc';

export default class ParentList extends LightningElement {
    handleChildSelect(event) {
        // Access the payload via event.detail
        const { id, status } = event.detail;
        console.log(`Selected record: ${id} with status: ${status}`);
    }
}

```

---

### Event Propagation: `bubbles` and `composed`

Every custom event has two boolean flags that control how it traverses the DOM and crosses **Shadow DOM boundaries**.

| Configuration | Traverses Up Child's Internal DOM? | Bubbles Beyond Child Boundary into Parent? | Escapes Across Multiple Shadow Boundaries? |
| --- | --- | --- | --- |
| `{ bubbles: false, composed: false }` *(Default)* | No | Direct parent template listener only | No |
| `{ bubbles: true, composed: false }` | Yes | Direct parent template listener only | No |
| `{ bubbles: true, composed: true }` | Yes | Yes | Yes (all ancestor Shadow trees) |

```
[ Grandparent DOM ]
      └── <c-parent> (Shadow Boundary)
               └── <c-child> (Shadow Boundary)
                        └── <button> ─── Event Dispatched Here

```

#### 1. Default: `{ bubbles: false, composed: false }`

* **Target:** The immediate parent's template binding (`<c-child onselect={...}>`).
* **Best Practice:** **Use this 95% of the time.** It enforces loose coupling and keeps components encapsulated without event leakage.

#### 2. Internal Bubbling: `{ bubbles: true, composed: false }`

* **Target:** Elements within the *same* template hierarchy. The event bubbles up inside the child's own DOM, stops at the child's shadow boundary, but can still be caught by the direct parent hosting the child.
* **Use Case:** A parent compound component listening to events emitted by deeply nested raw HTML elements inside its own markup.

#### 3. Boundary Crossing: `{ bubbles: true, composed: true }`

* **Target:** Crosses all shadow boundaries up to the root `document`.
* **Use Case:** Reaching a grandparent component directly without having every intermediate parent re-dispatch the event.

```javascript
// Crosses shadow boundaries to reach higher ancestors
this.dispatchEvent(new CustomEvent('deepupdate', {
    bubbles: true,
    composed: true,
    detail: { value: 42 }
}));

```

In the grandparent:

```javascript
// grandparent.js
connectedCallback() {
    // Listens imperatively on the component container
    this.template.addEventListener('deepupdate', this.handleDeepUpdate.bind(this));
}

```

---

### Retargeting with `composed: true`

When an event crosses a shadow root boundary via `composed: true`, the browser automatically updates `event.target` to preserve encapsulation.

* Inside the child: `event.target` is the internal element (e.g., `<button>`).
* Inside the grandparent: `event.target` is rewritten to `<c-child>`, hiding the child's internal implementation details.

---

### Event Naming Conventions & Rules

* **All Lowercase, No Hyphens:** Standard DOM custom event names should be entirely lowercase (e.g., `itemselected`, `modalclose`).
* **No `on` Prefix in JS:** Do **not** name your event `onselect`. Name it `select`. The parent adds the `on` prefix in HTML (`onselect`).
* **Avoid CamelCase or Underscores:** Event names with uppercase letters (e.g., `itemSelected` or `item_select`) often fail to register properly with HTML template listeners due to case-sensitivity mismatches.

---

### Limitations & Gotchas

* **Payload Mutation:** The `detail` property passes by reference for objects and arrays. If a parent mutates `event.detail.data`, it directly mutates the child's internal reference. If isolation is needed, shallow-copy or deep-clone before dispatching.
* **Avoid Overusing `composed: true`:** Making every event `composed: true` breaks component modularity. It turns components into tightly coupled systems where grandparents depend on private internal child actions. Prefer passing events up one layer at a time or using **Lightning Message Service (LMS)** for distant communication.
* **Listener Cleanup:** If you attach event listeners imperatively using `addEventListener()` (such as on `window` or `document`), you **must** remove them inside `disconnectedCallback()` with `removeEventListener()` to prevent memory leaks and zombie handlers.