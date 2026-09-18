# LWC Load 3rd party Library

Loading external JavaScript libraries in Lightning Web Components (LWC) is handled via the **`lightning/platformResourceLoader`** module.

Because LWC enforces Lightning Locker Service / Lightning Web Security (LWS) and uses strict Content Security Policies (CSP), you cannot use `<script src="...">` tags. Instead, libraries must be uploaded as **Static Resources** and loaded asynchronously in your component's JavaScript.

---

**Step 1: Upload the Library as a Static Resource**

1. Download the production `.js` file or `.zip` archive (e.g., `chartjs.zip` containing `chart.min.js`).
2. In Salesforce Setup, navigate to **Static Resources** -> click **New**.
3. Set the **Name** (e.g., `chartJsLibrary`).
4. Set **Cache Control** to **Public** for optimal browser caching and performance.
5. Upload the file and save.

---

**Step 2: Import Modules in Your LWC**

Import the static resource URL using the `@salesforce/resourceUrl/` scoped module, and import `loadScript` (or `loadStyle` for CSS) from `lightning/platformResourceLoader`.

```javascript
import { LightningElement } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import CHART_JS from '@salesforce/resourceUrl/chartJsLibrary';

```

---

**Step 3: Load the Script in `renderedCallback()**`

External scripts must be loaded inside **`renderedCallback()`** rather than `connectedCallback()`. This ensures the DOM container elements are fully painted before the third-party library attempts to manipulate them.

Use a boolean guard flag (e.g., `isLibraryLoaded`) to prevent the script from re-loading every time the component re-renders.

```javascript
// externalChartExample.js
import { LightningElement } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import CHART_JS from '@salesforce/resourceUrl/chartJsLibrary';

export default class ExternalChartExample extends LightningElement {
    isLibraryLoaded = false;
    chartInstance = null;

    renderedCallback() {
        // Guard clause: ensure script only loads once
        if (this.isLibraryLoaded) {
            return;
        }
        this.isLibraryLoaded = true;

        // For a zipped resource: `${CHART_JS}/path/to/file.js`
        // For a single JS file uploaded directly: CHART_JS
        loadScript(this, CHART_JS + '/Chart.min.js')
            .then(() => {
                this.initializeExternalLibrary();
            })
            .catch((error) => {
                console.error('Failed to load the external script:', error);
            });
    }

    initializeExternalLibrary() {
        // Target canvas or container within Shadow DOM
        const canvas = this.template.querySelector('canvas.my-chart');
        
        // Third-party library globals attach to window in LWS/Locker
        this.chartInstance = new window.Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar'],
                datasets: [{ data: [12, 19, 3] }]
            }
        });
    }
}

```

```html
<!-- externalChartExample.html -->
<template>
    <lightning-card title="External Library Integration">
        <div class="slds-p-around_medium" lwc:dom="manual">
            <!-- Canvas targeted by the library -->
            <canvas class="my-chart"></canvas>
        </div>
    </lightning-card>
</template>

```

---

**Step 4: Loading Multiple Scripts in Parallel**

If a library requires multiple files or depends on companion stylesheets (e.g., Leaflet or D3 modules), load them concurrently using `Promise.all`:

```javascript
import { LightningElement } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import LEAFLET from '@salesforce/resourceUrl/leafletLibrary';

export default class LeafletMap extends LightningElement {
    isLoaded = false;

    renderedCallback() {
        if (this.isLoaded) return;
        this.isLoaded = true;

        Promise.all([
            loadScript(this, LEAFLET + '/leaflet.js'),
            loadStyle(this, LEAFLET + '/leaflet.css')
        ])
        .then(() => {
            this.initMap();
        })
        .catch(error => {
            console.error('Error loading Leaflet assets', error);
        });
    }
}

```

---

**Critical Rules & Best Practices**

* **Direct DOM Manipulation with `lwc:dom="manual"`:**
LWC uses Shadow DOM. Many third-party libraries (like D3, jQuery, or canvas engines) attempt to append or modify DOM elements directly. To allow an external script to mutate child elements without breaking LWC's shadow engine, add the `lwc:dom="manual"` directive to the parent container element.
* **LWS / Locker Compliance:**
Libraries that perform unsafe DOM traversal (like reaching outside the component boundary into `document.body` directly) or use `eval()` will be restricted by Lightning Web Security (LWS) or Lightning Locker. Use clean, modular versions of libraries that attach strictly to a provided root node.
* **Never Load via CDN:**
Due to Salesforce's strict Content Security Policy (CSP), attempting to load scripts from arbitrary external CDN URLs via dynamic `<script>` injection will fail unless trusted sites/CSP settings allow it. Static Resources are the standard and secure delivery mechanism.