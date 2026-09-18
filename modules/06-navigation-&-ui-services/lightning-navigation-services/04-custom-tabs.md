# LWC Custom Tabs

In `lightning/navigation`, routing to custom tabs is handled by the **`standard__navItemPage`** PageReference type. This route targets any custom tab defined in Salesforce Setup—including **Lightning Component Tabs**, **Lightning Page Tabs (App Pages)**, and **Web Tabs**.

---

### Core Structure of `standard__navItemPage`

A custom tab page reference requires `type`, `attributes`, and an optional `state` map for passing query parameters:

```javascript
const tabPageRoute = {
  type: 'standard__navItemPage',
  attributes: {
    apiName: 'Custom_Dashboard' // The Developer Name (API Name) of the custom tab
  },
  state: {
    // Optional custom query parameters (key-value strings)
    c__viewMode: 'analytics',
    c__filterId: '001xx000003DGbI'
  }
};

```

* **`apiName`**: The unique **Developer Name** of the custom tab (found in **Setup > Custom Tabs**). Do **not** use the tab's UI label.
* **`state`**: Optional key-value query parameters appended to the URL. Parameter keys must use the **`c__` namespace prefix** to avoid collision with standard Salesforce URL parameters.

---

### Implementation Patterns

#### 1. Basic Navigation to a Custom Tab

```javascript
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class TabNavigationExample extends NavigationMixin(LightningElement) {
  navigateToAnalyticsTab() {
    this[NavigationMixin.Navigate]({
      type: 'standard__navItemPage',
      attributes: {
        apiName: 'Executive_Analytics' // API name of the target tab
      }
    });
  }
}

```

#### 2. Passing URL Parameters to a Custom Tab

Pass parameters under the `state` property using the `c__` prefix:

```javascript
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class ParameterizedTabNavigation extends NavigationMixin(LightningElement) {
  navigateToFilteredDashboard(filterType, period) {
    this[NavigationMixin.Navigate]({
      type: 'standard__navItemPage',
      attributes: {
        apiName: 'Financial_Reports'
      },
      state: {
        c__reportType: filterType,
        c__fiscalPeriod: period
      }
    });
  }
}

```

#### 3. Reading Parameters on the Destination Component

On the target Lightning Web Component embedded within that tab, wire **`CurrentPageReference`** from `lightning/navigation` to read the state parameters:

```javascript
import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';

export default class TargetTabComponent extends LightningElement {
  reportType;
  fiscalPeriod;

  @wire(CurrentPageReference)
  getStateParameters(currentPageReference) {
    if (currentPageReference?.state) {
      // Access passed state attributes
      this.reportType = currentPageReference.state.c__reportType;
      this.fiscalPeriod = currentPageReference.state.c__fiscalPeriod;
    }
  }
}

```

#### 4. Generating Accessible Tab URLs (`GenerateUrl`)

To allow users to right-click or middle-click and open the custom tab in a new browser tab:

```javascript
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class AccessibleTabLink extends NavigationMixin(LightningElement) {
  tabUrl;

  connectedCallback() {
    this.tabRef = {
      type: 'standard__navItemPage',
      attributes: {
        apiName: 'Compliance_Checklist'
      }
    };

    this[NavigationMixin.GenerateUrl](this.tabRef)
      .then(url => {
        this.tabUrl = url;
      });
  }

  handleNavigate(event) {
    event.preventDefault(); // Intercept default browser reload
    this[NavigationMixin.Navigate](this.tabRef);
  }
}

```

---

### Reference Summary

| Property | Level | Allowed Values | Usage |
| --- | --- | --- | --- |
| `type` | Root | `'standard__navItemPage'` | Directs route to a custom Salesforce tab. |
| `apiName` | `attributes` | Tab Developer Name | Found under Setup > Custom Tabs (e.g., `'Project_Hub'`). |
| `c__<param>` | `state` | String key-value pairs | Custom parameters passed via query string. |

---

### Developer Tips & Limitations

* **App Context Awareness:**
The target custom tab must either be included in the navigation bar of the user's current Lightning App, or accessible via the App Launcher. If the user's profile lacks tab visibility or app permissions, navigation will land on a 404 or default home view.
* **Namespace Rule for State (`c__`):**
Salesforce strips or ignores custom state keys that do not begin with `c__` (or your managed package namespace followed by `__`). Always write `c__myParam: 'value'`.
* **Standard Tabs Not Supported:**
`standard__navItemPage` is strictly for **Custom Tabs**. You cannot use it to navigate to standard objects (e.g., using `apiName: 'Account'` will fail; use `standard__objectPage` instead).
* **Console Workspace Behaviors:**
In Lightning Console apps, navigating to a custom tab opens it as a top-level workspace tab. To nest a component or sub-view under an existing workspace tab, use `lightning/platformWorkspaceApi`.