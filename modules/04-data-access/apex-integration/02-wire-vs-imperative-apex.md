# Salesforce @wire Vs Imperative Apex
Understanding the distinction between **Wired Apex** and **Imperative Apex**—and how `@AuraEnabled(cacheable=true)` alters client-side behavior—is one of the most critical architectural decisions in LWC performance and state management.

---

### Core Comparison: Wire Service vs. Imperative Invocation

| Capability | `@wire` Apex | Imperative Calling (`cacheable=true`) | Imperative Calling (`cacheable=false`) |
| --- | --- | --- | --- |
| **Execution Trigger** | **Reactive**: On component init & whenever reactive parameters (`$param`) change | **Explicit**: Invoked imperatively via code execution (functions, events) | **Explicit**: Invoked imperatively via code execution (functions, events) |
| **DML Support** | ❌ **Forbidden** (Throws error) | ❌ **Forbidden** (Enforced at runtime) | ✅ **Allowed** (Insert, Update, Delete) |
| **Client-Side Caching** | ✅ Built-in LDS storage cache | ✅ Client cache shared with LDS wire | ❌ Bypasses cache (Direct server trip) |
| **Refresh Mechanism** | `refreshApex(wiredProperty)` | `refreshApex()` (if wire exists) or imperative re-fetch | Always fresh execution |
| **Lifecycle Hook Usage** | Active before/during DOM render | `connectedCallback()`, user interactions, async flows | Event handlers, async flows |

---

### Deep Dive: `@AuraEnabled(cacheable=true)`

When you decorate an Apex method with `cacheable=true`:

1. **HTTP/Client-Level Optimization:** It flags the transaction as **read-only**. Salesforce routes the request through the client-side Lightning Data Service (LDS) cache and browser cache.
2. **Idempotency Guarantee:** Salesforce guarantees that calling the method with identical input parameters yields identical results. If the parameters match an active cache entry, **no server call is made**.
3. **Requirement for `@wire`:** Only methods decorated with `cacheable=true` can be consumed via the `@wire` adapter.
4. **DML Prohibition:** Any attempt to perform DML (`insert`, `update`, `delete`, `Database.insert`, etc.) inside a `cacheable=true` method throws an unrecoverable runtime exception:
```
System.AsyncException: DML currently not allowed

```



---

### Imperative Calling with `cacheable=true`

You can call a `cacheable=true` method **imperatively**. Developers frequently choose this hybrid pattern when:

* You need **client-side caching benefits**, but you do **not** want the query to fire automatically on component load (e.g., lazy-loading a dropdown or modal).
* You want to use `async/await` syntax instead of declarative wire handlers.

```javascript
import { LightningElement } from 'lwc';
import getTierConfig from '@salesforce/apex/ConfigController.getTierConfig';

export default class ConfigViewer extends LightningElement {
    tierData;

    // Called on user interaction, not automatically on page render
    async handleExpandSection(event) {
        const selectedTier = event.target.dataset.tier;
        
        // If called multiple times with the same selectedTier, 
        // subsequent invocations pull directly from client cache without hitting Apex!
        this.tierData = await getTierConfig({ tier: selectedTier });
    }
}

```

---

### Cache Invalidation: How to Refresh Stale Data

Because `cacheable=true` stores responses in LDS, the client will serve stale data if database updates occur outside that specific request.

#### 1. Refreshing `@wire` Data with `refreshApex`

`refreshApex()` forces the LDS cache to re-query the server and push new values down to the wired property or function:

```javascript
import { LightningElement, wire } from 'lwc';
import getAccounts from '@salesforce/apex/AccountService.getAccounts';
import { refreshApex } from '@salesforce/apex';

export default class AccountList extends LightningElement {
    wiredAccountsResult; // Retain full provisioned wire object
    accounts;

    @wire(getAccounts)
    wiredAccounts(result) {
        this.wiredAccountsResult = result;
        if (result.data) {
            this.accounts = result.data;
        }
    }

    async handleManualRefresh() {
        // Must pass the entire provisioned object, NOT this.accounts
        await refreshApex(this.wiredAccountsResult);
    }
}

```

#### 2. Refreshing Imperative `cacheable=true` Calls

`refreshApex()` operates exclusively on the provisioned object returned by a `@wire` adapter. If you call a `cacheable=true` method **purely imperatively without an accompanying wire**, `refreshApex()` **cannot** invalidate that cache entry.

* To bust cache imperatively, you must pair the call with standard LDS record notifications via `notifyRecordUpdateAvailable(recordIds)`.

---

### Limitations & Gotchas

* **`refreshApex` Target Trap:** Passing raw returned data (e.g., `refreshApex(this.accounts)`) fails silently or throws an error. You **must** pass the entire reactive response wrapper object (`{ data, error }`).
* **Cache Lifetime & Memory Bounds:** The client-side cache lives in the browser's JavaScript heap for the duration of the single-page application session. It is purged upon browser refresh or tab close, but persists across tab navigations within the Lightning Experience container.
* **Mutating Cached Data in JS:** Data returned from a wired or `cacheable=true` method is **immutable** (`Object.isFrozen() = true`). Attempting to mutate returned records directly (e.g., `res.data[0].Name = 'Test'`) will throw:
```
TypeError: Cannot assign to read only property 'Name' of object

```


* **Fix:** Shallow-copy (`[...result.data]`) or deep-clone (`JSON.parse(JSON.stringify(result.data))`) before manipulating data in JS.



---

### Architectural Decision Rules

* Use **`@wire` + `cacheable=true**` for read-heavy view states that should render automatically when entering the page (e.g., summary metrics, record view header, table initialization).
* Use **Imperative + `cacheable=true**` for read-only lazy queries that only trigger on explicit user action (e.g., opening a sub-tab, searching a large directory on submit).
* Use **Imperative + `cacheable=false**` whenever writing data, orchestrating transactional DML, or reading data that must bypass the client cache on every execution (e.g., payment validation, real-time inventory balances).