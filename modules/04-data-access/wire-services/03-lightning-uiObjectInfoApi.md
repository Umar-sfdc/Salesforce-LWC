# Salesforce LWC `lightning-uiObjectInfoApi` and Cache

`lightning/uiObjectInfoApi` provides access to Salesforce **metadata**—such as object schemas, field descriptions, record types, and picklist definitions.

Where `lightning/uiRecordApi` fetches actual **data rows** (e.g., "Acme Corp"), `lightning/uiObjectInfoApi` fetches the **blueprint** (e.g., "What are the allowed picklist values for Industry on the Enterprise record type?").

---

### Core Wire Adapters in `lightning/uiObjectInfoApi`

#### 1. `getObjectInfo`

Retrieves comprehensive metadata for an sObject, including its default record type ID, child relationships, theme color, and field definitions.

```javascript
import { LightningElement, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';

export default class ObjectInfoDemo extends LightningElement {
    defaultRecordTypeId;

    @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
    wiredObjectInfo({ data, error }) {
        if (data) {
            // Retrieve default Record Type ID for the user's profile
            this.defaultRecordTypeId = data.defaultRecordTypeId;
        }
    }
}

```

#### 2. `getPicklistValues`

Retrieves picklist values for a specific field based on a specific **Record Type ID**. This ensures users only see picklist options valid for that record type.

To feed `getPicklistValues` the correct record type ID dynamically, chain it with `getObjectInfo`:

```javascript
import { LightningElement, wire } from 'lwc';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';

export default class DynamicPicklistDemo extends LightningElement {
    industryOptions = [];

    // Step 1: Fetch Object Info to get the Record Type ID
    @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
    objectInfo;

    // Step 2: Pass the dynamic Record Type ID into the picklist adapter
    @wire(getPicklistValues, {
        recordTypeId: '$objectInfo.data.defaultRecordTypeId',
        fieldApiName: INDUSTRY_FIELD
    })
    wiredPicklist({ data, error }) {
        if (data) {
            // Map values for a standard lightning-combobox: [{ label, value }]
            this.industryOptions = data.values.map(item => ({
                label: item.label,
                value: item.value
            }));
        }
    }
}

```

#### 3. `getPicklistValuesByRecordType`

Fetches picklist values for **all** picklist fields on an object for a given record type in a single round-trip. Useful for initializing entire multi-field filter panels or custom forms.

```javascript
import { LightningElement, wire } from 'lwc';
import { getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';

export default class AllPicklistsDemo extends LightningElement {
    @wire(getPicklistValuesByRecordType, {
        objectApiName: ACCOUNT_OBJECT,
        recordTypeId: '012000000000000AAA'
    })
    allPicklists;
}

```

---

### How Caching Works in Lightning Data Service (LDS)

LDS maintains a single, unified, client-side in-memory cache in the browser shared across all Lightning components on a page.

```
       Browser Tab Memory (LDS Client Cache)
┌──────────────────────────────────────────────────┐
│  Record Data: Account '001...' { Name, Industry }│
│  Metadata: Account ObjectInfo, Picklist values   │
└───────────────▲──────────────────────▲───────────┘
                │                      │
       Component A (@wire)    Component B (record-form)
                │                      │
                └──────────┬───────────┘
                           │ (Cache Miss Only)
                           ▼
                 Salesforce Server / DB

```

#### 1. Cache Retrieval (Read Path)

* When a wire adapter executes, LDS checks its client-side cache first.
* **Cache Hit:** If the requested record ID, fields, or metadata exist in the cache and are fresh, LDS returns the cached data instantly with zero HTTP requests.
* **Cache Miss:** LDS makes a call to the UI API backend, stores the returned payload in the cache, and broadcasts it to the wired component.

#### 2. Cache Invalidation & Updates (Write Path)

* **Inside LDS (`createRecord`, `updateRecord`, `lightning-record-edit-form`):** LDS updates its local cache automatically upon successful completion. Any other wired component on the page that references that record re-renders with the fresh data immediately.
* **Outside LDS (Imperative Apex DML, Platform Events, External Systems):** LDS cannot detect changes that happen outside its client framework. The cache becomes stale unless manually invalidated.

---

### Cache Invalidation Tools: `notifyRecordUpdateAvailable` vs. `refreshApex`

| Scenario | Cache Busting Tool | Target |
| --- | --- | --- |
| Stale data in **UI API Wire Adapters** (`getRecord`, `getRecords`, etc.) after an Apex DML or external change. | `notifyRecordUpdateAvailable(recordIds)` | LDS UI API record cache |
| Stale data in a **Wired Apex Method** (`@wire(myApexMethod)`) after performing an imperative action. | `refreshApex(wiredProperty)` | Apex client-side wire cache |

#### Example: Busting the LDS Record Cache

```javascript
import { LightningElement, api } from 'lwc';
import { notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';
import updateStageViaApex from '@salesforce/apex/OpportunityService.updateStageViaApex';

export default class StageUpdater extends LightningElement {
    @api recordId;

    async handleAdvanceStage() {
        // 1. Run Apex DML (LDS is blind to this)
        await updateStageViaApex({ oppId: this.recordId });

        // 2. Explicitly notify LDS to discard old cached record data and re-evaluate wires
        await notifyRecordUpdateAvailable([{ recordId: this.recordId }]);
    }
}

```

#### Example: Busting a Wired Apex Cache

```javascript
import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getContacts from '@salesforce/apex/ContactController.getContacts';

export default class ContactList extends LightningElement {
    // Hold the entire wired provision object (not just .data)
    wiredContactsResult;

    @wire(getContacts)
    wiredContacts(result) {
        this.wiredContactsResult = result;
    }

    async handleRefresh() {
        // Forces the wire to call Apex again despite cacheable=true
        await refreshApex(this.wiredContactsResult);
    }
}

```