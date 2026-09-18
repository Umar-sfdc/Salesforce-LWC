# Salesforce Lightning Navigation

The `lightning/navigation` module provides a declarative, client-side routing service in Lightning Web Components. Instead of hardcoding URLs (which can change across Salesforce releases or container contexts), it uses a structured JavaScript object called a **`PageReference`** to handle routing, deep-linking, and URL generation.

---

### Core Mechanics

To enable navigation in an LWC:

1. Import `NavigationMixin` and apply it to the `LightningElement` base class.
2. Dispatch transitions using `this[NavigationMixin.Navigate](pageReference, [replace])`.
3. Generate raw link URLs using `this[NavigationMixin.GenerateUrl](pageReference)` to support standard `<a href>` right-click behaviors.
4. Read current page routing details and query parameters using `@wire(CurrentPageReference)`.

---

### Implementation Examples

#### 1. Navigating to Record Pages (View, Edit, or Clone)

```javascript
import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class RecordNavigationExample extends NavigationMixin(LightningElement) {
  @api recordId;

  // View existing record
  navigateToViewAccount() {
    this[NavigationMixin.Navigate]({
      type: 'standard__recordPage',
      attributes: {
        recordId: this.recordId,
        objectApiName: 'Account',
        actionName: 'view' // 'view', 'edit', or 'clone'
      }
    });
  }

  // Edit existing record
  navigateToEditAccount() {
    this[NavigationMixin.Navigate]({
      type: 'standard__recordPage',
      attributes: {
        recordId: this.recordId,
        objectApiName: 'Account',
        actionName: 'edit'
      }
    });
  }
}

```

#### 2. Creating New Records with Prepopulated Fields

To set default field values when navigating to a new record modal, use `encodeDefaultFieldValues` from `lightning/pageReferenceUtils`:

```javascript
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';

export default class CreateRecordExample extends NavigationMixin(LightningElement) {
  navigateToCreateContact() {
    const defaultValues = encodeDefaultFieldValues({
      FirstName: 'Jane',
      LastName: 'Doe',
      LeadSource: 'Web'
    });

    this[NavigationMixin.Navigate]({
      type: 'standard__objectPage',
      attributes: {
        objectApiName: 'Contact',
        actionName: 'new'
      },
      state: {
        defaultFieldValues: defaultValues
      }
    });
  }
}

```

#### 3. Navigating to Custom Tabs, List Views, and External Sites

```javascript
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class GeneralNavigationExample extends NavigationMixin(LightningElement) {
  // Custom Tab (standard__navItemPage)
  navigateToTab() {
    this[NavigationMixin.Navigate]({
      type: 'standard__navItemPage',
      attributes: {
        apiName: 'Custom_Dashboard_Tab' // Developer Name of the Custom Tab
      }
    });
  }

  // Object List View (standard__objectPage)
  navigateToRecentCases() {
    this[NavigationMixin.Navigate]({
      type: 'standard__objectPage',
      attributes: {
        objectApiName: 'Case',
        actionName: 'list'
      },
      state: {
        filterName: 'Recent' // or 18-char ListView ID
      }
    });
  }

  // External Web Page (standard__webPage)
  navigateToExternal() {
    this[NavigationMixin.Navigate]({
      type: 'standard__webPage',
      attributes: {
        url: 'https://developer.salesforce.com'
      }
    });
  }
}

```

#### 4. Generating URLs for Accessible Links (`GenerateUrl`)

Always provide an actual `href` for links so users can right-click to "Open in new tab" or copy link address:

```javascript
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class AccessibleLinkExample extends NavigationMixin(LightningElement) {
  accountListUrl;

  connectedCallback() {
    this.accountPageRef = {
      type: 'standard__objectPage',
      attributes: {
        objectApiName: 'Account',
        actionName: 'list'
      },
      state: {
        filterName: 'AllAccounts'
      }
    };

    // Resolves to the browser-valid URL string
    this[NavigationMixin.GenerateUrl](this.accountPageRef)
      .then(url => {
        this.accountListUrl = url;
      });
  }

  handleClick(event) {
    event.preventDefault(); // Prevent standard browser full-page reload
    this[NavigationMixin.Navigate](this.accountPageRef);
  }
}

```

---

### Common PageReference Types Summary

| `type` | Required Attributes | Common `state` Parameters |
| --- | --- | --- |
| `standard__recordPage` | `recordId`, `actionName` (`view`/`edit`/`clone`), `objectApiName` | `nooverride` |
| `standard__objectPage` | `objectApiName`, `actionName` (`home`/`list`/`new`) | `filterName`, `defaultFieldValues` |
| `standard__recordRelationshipPage` | `recordId`, `relationshipApiName`, `actionName` (`view`) | — |
| `standard__navItemPage` | `apiName` (Custom Tab name) | Query parameters as key-value pairs |
| `standard__component` | `componentName` (`c__myComponent`) | Any custom state passed to the target component |
| `standard__webPage` | `url` | — |
| `standard__knowledgeArticlePage` | `urlName`, `articleType` | — |

---

### Developer Tips

* **History Manipulation with `replace: true`:**
When navigating from temporary wizards or intermediary dialogs, call `this[NavigationMixin.Navigate](pageRef, true)`. This replaces the current history entry so hitting the browser "Back" button skips the intermediate screen.
* **Avoid `window.location.href`:**
Hardcoding URL strings breaks across sandboxes, custom domains, Experience Cloud sites, and Lightning Console tabs. Always construct a `PageReference`.
* **Navigating to Custom LWCs:**
To navigate directly to a target LWC using `standard__component`, the target component must define the `lightning__UrlAddressable` capability in its `.js-meta.xml` metadata.
* **Accessing Route Parameters:**
To read URL parameters in the destination component, wire `CurrentPageReference` and inspect `this.pageRef.state`.

---

### Limitations

* **Lightning Out / Standalone Apps:**
`NavigationMixin` relies on the Lightning Experience shell / one.app container; it is **not supported** in standalone Visualforce (`lightning:use`) or classic Lightning Out applications.
* **Console Workspace Behaviors:**
In Lightning Console apps, `NavigationMixin.Navigate` opens pages according to standard routing rules, which may open a subtab instead of a new workspace tab. Granular workspace control (such as splitting tabs or focusing specific subtabs) requires the **Console Workspace API** (`lightning/platformWorkspaceApi`).
* **Experience Cloud Differences:**
Not all `PageReference` types or actions are supported in Aura/LWR Digital Experience sites (e.g., standard record `clone` actions are unsupported in Experience Builder sites).
* **Static Context Invalidation:**
`GenerateUrl` promises can fail or resolve to `#` if called when the component is unmounted or if the container does not recognize the target route schema.