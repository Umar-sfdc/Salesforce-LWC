# Salesforce LWC - Imperative Apex

Imperative Apex calls in Lightning Web Components (LWC) invoke server-side Apex methods explicitly on demand—such as inside an event handler, button click, or lifecycle hook—returning a standard JavaScript Promise.

Unlike wire adapters (which enforce reactive, read-only data binding), imperative calls grant explicit control over execution timing and support **DML operations** (Insert, Update, Delete).

---

### When to Use Imperative Calls vs. `@wire`

| Criteria | `@wire` Service | Imperative Apex |
| --- | --- | --- |
| **Trigger** | Automatic/Reactive (runs on load & parameter change) | Explicit (button click, event, custom logic) |
| **DML Allowed** | No (must be `@AuraEnabled(cacheable=true)`) | Yes (`cacheable=false` required for DML) |
| **Client Caching** | Managed automatically via Lightning Data Service | No client cache (bypasses LDS cache unless cached) |
| **Execution Flow** | Declarative | Procedural (`async/await` or `.then().catch()`) |

---

### Implementation Pattern

**1. Apex Controller (`AccountController.cls`)**

```apex
public with sharing class AccountController {
    @AuraEnabled
    public static Account updateAccountPhone(Id accountId, String newPhone) {
        if (!Schema.sObjectType.Account.fields.Phone.isUpdateable()) {
            throw new AuraHandledException('Insufficient permissions to update Account phone.');
        }
        
        Account acc = new Account(Id = accountId, Phone = newPhone);
        update acc;
        return acc;
    }
}

```

**2. Lightning Web Component (`accountUpdater.js`)**

```javascript
import { LightningElement, api } from 'lwc';
import updateAccountPhone from '@salesforce/apex/AccountController.updateAccountPhone';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class AccountUpdater extends LightningElement {
    @api recordId;
    phoneInput = '';
    isLoading = false;

    handlePhoneChange(event) {
        this.phoneInput = event.target.value;
    }

    async handleSave() {
        this.isLoading = true;
        try {
            const updatedAccount = await updateAccountPhone({
                accountId: this.recordId,
                newPhone: this.phoneInput
            });
            
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: `Phone updated to ${updatedAccount.Phone}`,
                variant: 'success'
            }));
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error updating record',
                message: error.body?.message || error.message,
                variant: 'error'
            }));
        } finally {
            this.isLoading = false;
        }
    }
}

```

---

### Key Limitations

* **LDS Cache Desynchronization:** Imperative Apex mutates data on the server without automatically updating the Lightning Data Service (LDS) client cache. Other components on the page displaying the same record will become stale unless manually refreshed using `notifyRecordUpdateAvailable(recordIds)` or `getRecordNotifyChange()`.
* **Governor Limits:** Imperative invocations run under synchronous governor limits (100 SOQL queries, 150 DML statements, 10-second CPU limit).
* **Payload & Heap Constraints:** Maximum response/request payload size for `@AuraEnabled` methods is **4 MB** (or 1 MB for HTTP GET requests).
* **Concurrent Long-Running Requests:** Long-running requests (>5 seconds) count against the org's concurrent request limit (10 concurrent requests).

---

### Pro-Tips for Intermediate Developers

* **Always Pass Parameters by Exact Name:** The parameter keys in your JS invocation object must strictly match the Apex signature (`{ accountId: this.recordId }` maps to `Id accountId`). Parameter mismatches pass `null` silently without compilation errors.
* **Wrap Server Exceptions:** Always throw custom `AuraHandledException`s in Apex. Standard unhandled exceptions expose raw internal errors and return an unhelpful generic generic message like *"An internal server error occurred"*.
* **Prefer `async/await` over Callback Chains:** Improves stack trace clarity and avoids callback nesting when chaining multiple Apex calls sequentially.
* **Respect Security Defaults:** Apex runs in system mode by default. Always enforce `with sharing` or `inherited sharing`, and use `WITH USER_MODE` in SOQL or verify FLS/CRUD before DML.