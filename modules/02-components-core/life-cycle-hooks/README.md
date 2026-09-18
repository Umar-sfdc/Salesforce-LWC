# Salesforc LWC - Life Cycle Hooks

Lightning Web Component (LWC) lifecycle hooks follow standard Web Components Custom Elements specifications, tailored with Salesforce-specific reactive triggers and execution boundaries.


Learn in-depth : [Click Here](./in-depth.md)

---

### Core Lifecycle Flow

The execution phase alternates between **parent-first (downward)** and **child-first (upward)** passes through the component tree:

```
[Mounting Phase]
Parent constructor()
└── Child constructor()
└── Child connectedCallback()
Parent connectedCallback()
└── Child renderedCallback()
Parent renderedCallback()

[Unmounting Phase]
Parent disconnectedCallback()
└── Child disconnectedCallback()

```

---

### Phase Breakdown

**1. `constructor()**`

* **Trigger:** Component instance is created.
* **What to do:** Initialize non-reactive private fields, set defaults.
* **Key constraints:**
* Must call `super()` first.
* Do **not** inspect or mutate child elements or public properties (`@api`) passed from parents—they are not yet assigned.
* Do **not** access attributes or the DOM (`this.template.querySelector` returns `null`).
* You can inspect attributes defined statically on host elements, but avoid dispatching events.



**2. `connectedCallback()**`

* **Trigger:** Component is inserted into the DOM.
* **What to do:** Establish subscriptions (LMS/MessageChannel, Pub/Sub, platform events), register window-level event listeners, fetch initialization data via imperative Apex.
* **Key constraints:**
* `@api` properties are available and populated.
* DOM elements in child templates are **not** yet guaranteed to be rendered.
* Can fire multiple times if the element is removed and re-inserted (e.g., inside conditional `if:true` / `lwc:if` blocks or dynamic tabs). Always pair setup logic with teardown logic.



**3. `renderedCallback()**`

* **Trigger:** Executes after every DOM render cycle (initial render and reactive state updates).
* **What to do:** Perform third-party library initializations (D3, Chart.js) or DOM-dependent layout calculations (`getBoundingClientRect()`).
* **Key constraints:**
* Executes **frequently**. Mutating reactive properties (`@track` or fields referenced in the template) inside `renderedCallback()` without guard conditions triggers an **infinite render loop**.



```javascript
// Safe execution pattern in renderedCallback
hasRendered = false;

renderedCallback() {
    if (this.hasRendered) return;
    this.hasRendered = true;

    const canvas = this.template.querySelector('canvas');
    if (canvas) {
        this.initializeThirdPartyLibrary(canvas);
    }
}

```

**4. `disconnectedCallback()**`

* **Trigger:** Component is removed from the DOM.
* **What to do:** Teardown memory leaks—unsubscribe from Lightning Message Service (`unsubscribe()`), detach window listeners (`window.removeEventListener`), clear intervals and timeouts (`clearInterval()`).

**5. `errorCallback(error, stack)**`

* **Trigger:** Captures errors bubbling up from any child component's lifecycle hooks or render phase (similar to React's Error Boundaries).
* **What to do:** Log stack traces to server logs or set an error boundary UI state to avoid breaking the entire page canvas.

---

### Critical Limitations & Gotchas

* **Locker Service / LWS DOM Isolation:** Even inside `renderedCallback()`, direct DOM manipulation is restricted. You cannot access elements outside your component's shadow tree via `document.querySelector()`.
* **Async Wire Adapter Timing:** `@wire` functions/properties execute asynchronously. They do **not** run in sync with `connectedCallback()`. A `@wire` result may resolve before or after `connectedCallback()` runs, so never assume wired data is populated on mount.
* **No `beforeDestroy` Equivalent:** `disconnectedCallback()` is pure post-destruction. The component is already stripped from the DOM when it executes; you cannot intercept removal or run pre-unmount validation.
* **Parent-Child Timing Asymmetry:** `connectedCallback()` runs leaf-first for siblings, but parent `connectedCallback()` executes after child `connectedCallback()`. Conversely, `renderedCallback()` finishes upward from children to parent.


