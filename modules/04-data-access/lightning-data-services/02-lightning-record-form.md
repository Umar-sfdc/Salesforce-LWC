# Salesforce LWC `lightning-record-form`

`lightning-record-form` is the fastest, lowest-code way to build record views and edit screens in Lightning Web Components. It is completely wrappered around **Lightning Data Service (LDS)**, meaning it handles field-level security, layout generation, validation rules, and server DML automatically without writing a single line of Apex.

---

### Core Modes

The component operates in three distinct modes controlled via the `mode` attribute:

* **`view` (Default):** Renders fields as read-only, but adds inline pencil icons so users can double-click or click the edit icon to switch directly into edit mode.
* **`readonly`:** Renders fields strictly as read-only with no inline edit affordance.
* **`edit`:** Renders the form directly with input fields and standard **Save** and **Cancel** buttons at the bottom.

---

### Supplying Fields: Two Strategies

You can determine which fields render using either **`layout-type`** or an explicit **`fields`** array.

#### Strategy A: `layout-type` (Admins Control the Fields)

Lets Salesforce determine which fields to render based on the object's page layout configured in Object Manager.

```html
<template>
    <lightning-record-form
        record-id={recordId}
        object-api-name="Contact"
        layout-type="Compact"
        mode="view">
    </lightning-record-form>
</template>

```

* Accepted values: `"Compact"` (highlights panel fields) or `"Full"` (full page layout).
* **Advantage:** Admins can adjust the fields in Object Manager without developers redeploying code.

#### Strategy B: `fields` Array (Developer Controls the Fields)

Lets you specify an explicit list of fields directly in JavaScript using schema imports.

**HTML:**

```html
<template>
    <lightning-record-form
        record-id={recordId}
        object-api-name={objectApiName}
        fields={fields}
        columns="2"
        mode="view">
    </lightning-record-form>
</template>

```

**JavaScript:**

```javascript
import { LightningElement, api } from 'lwc';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';
import PHONE_FIELD from '@salesforce/schema/Account.Phone';
import ANNUAL_REVENUE_FIELD from '@salesforce/schema/Account.AnnualRevenue';

export default class AccountRecordView extends LightningElement {
    @api recordId;
    @api objectApiName = 'Account';

    // Static schema imports guarantee referential integrity
    fields = [NAME_FIELD, INDUSTRY_FIELD, PHONE_FIELD, ANNUAL_REVENUE_FIELD];
}

```

---

### Creating a New Record

To use `lightning-record-form` to **create** a record instead of editing an existing one, simply omit the `record-id` attribute and set `mode="edit"`:

```html
<template>
    <lightning-record-form
        object-api-name="Account"
        fields={fields}
        onsuccess={handleSuccess}>
    </lightning-record-form>
</template>

```

---

### Component Lifecycle Events

`lightning-record-form` exposes custom DOM events that let you execute JavaScript when actions occur:

* **`onload`:** Fires when record data is loaded.
* **`onsubmit`:** Fires when the user clicks Save, right before sending the payload to the server. You can intercept or cancel this event.
* **`onsuccess`:** Fires when the record is successfully saved. Returns the updated record data via `event.detail`.
* **`onerror`:** Fires if server validation fails or a network error occurs.

**Handling Events & Toast Notifications:**

```javascript
import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import NAME_FIELD from '@salesforce/schema/Contact.LastName';
import EMAIL_FIELD from '@salesforce/schema/Contact.Email';

export default class NewContactForm extends LightningElement {
    fields = [NAME_FIELD, EMAIL_FIELD];

    handleSuccess(event) {
        const evt = new ShowToastEvent({
            title: 'Contact Created',
            message: `Record ID: ${event.detail.id}`,
            variant: 'success',
        });
        this.dispatchEvent(evt);
    }
}

```

---

### Key Attributes Reference

| Attribute | Type | Description |
| --- | --- | --- |
| `record-id` | String | 18-character Salesforce record ID. Omit to create a new record. |
| `object-api-name` | String | Required API name of the target sObject (e.g., `'Account'`). |
| `fields` | Array | List of field API names or schema imports to display. |
| `layout-type` | String | Alternative to `fields`. Accepts `'Compact'` or `'Full'`. |
| `mode` | String | `'view'` (default), `'readonly'`, or `'edit'`. |
| `columns` | Number | Multi-column layout grid. Accepts `1` through `6` (usually `1` or `2`). |
| `density` | String | Display density: `'compact'` or `'comfy'`. |

---

### Limitations: When to Move Beyond It

While simple, `lightning-record-form` trades flexibility for speed:

* **No custom layout control:** You cannot place custom HTML, buttons, or custom components between fields.
* **All-or-nothing field rendering:** You cannot style individual inputs or change their behavior independently.
* **No dynamic pre-population:** Injecting default field values programmatically on creation is difficult.

When you hit these limits, the next step up the LDS ladder is **`lightning-record-edit-form`** or **`lightning-record-view-form`**, which gives you granular control over individual inputs (`lightning-input-field`).