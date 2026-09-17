# Salesforce LWC `lightning-record-edit-form`
`lightning-record-edit-form` is the editable counterpart to `lightning-record-view-form`. It gives you **complete control over form layout, custom validation, and pre-population**, while Lightning Data Service (LDS) handles field metadata, picklist dependencies, validation rules, and DML updates behind the scenes without Apex.

---

### Core Anatomy: Form and Input Fields

Like `lightning-record-view-form`, it uses dedicated child components:

* **`lightning-record-edit-form` (Parent):** Wraps the inputs, connects to LDS, and manages submission/transaction state.
* **`lightning-input-field` (Child):** Renders the input element matched to the field's data type (e.g., date pickers for dates, dropdowns with active values for picklists, search pills for lookups).
* **`lightning-messages` (Child):** Renders server-side errors, page-level validation failures, and trigger exception messages automatically.

---

### 1. Basic Create / Edit Example

To **edit**, pass `record-id`. To **create**, omit `record-id`.

**HTML:**

```html
<template>
    <lightning-card title="Edit Account" icon-name="standard:account">
        <div class="slds-p-around_medium">
            <lightning-record-edit-form
                record-id={recordId}
                object-api-name={objectApiName}
                onsubmit={handleSubmit}
                onsuccess={handleSuccess}
                onerror={handleError}>
                
                <!-- Displays server validation rules & trigger errors -->
                <lightning-messages></lightning-messages>

                <div class="slds-grid slds-gutters">
                    <div class="slds-col slds-size_1-of-2">
                        <lightning-input-field field-name={nameField}></lightning-input-field>
                        <lightning-input-field field-name={phoneField}></lightning-input-field>
                    </div>
                    <div class="slds-col slds-size_1-of-2">
                        <lightning-input-field field-name={industryField}></lightning-input-field>
                        <lightning-input-field field-name={revenueField}></lightning-input-field>
                    </div>
                </div>

                <div class="slds-m-top_medium">
                    <lightning-button 
                        variant="brand" 
                        type="submit" 
                        label="Save Account">
                    </lightning-button>
                    <lightning-button 
                        class="slds-m-left_small" 
                        label="Cancel" 
                        onclick={handleReset}>
                    </lightning-button>
                </div>

            </lightning-record-edit-form>
        </div>
    </lightning-card>
</template>

```

**JavaScript:**

```javascript
import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import NAME_FIELD from '@salesforce/schema/Account.Name';
import PHONE_FIELD from '@salesforce/schema/Account.Phone';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';
import REVENUE_FIELD from '@salesforce/schema/Account.AnnualRevenue';

export default class AccountEditForm extends LightningElement {
    @api recordId;
    @api objectApiName = 'Account';

    nameField = NAME_FIELD;
    phoneField = PHONE_FIELD;
    industryField = INDUSTRY_FIELD;
    revenueField = REVENUE_FIELD;

    handleSuccess(event) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: `Record saved successfully! ID: ${event.detail.id}`,
                variant: 'success'
            })
        );
    }

    handleError(event) {
        // Form errors are displayed by <lightning-messages>, but you can add custom handling here
        console.error('Save error:', event.detail);
    }

    handleReset() {
        // Reset all input fields inside the form to their initial state
        const inputFields = this.template.querySelectorAll('lightning-input-field');
        if (inputFields) {
            inputFields.forEach(field => field.reset());
        }
    }
}

```

---

### 2. Intercepting and Modifying Data on Submit

One of the main reasons to choose `lightning-record-edit-form` over `lightning-record-form` is the ability to inspect, modify, or inject values before the payload is sent to Salesforce.

```javascript
handleSubmit(event) {
    // 1. Prevent default immediate submission
    event.preventDefault();

    // 2. Extract fields dictionary from event payload
    const fields = event.detail.fields;

    // 3. Client-side custom validation
    if (!fields.Phone) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Validation Error',
                message: 'Phone number is required before saving.',
                variant: 'error'
            })
        );
        return; // Halt save
    }

    // 4. Inject or alter values programmatically
    fields.Description = 'Updated via Custom LWC Edit Form';

    // 5. Submit programmatically via the form's template reference
    this.template.querySelector('lightning-record-edit-form').submit(fields);
}

```

---

### 3. Pre-populating Values on Record Creation

When creating a new record (`record-id` is omitted), you can set default values in two ways:

* **In HTML (Direct attribute):**
```html
<lightning-input-field field-name={industryField} value="Banking"></lightning-input-field>

```


* **In `handleSubmit`:** Programmatically set `fields.Industry = 'Banking'` before calling `.submit(fields)`.

---

### Key Attributes and Methods

| Element | Property / Event / Method | Purpose |
| --- | --- | --- |
| **Form** | `record-id` | Populate to update; leave blank to create. |
| **Form** | `object-api-name` | Target object API name (e.g., `'Contact'`). |
| **Form** | `onsubmit` | Intercept submission payload via `event.detail.fields`. |
| **Form** | `onsuccess` | Returns saved record ID via `event.detail.id`. |
| **Form** | `.submit(fields)` | JavaScript method to send record fields to LDS. |
| **Input Field** | `field-name` | Schema reference or field API name. |
| **Input Field** | `value` | Manually bind or pre-populate an initial value. |
| **Input Field** | `variant` | Supports `"label-hidden"`, `"label-inline"`, or `"label-stacked"`. |
| **Input Field** | `.reset()` | Reverts field value to the original state. |

---

### Form Component Decision Matrix

| Requirement | `lightning-record-form` | `lightning-record-view-form` | `lightning-record-edit-form` |
| --- | --- | --- | --- |
| **Primary Mode** | View / Edit / Read-Only | Read-Only only | Edit / Create |
| **Child Inputs** | Automatic | `<lightning-output-field>` | `<lightning-input-field>` |
| **Custom Grid / CSS** | ❌ (Strict columns only) | ✔️ Complete freedom | ✔️ Complete freedom |
| **Pre-populate Values** | ❌ Difficult | N/A | ✔️ Very easy |
| **Custom Submit Logic** | Minimal | N/A | ✔️ Full payload access |