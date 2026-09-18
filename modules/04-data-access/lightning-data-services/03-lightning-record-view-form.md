# Salesforce LWC `lightning-record-view-form`
`lightning-record-view-form` is the read-only sibling in the LDS form family that gives you **full control over the layout** while handling data fetching and Field-Level Security (FLS) behind the scenes.

Unlike `lightning-record-form` (which renders all fields automatically in a rigid structure), `lightning-record-view-form` acts as a data wrapper: you explicitly choose where each field goes, how many columns to use, and what HTML, icons, or badges to tuck between them.

---

### Anatomy: Parent and Child

`lightning-record-view-form` works in tandem with a child component: **`lightning-output-field`**.

* **`lightning-record-view-form` (Parent):** Connects to LDS using `record-id` and `object-api-name`. It handles caching, permissions, and retrieves the data.
* **`lightning-output-field` (Child):** Placed inside the form to render a specific field. It automatically formats the data based on metadata (e.g., currency symbols, phone links, picklist badges, formatted dates, lookup hover links).

---

### Basic Example with a Custom Grid Layout

Using Salesforce Lightning Design System (SLDS) grid utility classes, you can position fields exactly where you want them:

**HTML:**

```html
<template>
    <lightning-card title="Account Highlights" icon-name="standard:account">
        <div class="slds-p-around_medium">
            <lightning-record-view-form
                record-id={recordId}
                object-api-name={objectApiName}>
                
                <!-- 2-Column Responsive Layout -->
                <div class="slds-grid slds-gutters">
                    <div class="slds-col slds-size_1-of-2">
                        <lightning-output-field field-name={nameField}></lightning-output-field>
                        <lightning-output-field field-name={phoneField}></lightning-output-field>
                    </div>
                    <div class="slds-col slds-size_1-of-2">
                        <lightning-output-field field-name={industryField}></lightning-output-field>
                        <lightning-output-field field-name={revenueField}></lightning-output-field>
                    </div>
                </div>

            </lightning-record-view-form>
        </div>
    </lightning-card>
</template>

```

**JavaScript:**

```javascript
import { LightningElement, api } from 'lwc';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import PHONE_FIELD from '@salesforce/schema/Account.Phone';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';
import REVENUE_FIELD from '@salesforce/schema/Account.AnnualRevenue';

export default class AccountCustomView extends LightningElement {
    @api recordId;
    @api objectApiName = 'Account';

    // Expose imported schema fields to the template
    nameField = NAME_FIELD;
    phoneField = PHONE_FIELD;
    industryField = INDUSTRY_FIELD;
    revenueField = REVENUE_FIELD;
}

```

> **Tip:** While you can pass raw strings like `field-name="Name"`, importing via `@salesforce/schema` ensures compile-time validation and prevents fields from being deleted or renamed in Salesforce if they are in active use.

---

### Key Capabilities

* **Automatic Formatting:** A Currency field automatically displays currency symbols and separators; a URL or Email field renders as a clickable link.
* **Field-Level Security (FLS) Enforcement:** If the current user does not have read access to a field, `lightning-output-field` hides it automatically without throwing an error.
* **Mixed Custom Markup:** You can inject badges, custom text, tabs, accordion sections, or callout banners anywhere inside the form markup.

---

### Useful Attributes & Events

| Target | Attribute / Event | Description |
| --- | --- | --- |
| **Form** | `record-id` | 18-character ID of the record to view. |
| **Form** | `object-api-name` | API name of the target sObject. |
| **Form** | `density` | Controls field spacing (`"comfy"` or `"compact"`). |
| **Form** | `onload` | Event that fires when LDS finishes loading the record data. |
| **Form** | `onerror` | Event that fires if record retrieval fails. |
| **Output Field** | `field-name` | Schema import or field API string to render. |
| **Output Field** | `variant` | Label placement: `"standard"` (label above) or `"label-hidden"` (suppresses label). |

---

### Suppressing Labels for Compact UIs

If you only want the value—for instance, when designing custom header cards or tables—use `variant="label-hidden"`:

```html
<div class="slds-text-heading_medium">
    <lightning-output-field 
        field-name={nameField} 
        variant="label-hidden">
    </lightning-output-field>
</div>

```

---

### `lightning-record-form` vs. `lightning-record-view-form`

| Feature | `lightning-record-form (mode="readonly")` | `lightning-record-view-form` |
| --- | --- | --- |
| **Setup Speed** | Faster (zero or minimal HTML) | Moderate (explicit field tags) |
| **Layout Control** | Limited (only standard 1–6 column grids) | Complete (any HTML/CSS/SLDS grid) |
| **Custom Elements Between Fields** | Not supported | Fully supported |
| **Label Customization** | Standard only | Can suppress via `label-hidden` |
