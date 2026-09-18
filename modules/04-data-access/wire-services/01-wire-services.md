# Wire Services

The `@wire` service is Lightning Web Components' built-in reactive mechanism for reading Salesforce data and metadata. Built on top of the Lightning Data Service (LDS) client-side cache, it automatically provisions an immutable stream of data into your component and re-evaluates whenever its reactive parameters change.

---

### The Fundamental Syntax

A wire adapter requires importing the decorator and the adapter function:

```javascript
import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

export default class WireDemo extends LightningElement {
    @api recordId;

    // Syntax: @wire(adapterId, adapterConfig) propertyOrFunction;
    @wire(getRecord, { recordId: '$recordId', fields: ['Account.Name'] })
    account;
}

```

The leading `$` in `'$recordId'` denotes a **reactive variable**:

* When `this.recordId` is `undefined`, the wire service pauses and waits.
* The moment `this.recordId` receives a value, the wire executes.
* If `this.recordId` updates later, the wire automatically re-executes with the new value.

---

### Wiring to a Property vs. Wiring to a Function

You can wire an adapter to either a property or a JavaScript method, depending on whether the response needs post-processing.

#### 1. Wiring to a Property (Simple & Direct)

Best when you simply need to pass data or error states directly to your HTML template.

```javascript
@wire(getRecord, { recordId: '$recordId', fields: ['Contact.Name', 'Contact.Email'] })
contact;

```

Salesforce assigns an object with exactly two properties to `contact`:

* `contact.data`: The payload returned by the wire adapter.
* `contact.error`: The error payload if retrieval failed (otherwise `undefined`).

**HTML Consumption:**

```html
<template>
    <template lwc:if={contact.data}>
        <p>Name: {contact.data.fields.Name.value}</p>
        <p>Email: {contact.data.fields.Email.value}</p>
    </template>
    <template lwc:elseif={contact.error}>
        <p class="slds-text-color_error">Failed to load contact data.</p>
    </template>
</template>

```

#### 2. Wiring to a Function (Data Transformation & Side Effects)

Best when you need to transform the data, trigger local logic, or extract values into dedicated component properties.

```javascript
import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Account.Name';

export default class AccountProcessor extends LightningElement {
    @api recordId;
    accountName;
    errorMessage;

    @wire(getRecord, { recordId: '$recordId', fields: [NAME_FIELD] })
    wiredAccount({ data, error }) {
        if (data) {
            this.accountName = getFieldValue(data, NAME_FIELD);
            this.errorMessage = undefined;
        } else if (error) {
            this.errorMessage = error.body ? error.body.message : 'Unknown error';
            this.accountName = undefined;
        }
    }
}

```

---

### Key Wire Rules & Behaviors

* **Immutable Data:** The object returned in `data` is frozen (`Object.freeze()`). You cannot mutate it directly (e.g., `this.contact.data.fields.Name.value = 'New Name'` throws an error). If you need to manipulate the data, create a shallow copy first.
* **Component Lifecycle Timing:** Wires execute asynchronously. A wired property is almost always `undefined` during `constructor()` and early inside `connectedCallback()`. Never assume wire data is present during component instantiation.
* **Client-Side Cache First:** If another component on the page has already requested the same fields for the same record ID, `@wire` serves it instantly from the local LDS cache without an HTTP round-trip.

---

### Popular Built-in Wire Adapters (`lightning/uiRecordApi`)

| Adapter | Module | What It Fetches |
| --- | --- | --- |
| `getRecord` | `lightning/uiRecordApi` | Field values for a single record. |
| `getRecords` | `lightning/uiRecordApi` | Multiple records across one or more sObjects in one batch. |
| `getFieldValue` | `lightning/uiRecordApi` | Helper function to extract a single field's raw or formatted value. |
| `getFieldDisplayValue` | `lightning/uiRecordApi` | Helper function to extract localized/formatted display values (e.g., dates/currency). |
| `getPicklistValues` | `lightning/uiObjectInfoApi` | Picklist metadata and values based on record type ID. |
| `getObjectInfo` | `lightning/uiObjectInfoApi` | Object-level metadata (child relationships, record type IDs, theme color). |

---

### Wiring Custom Apex Methods

Beyond LDS UI APIs, you can wire custom Apex methods. The Apex method **must** be annotated with `(cacheable=true)`:

**Apex Controller:**

```apex
public with sharing class ContactController {
    @AuraEnabled(cacheable=true)
    public static List<Contact> getRelatedContacts(Id accountId) {
        return [SELECT Id, Name, Title, Email FROM Contact WHERE AccountId = :accountId LIMIT 10];
    }
}

```

**LWC JavaScript:**

```javascript
import { LightningElement, api, wire } from 'lwc';
import getRelatedContacts from '@salesforce/apex/ContactController.getRelatedContacts';

export default class ContactList extends LightningElement {
    @api recordId;

    @wire(getRelatedContacts, { accountId: '$recordId' })
    contacts;
}

```

---

### Manual Refresh: Bypassing the Cache

Because wired data is cached, updates made via custom Apex or third-party mechanisms won't automatically bust the cache. Salesforce provides utility functions to force fresh evaluations:

* **For wired Apex:** `refreshApex(this.wiredResultProperty)`
* **For wired LDS UI API adapters:** `notifyRecordUpdateAvailable([{ recordId: this.recordId }])`


