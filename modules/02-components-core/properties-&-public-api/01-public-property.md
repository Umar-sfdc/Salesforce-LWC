# Salesforce Public Property

In Lightning Web Components, the `@api` decorator exposes a component's **public interface** (its properties and methods) to parent components, the Lightning App Builder, and Aura wrappers.

By default, every property and method in an LWC class is private and encapsulated within the component.

---

### 1. Public Properties (`@api property`)

Public properties act as configuration inputs. They enforce **one-way data binding down the hierarchy**: parents pass data down, and children read it.

#### Basic Declaration & HTML Binding

In JavaScript, properties are written in **camelCase**. In the parent's HTML template, they map to **kebab-case** HTML attributes:

```javascript
// childComponent.js
import { LightningElement, api } from 'lwc';

export default class ChildComponent extends LightningElement {
    @api headerTitle;
    @api maxItemCount = 10; // Default value
}

```

```html
<!-- parentComponent.html -->
<template>
    <c-child-component 
        header-title="Active Cases" 
        max-item-count="5">
    </c-child-component>
</template>

```

#### Getters and Setters with `@api`

If you need to intercept when a parent modifies a value—such as computing derived values or normalizing data—apply `@api` to the `get` accessor:

```javascript
// childComponent.js
import { LightningElement, api } from 'lwc';

export default class ChildComponent extends LightningElement {
    _status;

    @api
    get status() {
        return this._status;
    }
    set status(value) {
        this._status = value ? value.trim().toUpperCase() : 'UNKNOWN';
    }
}

```

*Always pair an `@api get` with a `set`. A getter without a setter makes the property read-only from the parent.*

why we use this.status as this_status? [click here to know](../../../FAQ/why-javascript-underscore-convension.md)

---

### 2. Public Methods (`@api methodName()`)

Public methods allow a parent component to invoke imperative actions on a child instance through a DOM reference.

```javascript
// modalChild.js
import { LightningElement, api } from 'lwc';

export default class ModalChild extends LightningElement {
    isOpen = false;

    @api
    openModal() {
        this.isOpen = true;
    }

    @api
    resetForm(clearDefaults = false) {
        const input = this.template.querySelector('lightning-input');
        if (input) input.value = clearDefaults ? '' : 'Default Value';
        return true; // Can return values synchronously
    }
}

```

#### Invoking from the Parent

The parent retrieves the child node via `this.template.querySelector()` and calls the method:

```javascript
// parentContainer.js
import { LightningElement } from 'lwc';

export default class ParentContainer extends LightningElement {
    handleTriggerChild() {
        const modal = this.template.querySelector('c-modal-child');
        if (modal) {
            modal.openModal();
            const success = modal.resetForm(true);
            console.log('Reset completed:', success);
        }
    }
}

```

---

### Core Rules & Limitations

* **Read-Only Child Restriction:** A child component **must never mutate its own `@api` property directly**.
```javascript
@api totalCount;

handleIncrement() {
    // ❌ Throws runtime error in debug mode:
    // "Invalid mutation of public property 'totalCount'"
    this.totalCount += 1; 

    // ✅ Correct: Fire a CustomEvent to notify the parent
    this.dispatchEvent(new CustomEvent('countchange', { detail: this.totalCount + 1 }));
}

```


* **Object & Array References (Shallow Immutability):** If an `@api` property receives an Object or Array, modifying nested fields directly (`this.userProfile.name = 'Bob'`) violates strict immutability patterns. Always treat incoming objects as read-only.
* **Property Naming Clashes:** Do not prefix public property names with `on` (e.g., `@api onChange`), as this conflicts with DOM event handler syntax. Avoid standard HTML attribute names like `title`, `class`, `id`, and `slot` unless deliberately overriding host attributes.
* **Synchronous Calling Only:** Calling an `@api` method returns whatever the method returns. If the child's method runs asynchronous logic, it must explicitly return a `Promise` so the parent can `await` or chain `.then()`.

---

### Passing Values via Lightning App Builder

To make an `@api` property configurable in the Lightning App Builder, declare it inside your component's `.js-meta.xml` configuration file:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>60.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__RecordPage</target>
        <target>lightning__AppPage</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightning__RecordPage, lightning__AppPage">
            <property name="headerTitle" type="String" label="Card Title" default="Summary View"/>
            <property name="maxItemCount" type="Integer" label="Max Items" min="1" max="50"/>
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>

```