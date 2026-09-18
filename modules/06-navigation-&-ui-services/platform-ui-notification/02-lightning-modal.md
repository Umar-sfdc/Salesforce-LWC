# LWC Modal

The **`lightning/prompt`** module provides an asynchronous, Promise-based modal dialog that captures a single text input from the user. It serves as the modern, accessible replacement for the native browser `window.prompt()` in Lightning Web Components, fully adhering to Salesforce Lightning Design System (SLDS) styling and accessibility standards.

---

### Core Syntax & Basic Usage

`LightningPrompt.open()` is a static method that displays the modal overlay and returns a **Promise**.

* If the user clicks **OK**, the Promise resolves with the **string value** entered into the input field.
* If the user clicks **Cancel** or closes the modal via the `Esc` key / header `[X]`, the Promise resolves to **`null`**.

```javascript
import { LightningElement } from 'lwc';
import LightningPrompt from 'lightning/prompt';

export default class PromptDemo extends LightningElement {
  async handleReasonPrompt() {
    const result = await LightningPrompt.open({
      message: 'Please enter a justification for closing this case:',
      label: 'Close Case Justification', // Header title & ARIA label
      defaultValue: 'Resolved via phone call', // Optional pre-filled value
      theme: 'default' // Optional: 'default', 'shade', 'inverse', 'alt-inverse', etc.
    });

    // Evaluate response
    if (result !== null) {
      console.log('User submitted input:', result);
      // Proceed with update logic using result
    } else {
      console.log('User cancelled the prompt');
    }
  }
}

```

---

### Configuration Properties

Pass these parameters inside the configuration object to `LightningPrompt.open()`:

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `message` | String | **Yes** | — | The instructional text displayed above the input field. |
| `label` | String | **Yes** | — | The modal header title and accessible label (`aria-label`). |
| `defaultValue` | String | No | `''` | Initial text pre-populated inside the text input. |
| `theme` | String | No | `'default'` | Visual style of the modal header (`default`, `shade`, `inverse`, `alt-inverse`, `success`, `info`, `warning`, `error`). |
| `variant` | String | No | `'standard'` | Display variant. Supports `'headerless'` to omit the top title bar. |

---

### Implementation Patterns

#### 1. Handling Validation on Input

Because `LightningPrompt` resolves immediately upon clicking **OK** (even if the field is left blank), handle empty submissions by checking for empty strings:

```javascript
import { LightningElement } from 'lwc';
import LightningPrompt from 'lightning/prompt';
import LightningAlert from 'lightning/alert';

export default class ValidatedPrompt extends LightningElement {
  async requestDiscountCode() {
    const code = await LightningPrompt.open({
      message: 'Enter approval code for discount override:',
      label: 'Manager Approval Required',
      theme: 'warning'
    });

    // Check if cancelled
    if (code === null) {
      return;
    }

    // Check if submitted empty
    if (!code.trim()) {
      await LightningAlert.open({
        message: 'Approval code cannot be blank.',
        label: 'Validation Error',
        theme: 'error'
      });
      return;
    }

    this.applyDiscount(code);
  }

  applyDiscount(code) {
    // Process business logic
  }
}

```

#### 2. Headerless Variant

If you want a minimal dialog focused strictly on the message and the input without a full modal title header:

```javascript
const userInput = await LightningPrompt.open({
  message: 'Quick note:',
  label: 'Quick Note Dialog', // Still mandatory for screen readers (aria-label)
  variant: 'headerless'
});

```

---

### Comparison: The Dialog Trio

Salesforce provides three companion modules under the same design architecture:

| Module | Resolves To | Use Case |
| --- | --- | --- |
| **`lightning/prompt`** | `String` (entered text) or `null` | Capturing quick, single-field user input. |
| **`lightning/alert`** | `Promise<void>` | Displaying acknowledgment messages (replaces `window.alert`). |
| **`lightning/confirm`** | `Boolean` (`true` on OK, `false` on Cancel) | Binary choices or destructive confirmations (replaces `window.confirm`). |

---

### Key Tips & Limitations

* **Single Line Text Only:**
`lightning/prompt` renders a standard, single-line text input (`<lightning-input type="text">`). It cannot be configured for multiline textareas, picklists, date pickers, or file uploads. For complex forms, use **`lightning/modal`** instead.
* **No Inline Input Masking or Regex Validation:**
You cannot configure properties like `pattern`, `minlength`, `type="password"`, or custom error messages directly on the generated input. Validation must happen downstream after the Promise resolves.
* **Promise Execution Halts Only the Async Function:**
Unlike native synchronous `window.prompt()`, `LightningPrompt.open()` **does not block the JavaScript thread**. Any non-`await`ed statements placed immediately after will execute before the user interacts with the dialog.
* **Accessibility Built-In:**
Focus trapping, `Escape` key listeners, and ARIA modal attributes are handled automatically by the base component, making it Section 508 and WCAG compliant out of the box.