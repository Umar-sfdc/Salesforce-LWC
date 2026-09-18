# LWC Modal `lightning/alert`

The **`lightning/alert`** module displays an asynchronous, accessible alert dialog containing a message and a single **OK** button. It serves as the modern Salesforce replacement for the native browser `window.alert()` in Lightning Web Components, fully adhering to the Salesforce Lightning Design System (SLDS).

---

### Core Syntax & Basic Usage

`LightningAlert.open()` is a static method that displays an overlay modal and returns a **Promise** that resolves to **`undefined`** once the user dismisses the dialog by clicking **OK**, pressing `Esc`, or clicking the header `[X]`.

```javascript
import { LightningElement } from 'lwc';
import LightningAlert from 'lightning/alert';

export default class AlertDemo extends LightningElement {
  async handleShowAlert() {
    await LightningAlert.open({
      message: 'Your session is about to expire. Please save your work.',
      label: 'Session Warning', // Header title & ARIA label
      theme: 'warning' // 'default', 'shade', 'inverse', 'alt-inverse', 'success', 'info', 'warning', 'error'
    });

    // Execution continues only after user clicks "OK" or closes the dialog
    console.log('Alert dismissed by user');
  }
}

```

---

### Configuration Properties

Pass these parameters inside the configuration object to `LightningAlert.open()`:

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `message` | String | **Yes** | — | The body text explaining the alert condition. |
| `label` | String | **Yes** | — | The modal title and accessible label (`aria-label`). |
| `theme` | String | No | `'default'` | Header theme: `'default'`, `'shade'`, `'inverse'`, `'alt-inverse'`, `'success'`, `'info'`, `'warning'`, `'error'`. |
| `variant` | String | No | `'standard'` | Variant type. Accepts `'headerless'` to omit the title banner. |

---

### Implementation Patterns

#### 1. Blocking Critical Exception Alerts (`theme: 'error'`)

Unlike a toast notification (which disappears automatically after a few seconds), an alert modal forces the user to acknowledge critical failures before continuing:

```javascript
import { LightningElement } from 'lwc';
import LightningAlert from 'lightning/alert';

export default class CriticalErrorHandling extends LightningElement {
  async executeIntegration() {
    try {
      await triggerExternalSync();
    } catch (error) {
      await LightningAlert.open({
        message: error?.body?.message || 'Failed to reach external billing gateway.',
        label: 'System Error',
        theme: 'error'
      });

      // User must acknowledge before this cleanup runs
      this.resetSyncStatus();
    }
  }

  resetSyncStatus() {
    // Reset component state
  }
}

```

#### 2. Headerless Minimal Alert

When an icon banner or top title is unnecessary and you only want a concise, focused notice:

```javascript
await LightningAlert.open({
  message: 'All changes saved to draft.',
  label: 'Draft Notification', // Still required for screen readers (aria-label)
  variant: 'headerless'
});

```

---

### `ShowToastEvent` vs. `LightningAlert`

| Feature | `ShowToastEvent` (Toasts) | `LightningAlert.open()` |
| --- | --- | --- |
| **User Interaction** | Passive; auto-dismisses after a timeout (unless set to `sticky`). | Active; forces explicit acknowledgment via the **OK** button. |
| **Screen Coverage** | Floats non-intrusively at the top of the viewport. | Modal overlay with backdrop; blocks page interaction. |
| **Execution Flow** | Dispatched and forgotten (no Promise resolution). | Returns a Promise; downstream code can wait via `await`. |
| **Container Support** | Standard Lightning Experience, Console, Mobile. Limited in custom LWR. | Works across Lightning Experience, Console, Mobile, and Digital Experiences. |

---

### Developer Tips & Limitations

* **Non-Blocking to JavaScript Threads:**
Unlike native `window.alert()`, which halts all browser execution and rendering, `LightningAlert.open()` is asynchronous. Always use `await` inside an `async` function if you need code execution to pause until the user clicks **OK**.
* **Button Label is Fixed:**
The action button cannot be renamed from **OK**. If you require buttons like "Got It", "View Details", or "Back", build a custom dialog using **`lightning/modal`**.
* **Plain String Body Only:**
The `message` property only accepts raw text strings. HTML markup, links, formatting, or custom child components cannot be injected into the body.-