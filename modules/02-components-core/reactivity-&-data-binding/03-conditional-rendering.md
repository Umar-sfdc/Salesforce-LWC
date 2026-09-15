# LWC - Conditional Rendering

**Conditional rendering** in LWC determines what appears in the DOM based on JavaScript properties or getters. When an element fails a condition, LWC removes it from the DOM entirely—it doesn't merely hide it with CSS.

---

### 1. The Modern Directives: `lwc:if`, `lwc:elseif`, and `lwc:else`

Modern LWC uses `lwc:if`, `lwc:elseif`, and `lwc:else`. They operate like standard `if / else if / else` statements and can be attached to HTML elements or non-rendering `<template>` tags.

#### Key Syntax Rules:

* **Sibling requirement:** `lwc:elseif` and `lwc:else` must immediately follow an `lwc:if` or `lwc:elseif` at the same DOM level without intervening elements.
* **No inline logic:** The directive expression must bind directly to a property or getter name (e.g., `lwc:if={isReady}`, **not** `lwc:if={count > 0}`).

#### Complete Example: Status Banner

**HTML (`statusCard.html`):**

```html
<template>
    <div class="card">
        <!-- Branch 1: Completed -->
        <p lwc:if={isSuccess} class="success">
            Operation successful!
        </p>

        <!-- Branch 2: In Progress -->
        <p lwc:elseif={isLoading} class="warning">
            Loading data, please wait...
        </p>

        <!-- Branch 3: Default/Fallback -->
        <p lwc:else class="error">
            An error occurred: {errorMessage}
        </p>
    </div>
</template>

```

**JavaScript (`statusCard.js`):**

```javascript
import { LightningElement } from 'lwc';

export default class StatusCard extends LightningElement {
    status = 'loading'; // 'loading', 'success', or 'error'
    errorMessage = 'Failed to fetch server response.';

    get isSuccess() {
        return this.status === 'success';
    }

    get isLoading() {
        return this.status === 'loading';
    }
}

```

---

### 2. Element Level vs. `<template>` Tag

You can apply directives directly to an element or wrap multiple elements inside a structural `<template>` tag.

* **On a regular tag:** The tag itself is added or removed from the DOM.
```html
<button lwc:if={canEdit} onclick={handleEdit}>Edit</button>

```


* **On a `<template>` wrapper:** Groups multiple elements without creating an extra `<div>` or wrapper element in the final rendered DOM.
```html
<template lwc:if={isLoggedIn}>
    <h2>Welcome Back!</h2>
    <p>Here is your dashboard summary.</p>
</template>

```



---

### 3. Modern vs. Legacy Directives

You will often encounter older codebases using legacy conditional syntax.

| Feature | Modern (`lwc:if`, `lwc:elseif`, `lwc:else`) | Legacy (`if:true`, `if:false`) |
| --- | --- | --- |
| **Else / Else-if support** | Yes, full branching | No (requires mutually exclusive getters) |
| **Performance** | Faster DOM updates | Slower evaluation |
| **Status** | Recommended standard | Supported for backward compatibility |

**Legacy Pattern Example:**

```html
<!-- LEGACY: verbose, required multiple getters for negation -->
<template if:true={isReady}>
    <p>Ready!</p>
</template>
<template if:false={isReady}>
    <p>Not ready...</p>
</template>

```

---

### 4. Critical Rules & Common Pitfalls

* **Falsy Values:** JavaScript values like `false`, `null`, `undefined`, `0`, `""` (empty string), and `NaN` all evaluate to falsy. An empty array `[]` or empty object `{}` evaluates to **truthy**. To check for an empty array, always use a getter:
```javascript
get hasItems() {
    return this.items && this.items.length > 0;
}

```


* **DOM Destruction vs. CSS Hiding:**
* `lwc:if={false}` completely unmounts the element from the DOM. Any internal component state or unsubmitted input form data inside that block is lost.
* If you need to preserve state or inputs between toggles, use the standard SLDS utility class `slds-hide` instead:
```html
<div class={dropdownClass}>
    <!-- Stays in DOM, state preserved -->
</div>

```


```javascript
get dropdownClass() {
    return this.isOpen ? 'slds-show' : 'slds-hide';
}

```




* **No Sibling Interruptions:** Putting any element (even an empty comment or `<hr>`) between `lwc:if` and `lwc:else` breaks template compilation.