# Salesforce Web Pages

In `lightning/navigation`, navigating to external web addresses or arbitrary URLs is handled using the **`standard__webPage`** PageReference type. This route redirects the browser, launches a new tab, or loads external web resources while honoring Lightning container constraints.

---

### Core Structure of `standard__webPage`

A web page reference requires only a `type` and the target `url` in its `attributes` map:

```javascript
const webPageRoute = {
  type: 'standard__webPage',
  attributes: {
    url: 'https://developer.salesforce.com' // Full URL or relative path
  }
};

```

* **`url`**: The destination URL. It can be an absolute external URL (must include the protocol, e.g., `https://`) or a root-relative path (e.g., `/apex/MyLegacyPage`).

---

### Implementation Patterns

#### 1. Basic Navigation to an External Site

Direct the user to an external domain:

```javascript
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class ExternalLinkExample extends NavigationMixin(LightningElement) {
  navigateToDocs() {
    this[NavigationMixin.Navigate]({
      type: 'standard__webPage',
      attributes: {
        url: 'https://developer.salesforce.com/docs'
      }
    });
  }
}

```

#### 2. Relative URLs (Legacy Visualforce or Static Endpoints)

You can provide root-relative URLs to target non-Lightning endpoints within the same Salesforce instance:

```javascript
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class VisualforceNavigation extends NavigationMixin(LightningElement) {
  navigateToLegacyReport() {
    this[NavigationMixin.Navigate]({
      type: 'standard__webPage',
      attributes: {
        url: '/apex/LegacyBillingExport?format=pdf'
      }
    });
  }
}

```

#### 3. Generating Accessible Anchor Links (`GenerateUrl`)

For best UX and accessibility, render an actual `<a href>` so users can middle-click, right-click, or copy the link:

```javascript
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class WebPageLink extends NavigationMixin(LightningElement) {
  destinationUrl;

  connectedCallback() {
    this.webPageRef = {
      type: 'standard__webPage',
      attributes: {
        url: 'https://trailhead.salesforce.com'
      }
    };

    this[NavigationMixin.GenerateUrl](this.webPageRef)
      .then(url => {
        this.destinationUrl = url;
      });
  }

  handleNavigate(event) {
    event.preventDefault();
    this[NavigationMixin.Navigate](this.webPageRef);
  }
}

```

---

### Behavior Matrix: Desktop vs. Console vs. Mobile

| Environment | Navigation Behavior |
| --- | --- |
| **Standard Lightning Experience** | Navigates the current browser window/tab to the URL. |
| **Lightning Console App** | Opens the external URL in a **new browser tab** rather than replacing the workspace shell. |
| **Salesforce Mobile App** | Opens the URL inside the mobile in-app browser overlay. |
| **Experience Cloud (LWR/Aura)** | Navigates within the browser window or opens externally depending on CSP trusted site settings. |

---

### Developer Tips & Limitations

* **Always Specify Protocols:**
Always include `https://` (or `http://`) for external addresses. Writing `url: '[www.google.com](https://www.google.com)'` will be treated as a relative route within your Salesforce domain (`[https://yourinstance.lightning.force.com/lightning/r/www.google.com](https://yourinstance.lightning.force.com/lightning/r/www.google.com)`) and lead to a 404.
* **CSP & Security Restrictions:**
While `NavigationMixin.Navigate` allows navigating away to external sites, embedding external content inside an `<iframe>` requires configuring **CSP Trusted Sites** and **Cross-Origin Opener Policies (COOP)** in Setup.
* **No Direct Target Attribute:**
Unlike native HTML `<a target="_blank">`, `NavigationMixin.Navigate` does not provide an explicit parameter to force opening in a new window/tab in standard desktop view. If you must guarantee a new tab opens in standard desktop mode, pairing `GenerateUrl` with a native anchor (`<a href={url} target="_blank" rel="noopener noreferrer">`) is the standard practice.
* **Session Parameter Leaks:**
Never append active Salesforce session IDs or auth tokens to external URLs passed into `standard__webPage`.