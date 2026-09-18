# JavaScript Modules import/export

JavaScript modules allow you to break large programs into smaller, reusable files. Instead of writing everything in a single script where global variables collide, each file has its own **isolated scope**. Variables or functions only become accessible elsewhere if you explicitly **export** them and **import** them where needed.

---

### 1. The Two Core Export Styles: Named vs. Default

Every standard ES module (`ESM`) handles exports through two main mechanisms:

#### Named Exports (Export Multiple Things)

Use named exports when a file provides a collection of utility functions, constants, or classes.

```javascript
// utils.js
export const PI = 3.14159;

export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

```

To import named exports, wrap the exact names in curly braces `{}`:

```javascript
// main.js
import { add, PI } from './utils.js';

console.log(add(5, 10)); // 15
console.log(PI);          // 3.14159

```

#### Default Exports (Export One Main Thing)

Use a default export when a file has one primary purpose, such as a class, a component, or a single main function.

```javascript
// User.js
export default class User {
  constructor(name) {
    this.name = name;
  }
}

```

When importing a default export, **do not** use curly braces. You can also name the imported entity whatever you like:

```javascript
// main.js
import User from './User.js';
// Or even: import Person from './User.js';

const dev = new User('Alex');

```

---

### 2. The 5 Common Ways to Import Modules

#### 1. Direct Named Import

Import only what you need to keep your namespace clean:

```javascript
import { add, subtract } from './math.js';

```

#### 2. Renaming with `as` (Aliasing)

Avoid name collisions between different files:

```javascript
import { render as renderChart } from './chart.js';
import { render as renderTable } from './table.js';

```

#### 3. Namespace Import (Import Everything)

Bundle all exports into a single container object:

```javascript
import * as MathUtils from './math.js';

console.log(MathUtils.add(2, 3));
console.log(MathUtils.PI);

```

#### 4. Mixed Import (Default + Named)

Import both the default export and named helpers together:

```javascript
import React, { useState, useEffect } from 'react';

```

#### 5. Dynamic Import (On-Demand Loading)

Standard imports are **static** and load immediately at file startup. Dynamic `import()` is a function that returns a Promise, allowing you to load code conditionally or on user interaction:

```javascript
button.addEventListener('click', async () => {
  const module = await import('./heavyLibrary.js');
  module.runAnalytics();
});

```

---

### 3. Running ES Modules in the Browser vs. Node.js

Modules do not run like legacy JavaScript scripts by default.

#### In the Browser (HTML)

Add `type="module"` to your `<script>` tag. Without this attribute, `import` and `export` will throw a syntax error:

```html
<!-- index.html -->
<script type="module" src="./main.js"></script>

```

Key browser behaviors with `type="module"`:

* **Deferred execution:** Modules automatically behave as if they have `defer` enabled (they run after HTML parsing completes).
* **Strict mode:** Modules execute in strict mode (`'use strict'`) automatically.
* **No global leakage:** Variables declared with `const` or `let` at the top level do not attach to `window`.

#### In Node.js

Node historically used CommonJS (`require` / `module.exports`). To enable ES module syntax in Node:

1. Add `"type": "module"` inside your project's `package.json`.
2. Or use the `.mjs` file extension (e.g., `server.mjs`).

---

### 4. ESM vs. CommonJS (The Legacy System)

You will frequently encounter older Node.js code using CommonJS:

| Feature | ES Modules (`ESM`) | CommonJS (`CJS`) |
| --- | --- | --- |
| **Syntax** | `import` / `export` | `require()` / `module.exports` |
| **Parsing** | Static (analyzed before code runs) | Dynamic (executed synchronously at runtime) |
| **Platform** | Modern browsers & Node.js | Older Node.js legacy code |
| **Tree-shaking** | Fully supported | Difficult or unsupported |
| **Environment** | Strict mode by default | Standard mode by default |

---

### 5. Practical Tips for Beginners

* **Always include file extensions locally:** When testing native modules in browsers without bundlers (like Vite or Webpack), relative paths must include the extension:
```javascript
// Correct in native browsers:
import { setup } from './setup.js';

// Fails in native browsers (works only in bundlers):
import { setup } from './setup';

```


* **Use Named Exports for toolkits, Default for single structures:** If a file exports multiple helpers, stick to named exports. It makes refactoring and searching codebases easier because the names stay consistent across files.
* **Leverage Tree-Shaking:** Modern build tools can drop unused functions from your final download bundle only if you use static `import` and `export`.

---

### 6. Limitations & Gotchas

* **CORS Restrictions on Local Files:** Browsers block `type="module"` when opening HTML files via `file:///C:/...` due to Cross-Origin Resource Sharing (CORS) security policies. You must run a local development server (such as VS Code's *Live Server* extension or `npx serve`).
* **Static Imports Cannot Be Nested:** You cannot put top-level `import` statements inside `if` statements, loops, or functions:
```javascript
// SyntaxError!
if (isLoggedIn) {
  import { dashboard } from './dashboard.js';
}

```


*(Use dynamic `await import('./dashboard.js')` inside async functions if you need conditional loading.)*
* **Live Bindings Are Read-Only:** When you import a variable, the consumer cannot reassign it:
```javascript
import { count } from './counter.js';
count = 10; // TypeError: Assignment to constant variable / invalid assignment

```


The module that defined `count` can mutate it internally, and the imported value will update automatically (known as a **live binding**), but external modules cannot overwrite it directly.