# Salesforce Lightning Data Service

**Lightning Data Service (LDS)** is Salesforce’s built-in framework for loading, creating, editing, and deleting records in Lightning Web Components (LWC) and Aura without writing server-side Apex code.

Think of LDS as a **smart data broker** sitting right inside the user's browser. Instead of every component sending its own query to the Salesforce database, LDS manages the requests, shares data across components, and handles caching automatically.

---

### Key Superpowers of LDS

* **No Apex Required:** Basic CRUD (Create, Read, Update, Delete) operations can be performed using declarative markup or JavaScript wire adapters.
* **Built-in Security:** Automatically enforces Object-Level Security (CRUD), Field-Level Security (FLS), and sharing rules. In Apex, you have to enforce these manually or remember `WITH USER_MODE`.
* **Shared Client-Side Cache:** If two different components on the same record page ask for the Account `Name`, LDS only fetches it from the server once.
* **Automatic UI Synchronization:** When one component updates a record via LDS, every other component on the page that references that same record automatically refreshes with the new data without custom event listeners.

---

### The 3 Ways to Use LDS in LWC

Depending on how much control you need over the layout and behavior, LDS offers three tiers:

| Approach | Customization Level | Code Required | Best For |
| --- | --- | --- | --- |
| **`lightning-record-form`** | Low | Markup only (fastest) | Standard layouts, rapid prototyping, admin-like record pages. |
| **`lightning-record-view/edit-form`** | Medium | Custom HTML markup | Custom column layouts, conditional field display, custom labels. |
| **`@wire` & UI API Functions** | High | Full JavaScript control | Reading data for custom calculations, charts, or triggering custom JS logic. |

---

### Practical Examples

**1. Declarative Form (Zero JavaScript)**
Displays an editable form adhering to the standard layout:

```html
<template>
    <lightning-record-form
        record-id={recordId}
        object-api-name="Account"
        layout-type="Compact"
        mode="view">
    </lightning-record-form>
</template>

```

**2. Programmatic Wire Adapter (`getRecord`)**
Fetch specific fields into JavaScript to use in custom logic:

```javascript
import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';

export default class AccountSummary extends LightningElement {
    @api recordId;

    @wire(getRecord, { recordId: '$recordId', fields: [NAME_FIELD, INDUSTRY_FIELD] })
    account;

    get name() {
        return getFieldValue(this.account.data, NAME_FIELD);
    }
}

```

---

### When Should You NOT Use LDS?

While LDS is the recommended default for record operations, switch to **Apex** when:

* You need to perform bulk operations (LDS operates on single records or small batches).
* You need to run complex SOQL aggregations (like `GROUP BY` or `COUNT()`).
* You need transactional logic, external callouts, or multi-object DML that must succeed or fail as a single transaction.