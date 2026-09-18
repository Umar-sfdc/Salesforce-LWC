# LWC PageReferance

Page references to standard records are defined using the **`standard__recordPage`** type in `lightning/navigation`. This `PageReference` pattern targets an individual record instance to display its detail page, open its edit modal, or trigger its cloning workflow.

---

### Core Structure of `standard__recordPage`

A record page reference requires a `type`, an `attributes` map, and an optional `state` map:

```javascript
const recordPageRef = {
  type: 'standard__recordPage',
  attributes: {
    recordId: '001xx000003DGbIAAW', // 15- or 18-character Salesforce Id
    objectApiName: 'Account',       // API Name of the target SObject
    actionName: 'view'              // 'view' | 'edit' | 'clone'
  },
  state: {
    nooverride: '1'                 // Optional: bypass standard action overrides
  }
};

```

* **`recordId`**: The specific record's identifier.
* **`objectApiName`**: The SObject API name (e.g., `Contact`, `Custom_Object__c`). While Salesforce can infer the object from the ID prefix in some environments, providing `objectApiName` is strongly recommended for routing performance and Experience Cloud compatibility.
* **`actionName`**: The specific action to initiate. Supported standard actions are:
* `'view'`: Opens the record's main detail page.
* `'edit'`: Opens the standard edit modal/page for the record.
* `'clone'`: Opens the standard create modal prepopulated with the target record's field values.



---

### Implementation Patterns

#### 1. Navigating to the Record Detail Page (`view`)

Direct the user to the record's full layout:

```javascript
import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class ViewRecordExample extends NavigationMixin(LightningElement) {
  @api recordId; // e.g., Passed from a parent or Lightning page context

  handleView() {
    this[NavigationMixin.Navigate]({
      type: 'standard__recordPage',
      attributes: {
        recordId: this.recordId,
        objectApiName: 'Opportunity',
        actionName: 'view'
      }
    });
  }
}

```

#### 2. Triggering the Record Edit Modal (`edit`)

Launches the standard edit screen. Once the user saves or cancels, they remain on the current page or return to the record detail view:

```javascript
import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class EditRecordExample extends NavigationMixin(LightningElement) {
  @api recordId;

  handleEdit() {
    this[NavigationMixin.Navigate]({
      type: 'standard__recordPage',
      attributes: {
        recordId: this.recordId,
        objectApiName: 'Contact',
        actionName: 'edit'
      }
    });
  }
}

```

#### 3. Standard Record Cloning (`clone`)

Opens the standard creation modal initialized with the field values of the original record:

```javascript
import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class CloneRecordExample extends NavigationMixin(LightningElement) {
  @api recordId;

  handleClone() {
    this[NavigationMixin.Navigate]({
      type: 'standard__recordPage',
      attributes: {
        recordId: this.recordId,
        objectApiName: 'Opportunity',
        actionName: 'clone'
      }
    });
  }
}

```

#### 4. Bypassing Action Overrides (`nooverride`)

If an org has a Visualforce page, Aura component, or custom LWC configured in **Object Manager > Buttons, Links, and Actions** overriding the `View` or `Edit` button, you can bypass that override and force the standard Salesforce layout using the `nooverride` state property:

```javascript
this[NavigationMixin.Navigate]({
  type: 'standard__recordPage',
  attributes: {
    recordId: this.recordId,
    objectApiName: 'Account',
    actionName: 'view'
  },
  state: {
    nooverride: '1' // '1' forces the standard page instead of the custom override
  }
});

```

---

### Related: Navigating to Related Lists (`standard__recordRelationshipPage`)

To navigate to a child list attached to a record (rather than the record itself), use the related relationship page reference:

```javascript
this[NavigationMixin.Navigate]({
  type: 'standard__recordRelationshipPage',
  attributes: {
    recordId: this.recordId,
    relationshipApiName: 'Contacts', // Child relationship API name on Account
    actionName: 'view'
  }
});

```

---

### Key Attributes & State Options

| Property | Level | Allowed Values | Description |
| --- | --- | --- | --- |
| `type` | Root | `'standard__recordPage'` | Identifies target route as a single record. |
| `recordId` | `attributes` | 15- or 18-char string | Mandatory record ID. |
| `objectApiName` | `attributes` | Valid Object API Name | SObject identifier (e.g., `Account`, `Invoice__c`). |
| `actionName` | `attributes` | `'view'`, `'edit'`, `'clone'` | Standard action to execute. |
| `nooverride` | `state` | `'1'` | Bypasses admin overrides on the target standard action. |

---

### Best Practices & Watchouts

* **Preserve Native Browser Links:**
When rendering record links in a custom data table or card list, pair `NavigationMixin.GenerateUrl` with an `<a href={url}>` tag. This allows users to middle-click or right-click to open records in new browser tabs.
* **Console App Tab Stacking:**
In Lightning Console apps, navigating with `standard__recordPage` opens the record as a workspace tab or subtab depending on the object's configured navigation rules. If you need it strictly as a subtab under a specific primary tab, use `lightning/platformWorkspaceApi` instead.
* **Action Support in Experience Cloud:**
The `clone` action is **not supported** in Digital Experience (LWR/Aura) sites and will fail silently or throw a navigation error.