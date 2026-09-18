# Event Bubbles & Composition 
Event bubbling and composition define how an event travels through the DOM tree—specifically when crossing **Shadow DOM boundaries** in Lightning Web Components.

Understanding the interaction between the `bubbles` and `composed` flags is essential for building encapsulated, scalable component hierarchies without unintended side effects.

---

### The Two Mechanics Defined

* **Bubbling (`bubbles`):** Controls whether an event moves **vertically upward** through ancestor nodes within the same DOM tree after firing on the target node.
* **Composition (`composed`):** Controls whether an event can **cross the Shadow Root boundary** out of the component’s private Shadow DOM and into the outer light/shadow DOM of parent components.

---

### The Three Valid Configurations

While two boolean flags yield four mathematical combinations, only three are valid in LWC.

| Configuration | Traverses Up Same Template? | Crosses Shadow Boundary? | Scope of Reach |
| --- | --- | --- | --- |
| `{ bubbles: false, composed: false }` | ❌ No | ❌ No | Dispatched element + direct parent template listener |
| `{ bubbles: true, composed: false }` | ✅ Yes | ❌ No | All ancestors inside the **same template only** |
| `{ bubbles: true, composed: true }` | ✅ Yes | ✅ Yes | Bubbles up through **all ancestors & boundaries** to `window` |

> **Invalid Configuration:** `{ bubbles: false, composed: true }` is an anti-pattern. An event cannot cross into an outer boundary if it cannot bubble upward in the first place.

---

### Deep Dive: How Each Configuration Behaves

```
[ Grandparent DOM ]
      └── <c-parent> (Shadow Boundary)
               └── <c-child> (Shadow Boundary)
                        └── <div class="wrapper">
                                 └── <button> (Dispatched here)

```

#### 1. Default: `{ bubbles: false, composed: false }`

The event fires on `<button>` and does not bubble up inside `<c-child>`. However, LWC allows the direct parent host (`<c-parent>`) to capture it via a declarative template binding:

```html
<!-- c-parent template -->
<c-child oncustomevent={handleCustomEvent}></c-child>

```

* **Use Case:** 90%+ of all LWC component communication.
* **Why:** Enforces encapsulation. `<c-parent>` interacts only with `<c-child>`'s exposed surface, and grandparents cannot intercept internal transactions.

#### 2. Internal Bubbling: `{ bubbles: true, composed: false }`

The event bubbles up through `<div class="wrapper">` and reaches the root of `<c-child>`, but **stops dead at the shadow boundary**. It never leaks into `<c-parent>`.

```javascript
// Inside a sub-element within c-child:
this.dispatchEvent(new CustomEvent('internalstepchange', {
    bubbles: true,
    composed: false,
    detail: { step: 2 }
}));

```

```javascript
// In c-child root JS (connectedCallback):
this.template.addEventListener('internalstepchange', this.handleStep);

```

* **Use Case:** Compound components (e.g., a custom data table, accordion, or tabset containing multiple nested internal child elements where the parent wrapper needs to aggregate actions without exposing them to the consumer).

#### 3. Cross-Boundary Bubbling: `{ bubbles: true, composed: true }`

The event bubbles up inside `<c-child>`, punches through its shadow boundary into `<c-parent>`, punches through `<c-parent>`'s boundary into `<c-grandparent>`, and continues all the way up to `document` and `window` unless stopped.

```javascript
// Dispatched deep inside c-child
this.dispatchEvent(new CustomEvent('globalnotification', {
    bubbles: true,
    composed: true,
    detail: { message: 'Session expired' }
}));

```

```javascript
// In Grandparent JS:
connectedCallback() {
    this.template.addEventListener('globalnotification', this.handleNotification);
}

```

* **Use Case:** Global signals (e.g., closing open dropdowns on outside click, telemetry tracking, or notifications that an ancestor layout container must handle).

---

### Event Retargeting (Preserving Encapsulation)

When an event uses `composed: true` and crosses a shadow boundary, the browser applies **event retargeting**.

To prevent outer components from inspecting private internal DOM structures, the browser rewrites `event.target` to match the host element of the shadow root it just crossed.

```
Dispatched at:    <button> inside <c-child>
Inside c-child:   event.target === <button>
Inside c-parent:  event.target === <c-child>
Inside Grandparent: event.target === <c-child> (or <c-parent> if crossing another boundary)

```

* **`event.target`:** The element that appears to have fired the event from the perspective of the current listener's scope.
* **`event.composedPath()`:** Returns an array of every node the event traversed, allowing debugging of the true origin across boundaries (subject to Shadow DOM security mode).

---

### Controlling Propagation: `stopPropagation()` vs `stopImmediatePropagation()`

* `event.stopPropagation()`: Prevents the event from traveling to the next ancestor element. Listeners attached to the **current element** still execute.
* `event.stopImmediatePropagation()`: Prevents the event from traveling to ancestors **and** stops any remaining listeners on the **current element** from firing.

```javascript
handleIntercept(event) {
    // Stops the event from reaching parent containers
    event.stopPropagation();
}

```

---

### Architectural Pitfalls

* **Leaking Implementation Details:** Overusing `{ bubbles: true, composed: true }` violates Web Component standards. If a grandparent relies on an event emitted 3 layers deep, replacing an intermediate component can silently break the entire application.
* **Memory Leaks on Imperative Ancestor Listeners:** When listening for composed bubbling events imperatively via `addEventListener()` on `window`, `document`, or container elements, you **must** clean them up:
```javascript
disconnectedCallback() {
    window.removeEventListener('globalnotification', this.boundHandler);
}

```


* **Performance Degradation:** Deeply nested trees evaluating bubbling events through dozens of DOM layers add micro-delays to the browser event loop. For distant or cross-tree messaging, prefer **Lightning Message Service (LMS)** over composed events.    