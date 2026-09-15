# Salesforce Private Property

In Lightning Web Components, every class property is **private by default** and **reactive for primitive values**.

Understanding private reactivity centers on one key concept: **LWC's track-by-reference observation engine**.

---

### 1. Primitives: Automatic Reactivity (No Decorator Needed)

When a property holds a primitive value (`String`, `Number`, `Boolean`, `null`, `undefined`, `Symbol`), LWC observes it automatically. Any reassignment triggers an asynchronous microtask re-render.

```javascript
import { LightningElement } from 'lwc';

export default class Counter extends LightningElement {
    // Private and reactive automatically
    count = 0;
    message = 'Ready';

    handleIncrement() {
        // Reassignment triggers DOM re-render
        this.count += 1;
        this.message = 'Updated!';
    }
}

```

```html
<template>
    <p>{message} (Count: {count})</p>
    <lightning-button label="Add" onclick={handleIncrement}></lightning-button>
</template>

```

---

### 2. Complex Objects & Arrays: The Reference Trap

Reactivity breaks down when dealing with mutation vs. reassignment in reference types (`Object`, `Array`).

#### The Problem: In-Place Mutation

LWC's shallow dirty-checking checks if the **memory reference** changed (`===`). If you mutate a nested property or push to an array, the memory pointer stays identical, and the UI will **not** re-render:

```javascript
export default class Profile extends LightningElement {
    user = { name: 'Alex', role: 'Dev' };
    tags = ['salesforce'];

    updateBad() {
        this.user.name = 'Jordan'; // ❌ Same object reference; template will NOT update
        this.tags.push('apex');     // ❌ Same array reference; template will NOT update
    }
}

```

You have two ways to solve this: **Shallow Copying (Modern Standard)** or **`@track` (Deep Observation)**.

---

### 3. Solution A: Immutability / Shallow Copies (Best Practice)

Instead of mutating the existing reference, replace it with a new one using the spread operator (`...`). This keeps data predictable and avoids deep proxy overhead:

```javascript
export default class Profile extends LightningElement {
    user = { name: 'Alex', role: 'Dev' };
    tags = ['salesforce'];

    updateGood() {
        // ✅ New object reference triggers re-render
        this.user = { ...this.user, name: 'Jordan' };

        // ✅ New array reference triggers re-render
        this.tags = [...this.tags, 'apex'];
    }
}

```

---

### 4. Solution B: The `@track` Decorator (Deep Reactivity)

Use `@track` when you genuinely need to mutate nested object properties or call in-place array methods (`.push()`, `.splice()`) and want the engine to intercept the change.

```javascript
import { LightningElement, track } from 'lwc';

export default class TrackedProfile extends LightningElement {
    @track user = { name: 'Alex', role: 'Dev' };
    @track tags = ['salesforce'];

    updateWithTrack() {
        // ✅ Re-renders because @track wraps this.user in a Proxy
        this.user.name = 'Jordan';

        // ✅ Re-renders because Proxy intercepts array mutation methods
        this.tags.push('apex');
    }
}

```

#### Under the Hood: How `@track` Works

`@track` wraps the target object and any nested objects accessed during execution in an ES6 **`Proxy`**. When a property setter inside the Proxy is triggered, the Proxy notifies the LWC rendering engine's dirty-check pipeline.

---

### Summary: When to Use What

| Data Type | Operation | Decorator Needed? |
| --- | --- | --- |
| **Primitives** (`String`, `Number`, etc.) | Any update (`this.val = 5`) | **None** (automatic) |
| **Objects / Arrays** | Replaced with new reference (`{ ...obj }`, `[ ...arr ]`) | **None** (automatic) |
| **Objects / Arrays** | Mutated in place (`obj.x = 1`, `arr.push()`) | **`@track`** |
| **Non-UI State** (timers, flags, guards) | Internal logic only, not used in template | **None** (plain private fields) |

---

### Limitations & Gotchas

* **Unused Properties Won't Trigger Renders:** If a private reactive variable changes, but neither the HTML template nor a template getter references it, the LWC engine will **not** schedule a DOM update.
* **Logging Tracked Objects Shows `Proxy`:** Inspecting `@track` variables via `console.log(this.user)` in DevTools outputs a complex `Proxy` wrapper. To view the raw payload cleanly, serialize it first:
```javascript
console.log(JSON.parse(JSON.stringify(this.user)));

```


* **Performance Overhead:** Overusing `@track` on massive nested JSON structures creates numerous Proxy layers. Prefer passing sanitized flat structures or using shallow spreads (`{ ...data }`).