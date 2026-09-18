# Salesforce `@wire` adapter `uiRecordApi`
`lightning/uiRecordApi` is the JavaScript module in Lightning Web Components that gives you programmatic access to Salesforce's **User Interface API**.

While form components (`lightning-record-form`, etc.) generate the HTML UI for you, `lightning/uiRecordApi` exposes wire adapters and asynchronous JavaScript functions so you can **read, create, update, and delete record data directly in JavaScript** while still utilizing the LDS client-side cache and security checks.

---

### Core Wire Adapters: Reading Data

#### 1. `getRecord`

Retrieves field values and metadata for a single record.

* **`fields` vs. `optionalFields`:** Use `fields` when the component strictly requires those fields to function. If a user lacks FLS for a field listed in `fields`, the wire throws an error. Use `optionalFields` if the component should still render even if the user lacks access to that specific field.

```javascript
import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue, getFieldDisplayValue } from 'lightning/uiRecordApi';

import NAME_FIELD from '@salesforce/schema/Account.Name';
import REVENUE_FIELD from '@salesforce/schema/Account.AnnualRevenue';
import CREATED_DATE_FIELD from '@salesforce/schema/Account.CreatedDate';

export default class AccountViewer extends LightningElement {
    @api recordId;

    @wire(getRecord, { 
        recordId: '$recordId', 
        fields: [NAME_FIELD], 
        optionalFields: [REVENUE_FIELD, CREATED_DATE_FIELD] 
    })
    account;

    get name() {
        // getFieldValue returns the raw, unformatted value (e.g., 500000)
        return getFieldValue(this.account.data, NAME_FIELD);
    }

    get formattedRevenue() {
        // getFieldDisplayValue returns localized/formatted string (e.g., "$500,000.00")
        return getFieldDisplayValue(this.account.data, REVENUE_FIELD);
    }
}

```

#### 2. `getRecords`

Fetches multiple records in a single batch call, even across different sObjects.

```javascript
import { LightningElement, wire } from 'lwc';
import { getRecords } from 'lightning/uiRecordApi';
import ACCOUNT_NAME from '@salesforce/schema/Account.Name';
import CONTACT_NAME from '@salesforce/schema/Contact.LastName';

export default class BatchRecordsViewer extends LightningElement {
    @wire(getRecords, {
        records: [
            { recordIds: ['001XXXXXXXXXXXXAAA'], fields: [ACCOUNT_NAME] },
            { recordIds: ['003XXXXXXXXXXXXBBB'], fields: [CONTACT_NAME] }
        ]
    })
    wiredBatchResults;
}

```

---

### Direct Async Functions: Creating, Updating, Deleting

For write operations, `lightning/uiRecordApi` provides promise-based functions that can be invoked inside standard JavaScript event handlers (like button clicks) rather than through `@wire`.

#### 1. `createRecord(recordInput)`

Creates a new record without writing an Apex `INSERT` statement.

```javascript
import { LightningElement } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';

export default class CreateAccountExample extends LightningElement {
    async handleCreate() {
        // 1. Construct the fields dictionary
        const fields = {};
        fields[NAME_FIELD.fieldApiName] = 'Acme Innovations';
        fields[INDUSTRY_FIELD.fieldApiName] = 'Technology';

        // 2. Wrap fields in a recordInput object containing apiName
        const recordInput = { 
            apiName: ACCOUNT_OBJECT.objectApiName, 
            fields 
        };

        try {
            const account = await createRecord(recordInput);
            console.log('Record created with ID:', account.id);
        } catch (error) {
            console.error('Error creating record:', error);
        }
    }
}

```

#### 2. `updateRecord(recordInput)`

Updates an existing record. The payload **must include the record `Id**`.

```javascript
import { LightningElement, api } from 'lwc';
import { updateRecord } from 'lightning/uiRecordApi';
import ID_FIELD from '@salesforce/schema/Account.Id';
import PHONE_FIELD from '@salesforce/schema/Account.Phone';

export default class UpdateAccountExample extends LightningElement {
    @api recordId;

    async handleUpdate() {
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.recordId; // Required
        fields[PHONE_FIELD.fieldApiName] = '555-0199';

        const recordInput = { fields };

        try {
            await updateRecord(recordInput);
            console.log('Account updated successfully');
        } catch (error) {
            console.error('Error updating record:', error);
        }
    }
}

```

#### 3. `deleteRecord(recordId)`

Deletes a record given its 18-character ID.

```javascript
import { LightningElement, api } from 'lwc';
import { deleteRecord } from 'lightning/uiRecordApi';

export default class DeleteAccountExample extends LightningElement {
    @api recordId;

    async handleDelete() {
        try {
            await deleteRecord(this.recordId);
            console.log('Account deleted');
        } catch (error) {
            console.error('Error deleting record:', error);
        }
    }
}

```

---

### Cache Busting: `notifyRecordUpdateAvailable`

If you modify record data outside of LDS—such as invoking an imperative Apex method that performs DML—the LDS client cache is unaware of the update.

Use `notifyRecordUpdateAvailable` to notify LDS that specific records have changed, forcing all wire adapters referencing those records to refresh:

```javascript
import { LightningElement, api } from 'lwc';
import { notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';
import runApexDml from '@salesforce/apex/AccountService.runApexDml';

export default class CustomUpdater extends LightningElement {
    @api recordId;

    async handleCustomAction() {
        // Run custom Apex that modifies the record
        await runApexDml({ accountId: this.recordId });

        // Bust the LDS cache for this specific record
        await notifyRecordUpdateAvailable([{ recordId: this.recordId }]);
    }
}

```

---

### Summary of `lightning/uiRecordApi` Utilities

| Method / Adapter | Type | Usage |
| --- | --- | --- |
| `getRecord` | Wire Adapter | Read single record data & fields. |
| `getRecords` | Wire Adapter | Read batches of records across sObjects. |
| `createRecord` | Async Function | Programmatic `INSERT`. |
| `updateRecord` | Async Function | Programmatic `UPDATE`. |
| `deleteRecord` | Async Function | Programmatic `DELETE`. |
| `getFieldValue` | Helper Function | Extract raw field value from a record payload. |
| `getFieldDisplayValue` | Helper Function | Extract formatted string (currencies, dates) from a record payload. |
| `notifyRecordUpdateAvailable` | Async Function | Tell LDS to bust cache and re-fetch for given record IDs. |