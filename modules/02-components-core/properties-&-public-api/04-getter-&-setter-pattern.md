# LWC - Getter and Setter Patterns

Getters and setters in Lightning Web Components intercept read and write operations on component state. They bridge template expressions with JavaScript logic and handle incoming updates from parent components.

---

### Core Syntax & Backing Variables

In standard JavaScript accessors, defining `get foo()` and `set foo()` requires an internal **backing field** (commonly prefixed with an underscore, like `_foo`) to avoid infinite recursion.

```javascript
import { LightningElement, api } from 'lwc';

export default class AccessorDemo extends LightningElement {
    // 1. Backing private property
    _title = '';

    // 2. Decorate the getter when exposing to parents
    @api
    get title() {
        return this._title;
    }

    // 3. Setter handles assignment and transformations
    set title(value) {
        this._title = value ? value.trim().toUpperCase() : '';
    }
}

```

---

### Key Real-World Patterns

#### 1. Dynamic Computed Template Values (Read-Only Getters)

LWC templates do not support inline JavaScript expressions like `{count > 0}` or `{user.name || 'N/A'}`. Getters compute display logic directly in the JavaScript controller:

```javascript
export default class StatusBadge extends LightningElement {
    status = 'IN_PROGRESS';
    totalErrors = 3;

    // Computed string based on multiple reactive properties
    get badgeClass() {
        return this.status === 'SUCCESS' ? 'slds-badge_success' : 'slds-badge_warning';
    }

    // Computed boolean for template visibility
    get hasErrors() {
        return this.totalErrors > 0;
    }
}

```

```html
<template>
    <span class={badgeClass}>Status</span>
    <template lwc:if={hasErrors}>
        <p>Attention required: {totalErrors} issues found.</p>
    </template>
</template>

```

#### 2. Normalizing Incoming Parent Props

Setters allow you to sanitize or enforce types on incoming data before storing it:

```javascript
export default class CustomProgress extends LightningElement {
    _progress = 0;

    @api
    get percentage() {
        return this._progress;
    }
    set percentage(value) {
        // Enforce numeric clamping between 0 and 100
        const numericVal = Number(value) || 0;
        this._progress = Math.min(100, Math.max(0, numericVal));
    }
}

```

#### 3. Deep Defensive Copying for Reference Types

Objects and arrays passed down from parents are read-only proxies. If the child needs to manipulate that data locally, deep-clone it inside the setter:

```javascript
export default class ItemList extends LightningElement {
    _items = [];

    @api
    get items() {
        return this._items;
    }
    set items(value) {
        // Defensive copy: disconnect from parent reference
        this._items = Array.isArray(value) ? JSON.parse(JSON.stringify(value)) : [];
    }
}

```

#### 4. Triggering Side Effects on Prop Changes

A setter is the most reliable place to fetch downstream data or dispatch events when an `@api` property changes dynamically during runtime:

```javascript
export default class RecordDetail extends LightningElement {
    _recordId;

    @api
    get recordId() {
        return this._recordId;
    }
    set recordId(value) {
        this._recordId = value;
        if (value) {
            this.fetchRelatedRecords(value);
        }
    }

    async fetchRelatedRecords(id) {
        // Imperative apex or service call
    }
}

```

---

### How Dependency Tracking Works

LWC's engine tracks getters using **dirty-checking dependencies**:

* A getter is evaluated the first time it is referenced by a template.
* It does **not** recalculate on every cycle. LWC records every reactive property accessed inside the getter.
* The getter only re-evaluates when at least one of its tracked dependencies changes.

```javascript
export default class FullName extends LightningElement {
    firstName = 'Ada';
    lastName = 'Lovelace';
    counter = 0;

    get fullName() {
        // Only re-runs when firstName or lastName updates
        // It will NOT re-evaluate if counter changes
        return `${this.firstName} ${this.lastName}`;
    }
}

```

---

### Critical Rules & Anti-Patterns

* **Apply `@api` only to the getter:** Putting `@api` on both getter and setter or just the setter will cause compilation warnings or runtime errors.
* **Always provide both `get` and `set` for public properties:** If you write `@api get foo()` without a matching `set foo()`, the property becomes strictly read-only. Parents passing `<c-comp foo="bar">` will fail silently or throw runtime errors in strict mode.
* **Never cause side effects in a getter:** Getters must be pure functions with no side effects. Do not mutate reactive state, trigger Apex, or modify the DOM inside a getter.
* **Keep getters fast:** Getters block template rendering. Avoid expensive operations like sorting massive arrays directly inside a getter; perform heavy computation inside a setter or wire adapter and cache the result.