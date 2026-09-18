# LWC Parent to Child Communication

Downward data communication in Lightning Web Components (LWC) flows strictly from parent to child. The `@api` decorator exposes a child component's internal properties and functions to its parent, creating a formal public interface.

---

### 1. Downward Data Passing via `@api` Properties

Declaring a field with `@api` makes it a public property. A parent component can bind values to it directly within the template markup.

#### Child Component (`childCard.js` / `childCard.html`)

```javascript
import { LightningElement, api } from 'lwc';

export default class ChildCard extends LightningElement {
    // Exposes title and status as public reactive properties
    @api cardTitle = 'Default Title';
    @api status = 'Draft';
}

```

```html
<!-- childCard.html -->
<template>
    <div class="card">
        <h3>{cardTitle}</h3>
        <p>Status: {status}</p>
    </div>
</template>

```

#### Parent Component Template (`parentContainer.html`)

LWC enforces **kebab-case** in HTML templates for properties declared in **camelCase** in JavaScript.

```html
<!-- parentContainer.html -->
<template>
    <!-- cardTitle in JS maps to card-title in HTML -->
    <c-child-card 
        card-title={parentRecordName} 
        status="Active">
    </c-child-card>
</template>

```

#### Intercepting Property Changes (Getters & Setters)

If the child needs to execute logic, transform incoming data, or re-run operations whenever the parent passes a new value, use an `@api` getter and setter pair:

```javascript
import { LightningElement, api } from 'lwc';

export default class ChildCard extends LightningElement {
    _rawStatus;
    badgeClass;

    @api
    get status() {
        return this._rawStatus;
    }
    set status(value) {
        this._rawStatus = value;
        // Run side-effects immediately when parent updates the value
        this.badgeClass = value === 'Active' ? 'badge-green' : 'badge-gray';
    }
}

```

---

### 2. Downward Execution via `@api` Methods

An `@api` method exposes a JavaScript function that a parent can invoke imperatively. This pattern is ideal for triggering imperative actions on a child (such as resetting a form, playing an animation, or fetching data on demand).

#### Child Component (`customModal.js`)

```javascript
import { LightningElement, api } from 'lwc';

export default class CustomModal extends LightningElement {
    isOpen = false;

    // Public method callable by parent
    @api
    openModal(title) {
        this.modalTitle = title;
        this.isOpen = true;
        return true; // Optional: can return values to the parent
    }

    @api
    closeModal() {
        this.isOpen = false;
    }
}

```

#### Parent Component (`parentView.js` / `parentView.html`)

The parent queries the child node using `template.querySelector` and executes the method directly:

```html
<!-- parentView.html -->
<template>
    <lightning-button label="Launch" onclick={handleOpen}></lightning-button>
    <c-custom-modal></c-custom-modal>
</template>

```

```javascript
// parentView.js
import { LightningElement } from 'lwc';

export default class ParentView extends LightningElement {
    handleOpen() {
        const modal = this.template.querySelector('c-custom-modal');
        if (modal) {
            modal.openModal('Quick Action Window');
        }
    }
}

```

---

### `@api` Properties vs. `@api` Methods

| Feature | `@api` Property | `@api` Method |
| --- | --- | --- |
| **Primary Use Case** | Passing declarative state/data downward | Triggering imperative operations downward |
| **Parent Invocation** | HTML template binding (`attribute={value}`) | JavaScript DOM query (`querySelector().method()`) |
| **Reactivity** | Automatic; re-renders child DOM on change | Manual; depends on child's internal property mutations |
| **Return Values** | None (one-way data binding) | Can return primitives, objects, or Promises |

---

### Critical Limitations & Gotchas

* **Read-Only / One-Way Data Flow:** A child component **cannot** mutate its own `@api` property directly.
```javascript
@api count = 0;
increment() {
    this.count++; // ❌ Error: Cannot assign to read-only property
}

```


* *Fix:* Store the incoming value in a private internal property if the child must mutate it locally, or dispatch a custom event to request the parent to change it.


* **Property Mutation Detection with Objects/Arrays:** LWC tracks object references by shallow comparison. If a parent mutates a nested field on an object (`this.user.name = 'New'`) without updating the reference (`this.user = { ...this.user }`), the child will **not** detect the change or re-render.
* **Boolean Attribute Gotcha:** When passing a boolean property from a parent template:
```html
<!-- Evaluates to TRUE -->
<c-child is-active></c-child>

<!-- ⚠️ Evaluates to the string "false", which is TRUTHY in JS -->
<c-child is-active="false"></c-child> 

<!-- Evaluates to FALSE -->
<c-child is-active={isChildActive}></c-child> <!-- where isChildActive = false in JS -->

```


* **Render Timing (`querySelector` null checks):** Never invoke an `@api` method on a child inside `connectedCallback()`. The child component hasn't rendered into the DOM yet. Always execute queries in `renderedCallback()` (with an execution guard) or inside user event handlers.

---

### Pro-Tips

* **Keep Methods Synchronous When Possible:** Keep `@api` methods focused on initiating work. If an `@api` method triggers asynchronous operations (like an Apex call), have it return a `Promise` so the parent can handle completion with `await`:
```javascript
// Child
@api
async refreshData() {
    this.records = await fetchApex();
    return this.records.length;
}

// Parent
async handleChildRefresh() {
    const count = await this.template.querySelector('c-child').refreshData();
}

```


* **Prefer Properties Over Methods for State:** If you just want to update a label or state flag, bind an `@api` property instead of creating `setLabel(val)` methods. Reserve `@api` methods strictly for imperative actions.