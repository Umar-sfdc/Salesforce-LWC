# LWC Loading CSS

`loadScript` cannot be used to load CSS files. To load external CSS stylesheets in Lightning Web Components, you must use **`loadStyle`** from the `lightning/platformResourceLoader` module.

Calling `loadScript` on a `.css` file will attempt to parse it as JavaScript, throwing a syntax error.

---

**Correct API Usage: `loadStyle**`

```javascript
import { LightningElement } from 'lwc';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import ANIMATE_CSS from '@salesforce/resourceUrl/animateCss';
import CUSTOM_BUNDLE from '@salesforce/resourceUrl/myBundleZip';

export default class StyleLoaderExample extends LightningElement {
    isStyleLoaded = false;

    renderedCallback() {
        if (this.isStyleLoaded) {
            return;
        }
        this.isStyleLoaded = true;

        // Standalone CSS file uploaded directly as a Static Resource
        loadStyle(this, ANIMATE_CSS)
            .then(() => {
                console.log('CSS stylesheet loaded successfully');
            })
            .catch((error) => {
                console.error('Error loading CSS:', error);
            });
    }
}

```

---

**Loading CSS and JS Concurrently**

When working with libraries that require both a script and a stylesheet (such as Leaflet, FullCalendar, or Swiper), combine `loadScript` and `loadStyle` using `Promise.all`:

```javascript
renderedCallback() {
    if (this.isInitialized) {
        return;
    }
    this.isInitialized = true;

    Promise.all([
        // Load JS file
        loadScript(this, CUSTOM_BUNDLE + '/library.min.js'),
        // Load companion CSS file
        loadStyle(this, CUSTOM_BUNDLE + '/styles.min.css')
    ])
    .then(() => {
        this.initLibrary();
    })
    .catch((error) => {
        console.error('Failed to load assets:', error);
    });
}

```

---

**Key Details for `loadStyle**`

* **Scope and Encapsulation:** Unlike component-level CSS files (which are scoped exclusively to that component's template via Shadow DOM), CSS loaded via `loadStyle` is injected as a `<link>` or `<style>` element into the document head, meaning its rules can apply globally.
* **Namespacing:** Because the styles enter the global document scope, prefix external CSS class names or target them to specific container classes to avoid unintentionally overriding Salesforce Lightning Design System (SLDS) utility classes.
* **First Argument (`this`):** Both `loadScript` and `loadStyle` require passing `this` (the component instance) as the first parameter so the runtime can associate the asset lifecycle with the component.