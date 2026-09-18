# Why We use this.status as this_status convenstion?

The underscore prefix (`_status`) is a standard JavaScript convention used to store the **backing field** (private storage) when defining a `getter` and `setter` with the same name (`status`).

Without that backing field, you create an **infinite recursion crash**.

---

### The Infinite Recursion Trap

In JavaScript, when you define a getter or setter named `status`, referencing `this.status` inside either method invokes the method itself instead of accessing raw data:

```javascript
// ❌ BROKEN: Causes Maximum call stack size exceeded
export default class BadExample extends LightningElement {
    @api
    get status() {
        return this.status; // 💥 Calls get status() again -> infinite loop
    }
    set status(value) {
        this.status = value; // 💥 Calls set status() again -> infinite loop
    }
}

```

By adding an underscore (`_status`), you give the internal variable a separate name:

```javascript
// ✅ CORRECT: Stores value in a separate private property
export default class GoodExample extends LightningElement {
    _status; // Backing variable

    @api
    get status() {
        return this._status; // Reads the private variable
    }
    set status(value) {
        this._status = value; // Writes to the private variable
    }
}

```

---

### Key Rules When Building Custom Components

* **Underscore is a Convention, Not Syntax:** In standard JavaScript, `_status` is not truly private; it is simply a signal to other developers that the property is meant for internal use.
* **Avoid True Private Fields (`#field`) with Public Decorators:** Modern JavaScript supports `#privateField`, but LWC compiler quirks and testing tools historically handle backing fields better when using standard underscores (`_fieldName`) rather than `#fieldName` alongside `@api` getters/setters.
* **Decorate Only the Getter:** In LWC, apply `@api` (or `@wire`, `@track`) **only to the `get` method**, never to the `set` method or the backing variable:
```javascript
_status; // No decorator

@api // Decorate only the getter
get status() {
    return this._status;
}
set status(value) { // Do not add @api here
    this._status = value;
}

```


* **HTML Templates Don't Care About the Underscore:** When reading the value in your template, reference the getter name (`{status}`), not the private field (`{_status}`):
```html
<p>Current Status: {status}</p>

```