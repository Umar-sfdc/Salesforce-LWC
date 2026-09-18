# LWC - Field Reactivity

**Reactivity** in Lightning Web Components (LWC) means that whenever a variable’s value changes in your JavaScript file, the HTML template automatically re-renders to display the new value on the screen.

---

### 1. The Core Rule: Primitive Types are Auto-Reactive

For primitive data types (strings, numbers, booleans), any reassignment automatically updates the UI.

```javascript
import { LightningElement } from 'lwc';

export default class Greeting extends LightningElement {
    userName = 'Alex'; // Primitive (string)

    changeName() {
        this.userName = 'Taylor'; // UI re-renders automatically!
    }
}

```

---

### 2. The Big Beginner Trap: Objects & Arrays

JavaScript treats primitives by value, but objects and arrays by **reference** (memory address).

By default, LWC only observes shallow changes—it checks if the reference itself changed. If you mutate the inside of an object or array, the memory address stays the same, so LWC does not detect the change.

```javascript
// PROBLEM:
user = { name: 'Alex', age: 25 };

updateAge() {
    this.user.age = 26; // UI WILL NOT update! (Same object reference)
}

```

#### How to Solve This:

* **Modern Best Practice (Immutability):** Create a new copy using the spread operator (`...`). This creates a new memory reference without needing extra decorators.
```javascript
this.user = { ...this.user, age: 26 }; // UI re-renders!
this.items = [...this.items, 'New Item']; // Array push replacement

```


* **Alternative (`@track`):** Tells LWC to perform deep observation on nested properties.
```javascript
import { LightningElement, track } from 'lwc';

export default class UserCard extends LightningElement {
    @track user = { name: 'Alex', age: 25 };

    updateAge() {
        this.user.age = 26; // UI re-renders because of @track
    }
}

```



---

### 3. Key LWC Decorators & Features

| Feature | What It Does | Beginner Use Case |
| --- | --- | --- |
| **Class Field** (Default) | Private property; shallow-reactive by default. | Storing modal open/close states, input values. |
| **`@api`** | Public property; exposes the field to parent components or Flow. | Passing `recordId` from a Lightning record page. |
| **`@track`** | Deep reactivity for mutations inside objects/arrays. | Modifying array elements in place. |
| **`@wire`** | Reactive connection to Salesforce data (Apex or LDS). | Fetching contact info using a record ID automatically. |
| **Getters (`get ...`)** | Computed properties that recalculate when dependent fields change. | Transforming raw data (e.g., combining first and last name). |

---

### 4. Critical Limitations & Common Pitfalls

* **Mutating `@wire` Data Directly:** Data returned from `@wire` adapters is immutable (read-only). Attempting `this.wiredData.Name = 'New'` will throw a runtime error. You must shallow-clone it first:
```javascript
this.editableData = { ...this.wiredData };

```


* **Mutating `@api` Values Internally:** Child components should never overwrite a property passed down via `@api`. Treat `@api` properties as read-only inputs; send an event (`dispatchEvent`) back to the parent if a change is needed.
* **No Logic in HTML Templates:** LWC does not allow inline JavaScript expressions in HTML (e.g., `{items.length > 0}` or `{total * 1.1}` will fail). Always compute values in a JavaScript getter:
```javascript
get hasItems() {
    return this.items && this.items.length > 0;
}

```


* **Unsupported Reactive Types:** Complex objects such as `Map`, `Set`, and `Date` instances are not deeply observed by `@track`. Stick to plain objects `{}` and arrays `[]` for UI-bound state.

---

### 5. Pro Tips for Beginners

* **Prefer the spread operator over `@track`:** Treating data as immutable (`[...list]` or `{...obj}`) avoids the overhead of deep proxy observers and prevents subtle state bugs.
* **Make wire adapters reactive with `$prefix`:** In `@wire(getContact, { recordId: '$recordId' })`, the `$` makes the parameter dynamic. If `recordId` changes, the wire automatically re-executes.
* **Watch your casing in HTML:** JavaScript uses camelCase (`contactName`), but HTML attributes use kebab-case (`contact-name`).