# Object Home Page

In `lightning/navigation`, object homepages and list views are handled by the **`standard__objectPage`** PageReference type. This route targets the landing area of an SObject rather than an individual record, allowing you to direct users to an object's home dashboard, open a specific list view, or launch a create modal.

---

### Core Structure of `standard__objectPage`

A standard object page reference uses `type`, `attributes`, and optional `state` parameters:

```javascript
const objectPageRef = {
  type: 'standard__objectPage',
  attributes: {
    objectApiName: 'Account', // API name of standard or custom (__c) SObject
    actionName: 'home'        // 'home' | 'list' | 'new'
  },
  state: {
    filterName: 'Recent',     // Used when actionName is 'list'
    nooverride: '1'           // Optional: bypasses admin overrides
  }
};

```

* **`objectApiName`**: The target object API name (e.g., `'Case'`, `'Property__c'`).
* **`actionName`**: The landing action to take on that object:
* `'home'`: Navigates to the Object's home page (shows charts, pinned lists, and summary cards).
* `'list'`: Navigates to a specific or default List View.
* `'new'`: Opens the standard record creation modal for that object.



---

### Implementation Patterns

#### 1. Navigating to the Object Home (`home`)

Directs the user to the object's top-level landing page:

```javascript
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class ObjectHomeExample extends NavigationMixin(LightningElement) {
  navigateToAccountHome() {
    this[NavigationMixin.Navigate]({
      type: 'standard__objectPage',
      attributes: {
        objectApiName: 'Account',
        actionName: 'home'
      }
    });
  }
}

```

#### 2. Navigating to a Specific List View (`list`)

To target a specific list view, provide the `filterName` inside the `state` object. You can pass standard names like `'Recent'`, list developer names, or full 18-character List View IDs:

```javascript
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class ListViewExample extends NavigationMixin(LightningElement) {
  // Navigate to standard Recent list
  navigateToRecentLeads() {
    this[NavigationMixin.Navigate]({
      type: 'standard__objectPage',
      attributes: {
        objectApiName: 'Lead',
        actionName: 'list'
      },
      state: {
        filterName: 'Recent'
      }
    });
  }

  // Navigate to a custom List View by Developer Name
  navigateToOpenCases() {
    this[NavigationMixin.Navigate]({
      type: 'standard__objectPage',
      attributes: {
        objectApiName: 'Case',
        actionName: 'list'
      },
      state: {
        filterName: 'My_Open_Cases' // List View API Name
      }
    });
  }
}

```

#### 3. Opening the Standard "New Record" Dialog (`new`)

Launches the platform creation modal with support for record types and default values:

```javascript
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';

export default class NewRecordExample extends NavigationMixin(LightningElement) {
  navigateToNewContact() {
    const defaultValues = encodeDefaultFieldValues({
      LeadSource: 'Partner Referral'
    });

    this[NavigationMixin.Navigate]({
      type: 'standard__objectPage',
      attributes: {
        objectApiName: 'Contact',
        actionName: 'new'
      },
      state: {
        // Optional: specify recordTypeId if using multiple layouts
        recordTypeId: '012xx000000ABCDAAA',
        defaultFieldValues: defaultValues
      }
    });
  }
}

```

---

### Summary of Attributes & State

| Property | Level | Allowed Values | Usage |
| --- | --- | --- | --- |
| `type` | Root | `'standard__objectPage'` | Declares target as an object-level page. |
| `objectApiName` | `attributes` | Object API name string | Standard object (`'Opportunity'`) or custom (`'Invoice__c'`). |
| `actionName` | `attributes` | `'home'`, `'list'`, `'new'` | Defines the view type or dialog action. |
| `filterName` | `state` | `'Recent'`, Developer Name, or 18-char ID | Specifies the targeted list filter when `actionName: 'list'`. |
| `recordTypeId` | `state` | 18-character ID | Pre-selects the Record Type when `actionName: 'new'`. |
| `defaultFieldValues` | `state` | Encoded string | Prepopulates fields using `encodeDefaultFieldValues`. |
| `nooverride` | `state` | `'1'` | Bypasses admin overrides on the target object action. |

---

### Developer Tips & Limitations

* **Object Home vs. List View Behavior:**
In standard Lightning Experience, navigating to `actionName: 'home'` often lands on the user's pinned list view alongside object intelligence metrics and charts. In Experience Cloud sites, `home` may default straight to the record list depending on template settings.
* **Filter Name Case-Sensitivity:**
Custom list view developer names in `filterName` are case-sensitive. If an invalid `filterName` is passed, Salesforce falls back to the user's default/pinned list view without throwing a breaking error.
* **Right-Click Compatibility:**
Always use `this[NavigationMixin.GenerateUrl](objectPageRef)` when rendering navigation menus or breadcrumbs so users can open list views in new tabs.