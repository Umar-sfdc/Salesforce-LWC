# Salesforce LWC Caching

The `lightning/uiRecordApi` module is built on Salesforce’s **Lightning Data Service (LDS)** and the User Interface API. It allows you to perform CRUD operations on individual records directly from JavaScript without writing server-side Apex controllers.

---

### Core Wire Adapters & Helper Functions

#### 1. `getRecord` & `getFieldValue` / `getFieldDisplayValue`

Used to fetch record data reactively. LDS caches the response across components.

```javascript
import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue, getFieldDisplayValue } from 'lightning/uiRecordApi';
import ACCOUNT_NAME from '@salesforce/schema/Account.Name';
import ANNUAL_REVENUE from '@salesforce/schema/Account.AnnualRevenue';

export default class AccountViewer extends LightningElement {
  @api recordId;

  // Reactive parameter '$recordId' ensures automatic refetching on change
  @wire(getRecord, { recordId: '$recordId', fields: [ACCOUNT_NAME, ANNUAL_REVENUE] })
  account;

  get name() {
    return getFieldValue(this.account.data, ACCOUNT_NAME);
  }

  get formattedRevenue() {
    // getFieldDisplayValue returns formatted strings (e.g., "$1,000,000" vs raw 1000000)
    return getFieldDisplayValue(this.account.data, ANNUAL_REVENUE);
  }
}

```

#### 2. `createRecord(recordInput)`

An imperative JavaScript method returning a Promise that creates a new record.

```javascript
import { LightningElement } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import CONTACT_OBJECT from '@salesforce/schema/Contact';
import FIRST_NAME from '@salesforce/schema/Contact.FirstName';
import LAST_NAME from '@salesforce/schema/Contact.LastName';

export default class CreateContact extends LightningElement {
  async handleSave() {
    const fields = {};
    fields[FIRST_NAME.fieldApiName] = 'Jane';
    fields[LAST_NAME.fieldApiName] = 'Doe';

    const recordInput = { apiName: CONTACT_OBJECT.objectApiName, fields };

    try {
      const contact = await createRecord(recordInput);
      console.log('Created Contact Id:', contact.id);
    } catch (error) {
      console.error('Error creating contact:', error);
    }
  }
}

```

#### 3. `updateRecord(recordInput, clientOptions)`

An imperative method returning a Promise to modify an existing record. **The record `Id` is mandatory in the fields payload.**

```javascript
import { LightningElement, api } from 'lwc';
import { updateRecord } from 'lightning/uiRecordApi';
import ID_FIELD from '@salesforce/schema/Account.Id';
import PHONE_FIELD from '@salesforce/schema/Account.Phone';

export default class UpdateAccount extends LightningElement {
  @api recordId;

  async handlePhoneUpdate(newPhone) {
    const fields = {};
    fields[ID_FIELD.fieldApiName] = this.recordId;
    fields[PHONE_FIELD.fieldApiName] = newPhone;

    const recordInput = { fields };

    try {
      await updateRecord(recordInput);
      console.log('Record updated successfully');
    } catch (error) {
      console.error('Update failed:', error);
    }
  }
}

```

#### 4. `deleteRecord(recordId)`

Imperatively deletes a record by its 18-character ID.

```javascript
import { LightningElement, api } from 'lwc';
import { deleteRecord } from 'lightning/uiRecordApi';

export default class DeleteContact extends LightningElement {
  @api recordId;

  async handleDelete() {
    try {
      await deleteRecord(this.recordId);
      console.log('Record deleted');
    } catch (error) {
      console.error('Delete error:', error);
    }
  }
}

```

#### 5. Cache Notification: `notifyRecordUpdateAvailable(recordIds)`

When updates occur outside LDS (e.g., an Apex DML operation or third-party call), call `notifyRecordUpdateAvailable` to notify LDS so that all other components wired to those records refresh their local cache.

```javascript
import { notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';

// Call after custom Apex DML finishes:
await customApexMethod({ recordId: this.recordId });
await notifyRecordUpdateAvailable([{ recordId: this.recordId }]);

```

---

### Key Methods & Adapters Summary

| API Identifier | Type | Primary Purpose |
| --- | --- | --- |
| `getRecord` | Wire Adapter | Fetch record data by ID using specific fields or layout types. |
| `getRecords` | Wire Adapter | Batch fetch up to 50 records in a single wire request. |
| `getFieldValue` | Function | Safely extract a field value without manual null checks (`data.fields...`). |
| `getFieldDisplayValue` | Function | Extract localized/formatted values (currencies, dates, picklist labels). |
| `createRecord` | Imperative Function | Creates a record in Salesforce via UI API. |
| `updateRecord` | Imperative Function | Updates specified fields on an existing record. |
| `deleteRecord` | Imperative Function | Deletes a record from Salesforce. |
| `notifyRecordUpdateAvailable` | Imperative Function | Refreshes LDS cache when data changes outside of LDS (replaces deprecated `getRecordNotifyChange`). |

---

### Developer Tips & Best Practices

* **Always Import Schema References:**
Import objects and fields via `@salesforce/schema/Object.Field` rather than hardcoding string names. This guarantees referential integrity: Salesforce will prevent admins from deleting fields used by the component and will automatically rename references if the API name changes.
* **Handle Immutability:**
Data returned by `@wire` is immutable. Attempting to modify `this.account.data.fields.Name.value = 'New'` will throw a runtime error. Clone the object or pass modified values via a fresh `recordInput`.
* **Use `fields` Instead of `layoutTypes` in Production:**
Using `layoutTypes: ['Full']` queries every field assigned to the page layout. This increases payload sizes and makes component rendering dependent on admin layout edits. Explicit field imports keep the component resilient and performant.
* **Combine with `lightning/uiObjectInfoApi`:**
For metadata, record types, and default values, use `uiObjectInfoApi` (`getObjectInfo`, `getPicklistValues`) alongside `uiRecordApi`.

---

### Limitations

* **Unsupported Objects:**
Not all standard Salesforce objects are supported by UI API (e.g., standard objects like `Task`, `Event`, and setup objects like `Profile` or `UserRole` have limited or no UI API support).
* **Single-Record Scope:**
`createRecord`, `updateRecord`, and `deleteRecord` do not support bulk/mass operations. If you need to insert or update 20 records at once, use an `@AuraEnabled` Apex controller to avoid hitting browser connection limits.
* **No Rollback Across Multiple Calls:**
Sequential `createRecord` calls execute as independent HTTP requests and transactions. If the second call fails, the first is not rolled back. For transactional integrity across multiple records, use Apex.
* **Offline & Context Constraints:**
While supported across Lightning Experience and the Salesforce Mobile App, certain specialized contexts (e.g., custom public Experience Cloud pages without login, or unsupported Lightning Out deployments) have limited LDS caching support.