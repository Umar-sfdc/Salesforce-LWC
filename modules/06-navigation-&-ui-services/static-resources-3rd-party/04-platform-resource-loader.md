# LWC Platform Resource Loader

`loadStyle` is the standard Salesforce module used to load external CSS stylesheets dynamically into a Lightning Web Component from a Static Resource.

---

**Method Signature**

```javascript
loadStyle(self, fileUrl): Promise<void>

```

* **`self` (Required):** The component instance (`this`). Passing `this` enables the framework to attach the stylesheet lifecycle to your component.
* **`fileUrl` (Required):** A string representing the path to the CSS file, imported via the `@salesforce/resourceUrl/` scoped module.
* **Returns:** A JavaScript `Promise` that resolves when the stylesheet has downloaded and applied, or rejects if it fails.

---

**1. Basic Implementation**

Upload your `.css` file as a Static Resource (set Cache Control to **Public**), then load it inside `renderedCallback()` behind a guard flag:

```javascript
// customThemedComponent.js
import { LightningElement } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import CUSTOM_THEME from '@salesforce/resourceUrl/customBootstrapTheme';

export default class CustomThemedComponent extends LightningElement {
    isStyleLoaded = false;

    renderedCallback() {
        // Prevent loading the CSS repeatedly on re-renders
        if (this.isStyleLoaded) {
            return;
        }
        this.isStyleLoaded = true;

        loadStyle(this, CUSTOM_THEME)
            .then(() => {
                console.log('Styles loaded and applied successfully');
            })
            .catch(error => {
                console.error('Failed to load stylesheet:', error);
            });
    }
}

```

---

**2. Referencing a CSS File Inside an Archive (.zip)**

When loading stylesheets packaged inside a zipped Static Resource, append the relative path to the resource URL:

```javascript
import { LightningElement } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import VENDOR_BUNDLE from '@salesforce/resourceUrl/vendorBundle';

export default class ZippedStyleExample extends LightningElement {
    isStyleLoaded = false;

    renderedCallback() {
        if (this.isStyleLoaded) return;
        this.isStyleLoaded = true;

        // Path inside the .zip archive
        loadStyle(this, `${VENDOR_BUNDLE}/dist/css/theme.min.css`)
            .then(() => {
                // Styles ready
            })
            .catch(error => {
                console.error('Error loading bundled style:', error);
            });
    }
}

```

---

**Crucial Differences: `loadStyle` vs. Component CSS (`myComponent.css`)**

| Feature | Component CSS (`.css` in bundle) | `loadStyle` from Static Resource |
| --- | --- | --- |
| **Encapsulation** | **Shadow DOM Scoped:** Rules only affect this component's template. | **Document-Level / Global:** Injected into the document `<head>`, bypassing shadow boundaries. |
| **SLDS Overrides** | Cannot easily override parent or sibling SLDS classes outside shadow tree. | **Can** override base styles and utility classes globally across the page. |
| **Cache Handling** | Deployed with component metadata; cleared with org deploys. | Controlled by Salesforce Static Resource caching (Browser & CDN). |
| **Pre-processors** | Native CSS only (or LWC styling hooks). | Supports pre-compiled Sass/Less files generated during external builds. |

---

**Best Practices & Style Leak Prevention**

* **Prefix All Selectors:** Because `loadStyle` applies globally, un-namespaced rules like `h1`, `.btn`, or `.card` will leak and alter standard Salesforce UI or adjacent components. Always wrap external CSS in a specific root selector:
```css
/* Good: Scoped to a container class */
.my-custom-scope .btn-primary {
    background-color: #ff5722;
}

/* Bad: Leaks to all buttons in the page */
.btn-primary {
    background-color: #ff5722;
}

```


* **Always Guard the Load:** Loading stylesheets repeatedly inside `renderedCallback()` without an `isLoaded` flag will inject duplicate `<link>` tags on every state mutation or wire change.
* **Combine with `loadScript` when Necessary:** If a library needs both assets, run them in `Promise.all([loadScript(...), loadStyle(...)])` so your code only initializes when both the logic and the layout are ready.