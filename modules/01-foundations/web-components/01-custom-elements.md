# JavaScript Custom Elements

**Custom Elements** allow you to invent your own HTML tags (like `<user-card>` or `<nav-menu>`) that encapsulate their own styles, structure, and behavior. They are a core pillar of the **Web Components** standard.

For more Information or Examples : [Web Components Github](https://github.com/mdn/web-components-examples)

---

To build one, you create a class that inherits from `HTMLElement` and register it with `customElements.define()`:

```javascript
// 1. Define the component's logic and structure
class ProfileBadge extends HTMLElement {
  connectedCallback() {
    // Runs when the element is inserted into the DOM
    const username = this.getAttribute('name') || 'Guest';
    this.innerHTML = `
      <div style="border: 1px solid #ccc; padding: 10px; border-radius: 6px; width: 160px;">
        <strong>User:</strong> ${username}
      </div>
    `;
  }
}

// 2. Register the tag (custom names MUST contain a hyphen)
customElements.define('profile-badge', ProfileBadge);

```

You can then use it in your HTML just like a native tag:

```html
<profile-badge name="Alice"></profile-badge>

```

#### Key Lifecycle Hooks

* `connectedCallback()`: Fires when the element is added to the page. Best place for rendering and setting up event listeners.
* `disconnectedCallback()`: Fires when removed from the page. Use this to remove listeners or clean up timers.
* `attributeChangedCallback(name, oldValue, newValue)`: Runs whenever an observed attribute changes (requires a static `observedAttributes` getter).

#### Related Concepts: The Web Components Trio

1. **Custom Elements:** Defines the tag and its JavaScript lifecycle.
2. **Shadow DOM:** Keeps styles and markup private so outside CSS won't leak in or out (`this.attachShadow({ mode: 'open' })`).
3. **HTML Templates (`<template>` & `<slot>`):** Lets you write reusable markup skeletons and placeholders that aren't rendered until activated.

---

### JavaScript Modules (ESM)

Modules let you split code across multiple files so everything isn't dumped into one giant global script. In modern JavaScript (ES Modules), there are two primary ways to share and consume code:

#### 1. Static Import/Export (Standard)

Files load and link before the rest of the code executes.

* **Named Exports:** Export multiple functions, objects, or variables by name.
```javascript
// mathUtils.js
export const add = (a, b) => a + b;
export const PI = 3.14159;

// app.js
import { add, PI } from './mathUtils.js';

```



**Default Export:** One primary item per file.

```javascript
  // logger.js
  export default function log(msg) {
    console.log(`[LOG]: ${msg}`);
  }

  // app.js
  import log from './logger.js'; // Can name it anything upon import

```

#### 2. Dynamic Import (`import()`)

Loads code asynchronously on-demand when an event occurs, which helps reduce initial page load time.

```javascript
// Loads only when the user clicks the button
button.addEventListener('click', async () => {
  const { calculateStats } = await import('./heavyAnalytics.js');
  calculateStats();
});

```

To load modules in HTML, add `type="module"` to your script tag:

```html
<script type="module" src="app.js"></script>

```

---

### Tips for Working with Modules

* **Always specify file extensions:** When importing local files in standard browser ESM, write `./utils.js`, not `./utils`.
* **Organize exports with a barrel file:** Use an `index.js` inside a folder to re-export utilities (`export * from './helpers.js'`), letting other files import from a single clean path.
* **Top-level `await` is supported:** Inside a module, you can write `const res = await fetch(...)` directly without wrapping it in an `async` function.
* **Modules run in `strict mode` automatically:** You don't need to write `"use strict";` at the top of ESM files.

---

### Limitations of Modules

* **Requires a local server:** Browsers block ES module imports on `file:///` URLs due to CORS security rules. You must run a local development server (such as the VS Code Live Server extension, Vite, or `npx serve`).
* **Circular dependencies:** If File A imports File B, and File B imports File A, values can resolve to `undefined` before they initialize, creating tricky bugs.
* **No global scoping by default:** Variables declared inside a module are private to that file. If you type a variable name in the browser console, it will not exist globally unless explicitly attached to `window`.
* **Network overhead:** In production, dozens of unbundled, small module files can trigger many individual HTTP requests; a build tool (like Vite or Rollup) is typically used to bundle them together.