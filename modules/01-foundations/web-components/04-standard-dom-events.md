# JavaScript Standard DOM Events

DOM events are signals sent by the browser to notify your code that something happened—such as a click, key press, input change, or page load. You interact with them using **event listeners**.

---

### The Event Propagation Pipeline

When an action occurs (like clicking a button), the event travels through three distinct phases:

```
Document
   │   ▲
   │ 1 │ 3
   ▼   │
<div>  │  [Phases: 1. Capturing, 2. Target, 3. Bubbling]
   │   ▲
   ▼   │
<button>  <── 2. Target Phase

```

1. **Capturing Phase (Trickling down):** The event travels down from `window` through the ancestor elements to the target.
2. **Target Phase:** The event arrives directly at the element that was interacted with.
3. **Bubbling Phase (Floating up):** The event travels back up the tree to `window`.

By default, listeners listen during the **Bubbling** phase because it is the most intuitive:

```javascript
const btn = document.querySelector('#btn');

btn.addEventListener('click', (event) => {
  console.log('Button clicked!');
});

```

---

### The Event Object: Key Properties & Methods

The callback receives an `event` (or `e`) object containing metadata about what occurred:

* `event.target`: The actual element that initiated the event (e.g., the exact icon or text clicked inside a button).
* `event.currentTarget`: The element the event listener is **attached to**.
* `event.preventDefault()`: Stops default browser behavior (e.g., stops a `<form>` from submitting and refreshing the page, or a link from navigating).
* `event.stopPropagation()`: Stops the event from bubbling up the DOM tree to parent elements.

```javascript
const form = document.querySelector('form');

form.addEventListener('submit', (e) => {
  e.preventDefault(); // Prevents page reload
  console.log('Form data captured via JS');
});

```

---

### Event Delegation: The Most Important Pattern

Instead of adding dozens of listeners to individual child elements (like list items or table rows), you attach **one listener to their common parent**. Thanks to event bubbling, clicks on any child bubble up to the parent.

```html
<ul id="task-list">
  <li>Buy milk <button class="delete-btn">×</button></li>
  <li>Walk dog <button class="delete-btn">×</button></li>
  <li>Write code <button class="delete-btn">×</button></li>
</ul>

```

```javascript
const list = document.querySelector('#task-list');

// One listener manages all present and future delete buttons
list.addEventListener('click', (e) => {
  if (e.target.matches('.delete-btn')) {
    const item = e.target.closest('li');
    item.remove();
  }
});

```

**Why this matters:**

* Saves memory (1 listener vs. 1,000 listeners).
* Automatically works for dynamically added items without needing to re-attach listeners.

---

### Common Event Categories

| Category | Common Events | Typical Use Case |
| --- | --- | --- |
| **Mouse** | `click`, `dblclick`, `mouseenter`, `mouseleave` | UI interactions, dropdown menus |
| **Keyboard** | `keydown`, `keyup` | Shortcuts, modal escapes (`e.key === 'Escape'`) |
| **Form** | `input`, `change`, `submit`, `focus`, `blur` | Real-time validation, form handling |
| **Document/Window** | `DOMContentLoaded`, `load`, `resize`, `scroll` | Lifecycle triggers, responsive layout hooks |

> **`input` vs. `change`:** `input` fires immediately on every keystroke in a text field. `change` fires only after the input loses focus (or when an option in a `<select>` dropdown is chosen).

---

### Cleaning Up: Memory Management

If you attach listeners to elements that you later remove, or inside custom element lifecycles, remove them to prevent memory leaks:

```javascript
function handleClick() {
  console.log('Clicked');
}

// Attach
button.addEventListener('click', handleClick);

// Detach (must reference the exact same function instance)
button.removeEventListener('click', handleClick);

```

> **Note:** Anonymous arrow functions (`() => {}`) cannot be removed using `removeEventListener` because they create a new, unreferenced function in memory.

---

### Events & Web Components: The Shadow DOM Border

When an event starts inside a Shadow DOM and bubbles out into the main document, the browser performs **event retargeting**:

* From the outside page's perspective, `event.target` is adjusted to point to the `<custom-element>` host tag itself, preventing outside scripts from inspecting internal private DOM structure.
* If you want a custom component to signal the outside page, dispatch a `CustomEvent`:

```javascript
// Inside your custom element
this.dispatchEvent(new CustomEvent('item-selected', {
  bubbles: true,
  composed: true, // composed: true allows the event to cross the Shadow DOM boundary
  detail: { itemId: 42 }
}));

```