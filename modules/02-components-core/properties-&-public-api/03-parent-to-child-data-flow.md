# Parent to Child Data Flow

In Lightning Web Components, parent-to-child communication follows a strict **unidirectional data flow** (downward binding). Parents own and pass the data; children consume it as read-only configuration inputs.

---

### The Communication Pipeline

Data flows from the parent down to the child through two primary mechanisms:

1. **Declarative passing:** Binding parent properties to child `@api` properties in the template (most common).
2. **Imperative invocation:** Calling a child's `@api` method from the parent’s JavaScript controller.

---

### 1. Declarative Flow (Template Binding)

The parent exposes dynamic or static values through HTML attributes, mapping camelCase JavaScript properties to kebab-case attributes.

#### Child Component: Declare the Receiver

The child exposes properties using the `@api` decorator.

```javascript
// userCard.js (Child)
import { LightningElement, api } from 'lwc';

export default class UserCard extends LightningElement {
    @api userName = 'Anonymous';
    @api role;
    @api isActive = false;
}

```

```html
<!-- userCard.html (Child) -->
<template>
    <div class="card">
        <h3>{userName} ({role})</h3>
        <p>Status: {statusLabel}</p>
    </div>
</template>

```

#### Parent Component: Pass the State Down

The parent binds reactive fields or literals to the child's kebab-case attributes.

```javascript
// userDashboard.js (Parent)
import { LightningElement } from 'lwc';

export default class UserDashboard extends LightningElement {
    currentUser = 'Aarav Patel';
    currentRole = 'Admin';
    enabled = true;

    promoteUser() {
        this.currentRole = 'Principal Architect'; // Child will automatically re-render
    }
}

```

```html
<!-- userDashboard.html (Parent) -->
<template>
    <c-user-card 
        user-name={currentUser}
        role={currentRole}
        is-active={enabled}>
    </c-user-card>

    <lightning-button label="Promote" onclick={promoteUser}></lightning-button>
</template>

```

---

### 2. Passing Objects and Arrays (Reference Gotchas)

When passing complex types (objects or arrays), the parent passes a **memory reference**.

#### Strict Read-Only Rule

LWC strictly forbids a child from mutating an object passed down from a parent.

```javascript
// childComponent.js
export default class ChildComponent extends LightningElement {
    @api userDetails;

    handleEdit() {
        // ❌ RUNTIME ERROR: Public properties are read-only in the child
        this.userDetails.name = 'New Name'; 

        // ✅ If the child needs to modify the data locally, make a copy first:
        this.localUser = { ...this.userDetails, name: 'New Name' };
    }
}

```

#### Triggering Downward Reactivity for Objects

If the parent updates a nested property inside an object, the child will **not** detect the change unless:

1. The parent replaces the entire object reference (`this.user = { ...this.user, role: 'Lead' }`), OR
2. The property in the parent is decorated with `@track`.

---

### 3. Intercepting Incoming Values (Getter / Setter Pattern)

When the child needs to execute side effects, validate data, or transform values whenever the parent provides an update, convert the child's `@api` property into a **getter/setter**.

```javascript
// childBadge.js
import { LightningElement, api } from 'lwc';

export default class ChildBadge extends LightningElement {
    _badgeCount = 0;
    formattedLabel = '';

    @api
    get count() {
        return this._badgeCount;
    }
    set count(value) {
        this._badgeCount = Number(value) || 0;
        // Run reactive side-effects on every parent update
        this.formattedLabel = this._badgeCount > 99 ? '99+' : `${this._badgeCount}`;
    }
}

```

*Note: The setter runs during the initial mount and every subsequent time the parent changes that specific attribute.*

---

### 4. Boolean Attribute Behavior in HTML

Boolean `@api` properties follow HTML standard conventions:

* **Present attribute = `true`:** `<c-toggle is-active></c-toggle>` sets `isActive` to `true`.
* **Absent attribute = `false`:** `<c-toggle></c-toggle>` sets `isActive` to `false`.
* **String values are truthy:** Passing `<c-toggle is-active="false"></c-toggle>` actually passes the string `"false"`, which evaluates to **truthy** in JavaScript. Always use dynamic binding for booleans:
```html
<!-- ✅ Correct boolean binding -->
<c-toggle is-active={isComponentActive}></c-toggle>

```



---

### Summary Table: Data Flow Modifiers

| Pattern | Flow Trigger | Where Logic Lives | Best Used For |
| --- | --- | --- | --- |
| **Direct `@api` Prop** | Parent changes variable | Child template reads directly | Simple text, numbers, flags |
| **`@api get/set`** | Parent changes variable | Child setter runs transforms | Formatting data, resetting child state |
| **`@api method()`** | Parent invokes via DOM | Child runs imperative code | Triggering modal opens, forms resets |