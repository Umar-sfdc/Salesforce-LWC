# LWC For each & Iterations
In LWC, rendering a collection of data in HTML comes down to two directives: **`for:each`** and **`iterator`**.

Both require a **`key`** attribute on the first immediate child element inside the loop. The `key` must be a unique primitive (typically a Salesforce Record ID or an index), which allows the virtual DOM engine to update, reorder, or delete elements efficiently without redrawing the entire list.

---

### 1. `for:each` (Standard Looping)

`for:each` is the standard workhorse for 90% of list rendering scenarios.

#### Syntax Attributes:

* `for:each={arrayProperty}`: The array to iterate over.
* `for:item="currentItem"`: The alias for the current element in the loop.
* `for:index="index"` *(Optional)*: The zero-based index (`0, 1, 2, ...`).

#### Code Example:

**JavaScript (`contactList.js`):**

```javascript
import { LightningElement } from 'lwc';

export default class ContactList extends LightningElement {
    contacts = [
        { id: 'c1', name: 'Aarav Patel', role: 'Developer' },
        { id: 'c2', name: 'Neha Sharma', role: 'Architect' },
        { id: 'c3', name: 'Rohan Gupta', role: 'Admin' }
    ];
}

```

**HTML (`contactList.html`):**

```html
<template>
    <ul>
        <template for:each={contacts} for:item="contact" for:index="index">
            <!-- key must be on the first direct child tag -->
            <li key={contact.id}>
                #{index}: {contact.name} ({contact.role})
            </li>
        </template>
    </ul>
</template>

```

---

### 2. `iterator` (Positional Awareness)

Use `iterator` when your UI needs to treat the **first** or **last** element differently (e.g., adding special dividers, styling the top record as a hero banner, or omitting trailing commas).

#### Syntax:

* `iterator:iteratorName={arrayProperty}`

The iterator object exposes three properties per cycle:

* `iteratorName.value`: The actual data object.
* `iteratorName.first`: A boolean (`true` only for the first element).
* `iteratorName.last`: A boolean (`true` only for the last element).

#### Code Example:

**HTML (`styledList.html`):**

```html
<template>
    <div class="list-container">
        <template iterator:it={contacts}>
            <div key={it.value.id} class="item-row">
                
                <!-- Special UI for the first item -->
                <span lwc:if={it.first} class="badge-first">Lead: </span>

                <span>{it.value.name}</span>

                <!-- Add a separator line between items, except after the last one -->
                <hr lwc:if={!it.last} />
            </div>
        </template>
    </div>
</template>

```

*(Note: In template directives like `lwc:if`, you can directly negate booleans like `lwc:if={!it.last}`.)*

---

### 3. Comparison: When to Pick Which

| Feature | `for:each` | `iterator` |
| --- | --- | --- |
| **Primary Use** | Standard lists, tables, grid rows | Lists needing first/last styling or separators |
| **Access Item Data** | Direct alias (`contact.name`) | Via `.value` (`it.value.name`) |
| **Index Access** | Built-in via `for:index="idx"` | Not directly provided |
| **First/Last Checks** | Requires custom JS preprocessing | Built-in (`it.first`, `it.last`) |

---

### 4. Critical Rules & Gotchas

* **Where the `key` lives:** The `key` attribute goes on the **first direct child inside the `<template>` loop**, *never* on the `<template>` tag itself.
```html
<!-- WRONG -->
<template for:each={contacts} for:item="contact" key={contact.id}> ... </template>

<!-- CORRECT -->
<template for:each={contacts} for:item="contact">
    <div key={contact.id}> ... </div>
</template>

```


* **Never use array index as `key` if data mutates:** If items can be deleted, filtered, or reordered, do not use `key={index}`. The DOM engine uses the key to identify elements; changing an item's position with an index key causes form inputs and internal states to map to the wrong item. Use a unique property like `record.id`.
* **Array of Primitives Trap:** If you have an array of simple strings like `['Apple', 'Banana', 'Orange']`, there is no `id` property. In this read-only case, you can use the string value itself as the key (if unique) or preprocess the array in JS into an array of objects:
```javascript
// Preprocessing in JS
fruits = ['Apple', 'Banana', 'Orange'].map((item, index) => ({
    id: index,
    name: item
}));

```