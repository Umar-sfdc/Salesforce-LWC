# LWC External URL

In Lightning Web Components, external URLs are navigated using the **`standard__webPage`** PageReference type via `lightning/navigation`, or rendered natively using an HTML anchor tag.

---

### Standard Navigation to an External URL

Use `NavigationMixin` with `type: 'standard__webPage'`. The `url` attribute **must** include the protocol (`https://` or `http://`).

```javascript
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class ExternalUrlNavigation extends NavigationMixin(LightningElement) {
  openExternalSite() {
    this[NavigationMixin.Navigate]({
      type: 'standard__webPage',
      attributes: {
        url: 'https://developer.salesforce.com'
      }
    });
  }
}

```

---

### Opening in a New Tab with `GenerateUrl`

`NavigationMixin.Navigate` navigates within the same window in standard Lightning apps. To allow opening in a new tab (or middle/right-click support), resolve the URL using `NavigationMixin.GenerateUrl` and bind it to a native `<a>` tag:

#### Component JavaScript (`externalLink.js`)

```javascript
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class ExternalLink extends NavigationMixin(LightningElement) {
  targetUrl;

  connectedCallback() {
    this.pageRef = {
      type: 'standard__webPage',
      attributes: {
        url: 'https://help.salesforce.com'
      }
    };

    this[NavigationMixin.GenerateUrl](this.pageRef).then((url) => {
      this.targetUrl = url;
    });
  }

  handleClick(event) {
    // Intercept default navigation if you need custom logging/analytics
    // Otherwise, the anchor's target="_blank" handles the new tab natively
  }
}

```

#### Component Template (`externalLink.html`)

```html
<template>
  <!-- Native accessible anchor with new tab security protections -->
  <a 
    href={targetUrl} 
    target="_blank" 
    rel="noopener noreferrer" 
    class="slds-button slds-button_outline-brand">
    Open Salesforce Help
  </a>
</template>

```

---

### `NavigationMixin` vs. `window.open()`

| Feature | `NavigationMixin` (`standard__webPage`) | `window.open(url, '_blank')` |
| --- | --- | --- |
| **Salesforce Mobile App** | Opens inside the mobile in-app browser overlay without leaving the app. | Often blocked by mobile OS pop-up blockers or breaks mobile container context. |
| **Lightning Console** | Automatically routes cleanly to a new browser tab. | May trigger browser pop-up blockers unless tied directly to an explicit user click event. |
| **Experience Cloud** | Adheres to site security and routing rules. | Bypasses framework lifecycle hooks. |
| **Right-Click Support** | Requires pairing with `GenerateUrl` and an `<a>` tag. | No native anchor support if called inside a generic button handler. |

---

### Essential Watchouts

* **Missing Protocol Error:**
Passing `url: 'google.com'` instead of `url: '[https://google.com](https://google.com)'` causes Salesforce to treat the destination as a relative internal path, resolving incorrectly to `https://<your-instance>[.lightning.force.com/lightning/r/google.com](https://.lightning.force.com/lightning/r/google.com)`.
* **Trusted URLs (CSP):**
If the external URL redirects or loads dynamic resources/frames into Salesforce, ensure the domain is added to **Setup > Trusted URLs** (Content Security Policy) to avoid script or network blocks.
* **Security Best Practice:**
Always include `rel="noopener noreferrer"` whenever launching external links in a new tab to prevent the target page from accessing your window object via `window.opener`.