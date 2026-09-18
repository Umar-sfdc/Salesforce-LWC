# LWC Modal `lightning/confirm` 

The **`lightning/confirm`** module displays an asynchronous, SLDS-styled confirmation dialog with **OK** and **Cancel** buttons. It acts as the modern, accessible replacement for the native browser `window.confirm()` method in Lightning Web Components.

---

### Core Syntax & Basic Usage

`LightningConfirm.open()` is a static method that displays an overlay modal and returns a **Promise** that resolves to a **Boolean**:

* Returns **`true`** if the user clicks **OK**.
* Returns **`false`** if the user clicks **Cancel**, presses the `Esc` key, or clicks the close `[X]` button.

```javascript
import { LightningElement, api } from 'lwc';
import LightningConfirm from 'lightning/confirm';

export default class ConfirmDemo extends LightningElement {
  @api recordId;

  async handleDelete() {
    const isConfirmed = await LightningConfirm.open({
      message: 'Are you sure you want to delete this record? This action cannot be undone.',
      label: 'Delete Confirmation', // Header text & ARIA label
      theme: 'error' // Styles the header (e.g., 'error', 'warning', 'info', 'success')
    });

    if (isConfirmed) {
      console.log('User clicked OK -> Execute delete logic');
      this.executeDeletion();
    } else {
      console.log('User cancelled -> Abort action');
    }
  }

  executeDeletion() {
    // Logic to delete record
  }
}

```

---

### Configuration Properties

Pass these parameters inside the configuration object to `LightningConfirm.open()`:

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `message` | String | **Yes** | — | The descriptive body text explaining what the user is confirming. |
| `label` | String | **Yes** | — | The modal title and accessible label (`aria-label`). |
| `theme` | String | No | `'default'` | Header theme: `'default'`, `'shade'`, `'inverse'`, `'alt-inverse'`, `'success'`, `'info'`, `'warning'`, `'error'`. |
| `variant` | String | No | `'standard'` | Variant type. Accepts `'headerless'` to omit the title banner. |

---

### Implementation Patterns

#### 1. Destructive Actions with Warning/Error Themes

For high-risk operations (such as data purges, record deletions, or role removals), apply `theme: 'error'` or `theme: 'warning'` to apply alert colors to the header:

```javascript
import { LightningElement } from 'lwc';
import LightningConfirm from 'lightning/confirm';

export default class ResetPasswordAction extends LightningElement {
  async handleResetAll() {
    const confirmed = await LightningConfirm.open({
      message: 'This will reset passwords for all selected users immediately.',
      label: 'Security Warning',
      theme: 'warning'
    });

    if (confirmed) {
      // Proceed with batch operation
    }
  }
}

```

#### 2. Headerless Confirmation

When you want a compact, straightforward confirmation box without a title bar:

```javascript
const result = await LightningConfirm.open({
  message: 'Discard unsaved changes?',
  label: 'Discard Changes Confirmation', // Still required for screen readers (aria-label)
  variant: 'headerless'
});

if (result) {
  this.revertChanges();
}

```

---

### Comparison: `window.confirm()` vs. `LightningConfirm`

| Feature | `LightningConfirm.open()` | Native `window.confirm()` |
| --- | --- | --- |
| **Execution Model** | **Asynchronous**: Resolves a Promise without freezing browser threads. | **Synchronous**: Freezes all JavaScript execution and UI rendering across the browser. |
| **Styling** | Built with standard **Salesforce Lightning Design System (SLDS)**. | Browser-dependent generic OS dialog box. |
| **Mobile & Console** | Fully responsive in Salesforce Mobile App and Lightning Console workspaces. | Can fail, freeze, or get blocked by pop-up blockers in mobile and iframe wrappers. |
| **Accessibility** | Native focus trapping, keyboard navigation, and ARIA roles built-in. | Bare-bones browser OS accessibility. |

---

### Developer Tips & Limitations

* **Non-Blocking Execution:**
Because `LightningConfirm.open()` returns a Promise, always use `await` inside an `async` function (or use `.then()`). Placing operational code immediately after without `await` will run before the user clicks either button.
* **Static Button Labels:**
You cannot customize the button text (e.g., you cannot change "OK" to "Delete" or "Cancel" to "Keep"). The buttons are strictly fixed to **OK** and **Cancel**. If your UX requires custom action buttons (e.g., "Save Draft", "Discard", "Continue Editing"), build a custom modal using **`lightning/modal`** instead.
* **Plain Text Only:**
The `message` property only accepts a raw string. HTML tags, clickable links, or icons inside the body area are not parsed or rendered.