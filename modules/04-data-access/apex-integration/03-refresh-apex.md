# Salesforce Refresh Apex

Passing parameters between JavaScript and Apex requires strict key-matching and handling reactivity correctly. When combined with `refreshApex()`, managing the component's internal state determines whether cache invalidation actually works or fails silently.

---

### Passing Parameters: Wired vs. Imperative

Apex accepts arguments as a single JSON object where every key maps **case-sensitively** to the Apex parameter name.

#### 1. Wired Parameters (Static vs. Dynamic/Reactive)

In a wire adapter, prefixing a string with `$` marks it as **reactive**. Whenever the property changes, the wire service automatically re-executes.

* **Reactive Parameter (`'$searchTerm'`):** The wire waits until the property is defined. When `this.searchTerm` changes, the wire re-fires.
* **Static Parameter (`'searchTerm'` or hardcoded literals):** Evaluated only once at initialization.

```javascript
import { LightningElement, wire } from 'lwc';
import searchContacts from '@salesforce/apex/ContactController.searchContacts';

export default class ContactSearch extends LightningElement {
    searchTerm = 'Acme';
    maxLimit = 10;

    // '$searchTerm' is reactive; maxLimit passed directly is evaluated once
    @wire(searchContacts, { searchKey: '$searchTerm', recordLimit: '$maxLimit' })
    wiredContacts;

    handleSearchChange(event) {
        // Automatically triggers the wire to re-run
        this.searchTerm = event.target.value; 
    }
}

```

#### 2. Imperative Parameters

Pass the parameters inside an object as the single argument of the imported function:

```javascript
import { LightningElement } from 'lwc';
import searchContacts from '@salesforce/apex/ContactController.searchContacts';

export default class ContactSearch extends LightningElement {
    async executeSearch(keyword, limit) {
        try {
            // Apex signature: public static List<Contact> searchContacts(String searchKey, Integer recordLimit)
            const results = await searchContacts({ 
                searchKey: keyword, 
                recordLimit: limit 
            });
            console.log('Results:', results);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    }
}

```

---

### Deep Dive: Handling Refresh with `refreshApex()`

`refreshApex()` forces the browser's Lightning Data Service (LDS) cache to discard its current snapshot for a specific wire adapter, query the Apex controller afresh, and push new data downstream.

#### The Golden Rule: Store the Provisioned Value, Not the Data

`refreshApex()` accepts **only** the complete immutable response object that was provisioned to the `@wire`. It does **not** accept the resolved `data` array or an imperative Promise.

```javascript
import { LightningElement, wire } from 'lwc';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';
import { refreshApex } from '@salesforce/apex';

export default class AccountTable extends LightningElement {
    // 1. Variable to store the complete wired envelope
    wiredAccountsResult;
    
    // 2. Variable to hold the actual extracted records for the template
    accounts = [];
    error;

    @wire(getAccounts)
    wiredAccounts(result) {
        // Assign the whole provisioned object (contains internal LDS metadata)
        this.wiredAccountsResult = result;

        if (result.data) {
            this.accounts = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.accounts = [];
        }
    }

    async handleManualRefresh() {
        try {
            // PASS THIS: The stored result object
            await refreshApex(this.wiredAccountsResult);
            // Once resolved, wiredAccounts() automatically fires again with new data
        } catch (err) {
            console.error('Failed to refresh cache:', err);
        }
    }
}

```

#### What Happens if You Pass the Wrong Argument?

```javascript
// ❌ FAILS: Cannot pass data array/object directly
await refreshApex(this.accounts); 

// ❌ FAILS: Cannot pass the Apex method itself
await refreshApex(getAccounts); 

// ❌ FAILS: Cannot use on an imperative call
const data = await getAccounts();
await refreshApex(data); 

```

---

### End-to-End Pattern: Wire + Imperative DML + `refreshApex`

The most common real-world architecture pairs a `@wire` (for reading and reactive display) with an **imperative Apex call** (for mutating data with DML), followed by `refreshApex` to immediately refresh the UI.

```javascript
import { LightningElement, wire, api } from 'lwc';
import getOpportunities from '@salesforce/apex/OppController.getOpportunities';
import closeLostOpp from '@salesforce/apex/OppController.closeLostOpp';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class OpportunityManager extends LightningElement {
    @api recordId; // Account Id
    wiredOppsResponse;
    opportunities = [];

    // 1. Wire to fetch data based on Account Id
    @wire(getOpportunities, { accountId: '$recordId' })
    wiredOpps(response) {
        this.wiredOppsResponse = response;
        if (response.data) {
            this.opportunities = response.data;
        }
    }

    // 2. Imperative action executing DML
    async handleCloseLost(event) {
        const oppId = event.target.dataset.id;

        try {
            // Imperative call running DML (cacheable=false in Apex)
            await closeLostOpp({ oppId: oppId });

            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Opportunity marked Close-Lost',
                variant: 'success'
            }));

            // 3. Invalidate wire cache to force a re-fetch of fresh data
            await refreshApex(this.wiredOppsResponse);

        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error updating status',
                message: error.body?.message || error.message,
                variant: 'error'
            }));
        }
    }
}

```

---

### Common Pitfalls & Limitations

* **Parameter Mismatch Behavior:** If an Apex signature expects `(Id accountId)` and your JavaScript passes `{ accId: this.recordId }`, Salesforce will **not** throw a compilation or runtime parameter error; it will execute the method with `accountId = null`.
* **Dynamic Property Type Coercion:** If an Apex method expects an `Integer` or `Decimal`, sending a string like `'10'` from a standard HTML `<lightning-input>` will throw an deserialization exception. Always parse values explicitly before passing (`parseInt()`, `parseFloat()`).
* **Debouncing Reactive Inputs:** If you bind `$searchTerm` to an input element's `onchange` event, the wire triggers on every single keystroke, creating high server call volume. Use a timer-based **debounce function** before setting the reactive property.
* **`refreshApex` with Imperative Calls:** If a method was invoked purely imperatively without `@wire`, `refreshApex()` cannot be used. You must manually invoke the imperative method again to pull new data.