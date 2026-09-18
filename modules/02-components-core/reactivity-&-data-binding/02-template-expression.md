# LWC - Template Expressions 

In Lightning Web Components (LWC), **template expressions** are how you bind JavaScript values, handle user actions, and control what appears in your HTML markup.

The single golden rule of LWC templates: **No inline JavaScript operations.** Unlike frameworks such as React, Angular, or Vue, you cannot write math, ternary operators, or function calls directly inside HTML curly braces `{ }`.

---

### 1. Basic Expression Syntax

Inside an HTML template, any identifier wrapped in single curly braces `{ }` binds to a property, getter, or method in your JavaScript file.

* **Property Binding:** Shows variable content.
* **Attribute Binding:** Dynamically sets HTML/component attributes.
* **Event Binding:** Connects actions (clicks, typing) to JavaScript methods without parentheses `()`.

```html
<template>
    <!-- Text binding -->
    <p>Welcome, {userName}!</p>

    <!-- Attribute binding (do NOT wrap in quotes) -->
    <input type="text" value={userName} disabled={isReadOnly} />

    <!-- Event binding -->
    <button onclick={handleClick}>Submit</button>
</template>

```

> **Syntax Tip:** In HTML, write `value={userName}`, **not** `value="{userName}"`. Wrapping the curly braces in quotes renders the literal string `"{userName}"` instead of evaluating the expression.

---

### 2. The Golden Rule: Use Getters for Logic

Because LWC prevents inline logic, whenever you need to compute, format, or evaluate a condition, write a JavaScript **getter** (`get propertyName()`).

| What You Might Try (Will Fail ❌) | How LWC Solves It (Use a Getter ✅) |
| --- | --- |
| `{firstName + ' ' + lastName}` | `get fullName() { return `${this.firstName}${this.lastName}`; }` |
| `{items.length > 0}` | `get hasItems() { return this.items?.length > 0; }` |
| `{price * 1.18}` | `get totalPrice() { return this.price * 1.18; }` |
| `{status === 'Active' ? 'green' : 'red'}` | `get badgeColor() { return this.status === 'Active' ? 'green' : 'red'; }` |

Getters are automatically re-evaluated whenever any reactive property used inside them changes.

---

### 3. Conditional Rendering: `lwc:if`, `lwc:elseif`, `lwc:else`

Modern LWC provides directives for branch logic directly on tags or non-rendering `<template>` tags:

```html
<template>
    <template lwc:if={isLoggedIn}>
        <p>Welcome back, user!</p>
    </template>
    <template lwc:elseif={isGuest}>
        <p>Browsing as a Guest.</p>
    </template>
    <template lwc:else>
        <p>Please log in to continue.</p>
    </template>
</template>

```

*(Note: In legacy LWC codebases, you will also see `if:true={condition}` and `if:false={condition}`. Modern code prefers `lwc:if` because it supports `elseif` and `else` chaining.)*

---

### 4. List Rendering: `for:each` vs `iterator`

When rendering lists or arrays of objects, you must assign a unique `key` attribute on the immediate child element. This helps the virtual DOM engine track which items changed, were added, or were removed.

#### Standard List: `for:each`

Best for standard looping:

```html
<template>
    <ul>
        <template for:each={contacts} for:item="contact">
            <li key={contact.id}>
                {contact.name} — {contact.email}
            </li>
        </template>
    </ul>
</template>

```

#### Special Conditions: `iterator`

Use `iterator` when you need to know if an item is the **first** or **last** element in the list:

```html
<template>
    <ul>
        <template iterator:it={contacts}>
            <li key={it.value.id}>
                <!-- it.first and it.last return booleans -->
                <span lwc:if={it.first}>⭐️ Featured: </span>
                {it.value.name}
            </li>
        </template>
    </ul>
</template>

```

---

### 5. Common Limitations & Beginner Traps

* **No Method Calls with Parameters:** You cannot write `{calculateDiscount(item.id)}`. Instead, prepare formatted data in JavaScript before rendering, or build a child component that calculates its own view state.
* **No Array Indexing in HTML:** `{contacts[0].name}` is illegal. Expose a getter like `get firstContactName()` in JavaScript.
* **Missing Keys in Loops:** Forgetting `key={...}` on the first direct child tag inside a loop causes build errors or erratic rendering behavior.
* **Case Sensitivity:** HTML attribute properties that use camelCase in JavaScript must use kebab-case in templates (e.g., a JS property `@api recordId` maps to `record-id="..."` when used as an attribute).