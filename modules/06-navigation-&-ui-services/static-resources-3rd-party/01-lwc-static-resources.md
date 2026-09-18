# Salesforce Static Resources 
In Lightning Web Components, static assets (images, stylesheets, fonts) and external JavaScript or CSS libraries (such as Chart.js, D3, Leaflet, or Lodash) are managed using **Static Resources** and loaded client-side via the **`lightning/platformResourceLoader`** module.

---

### Importing and Loading Static Assets

Integrating an external library or asset involves two steps:

1. Importing the resource reference using `@salesforce/resourceUrl/<resourceName>`.
2. Loading the script or stylesheet via `loadScript` or `loadStyle` inside `renderedCallback()`.

```javascript
import { LightningElement } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import CHART_JS from '@salesforce/resourceUrl/ChartJs';
import CUSTOM_STYLES from '@salesforce/resourceUrl/MyCustomStyles';

export default class ChartComponent extends LightningElement {
  chartInitialized = false;

  renderedCallback() {
    // Prevent reloading on subsequent re-renders
    if (this.chartInitialized) {
      return;
    }
    this.chartInitialized = true;

    // Load scripts and stylesheets concurrently
    Promise.all([
      loadScript(this, CHART_JS),
      // For ZIP archives: loadScript(this, CHART_JS + '/Chart.bundle.min.js'),
      loadStyle(this, CUSTOM_STYLES)
    ])
      .then(() => {
        this.initializeChart();
      })
      .catch((error) => {
        console.error('Error loading library:', error);
      });
  }

  initializeChart() {
    // The library attaches to window or globally once loaded
    const ctx = this.template.querySelector('canvas.chart');
    new window.Chart(ctx, {
      type: 'bar',
      data: { /* ... */ }
    });
  }
}

```

---

### Working with Archives (ZIP Files)

When uploading bundled libraries, nested CSS, or images in a single `.zip` static resource, append the subpath string to the imported reference:

```javascript
import LEAFLET_ZIP from '@salesforce/resourceUrl/LeafletZip';

// Path addressing inside the archive:
const leafletScript = LEAFLET_ZIP + '/leaflet.js';
const leafletStyle = LEAFLET_ZIP + '/leaflet.css';

Promise.all([
  loadScript(this, leafletScript),
  loadStyle(this, leafletStyle)
]);

```

To display an image stored inside a ZIP file in an HTML template:

```javascript
import LOGO_ASSETS from '@salesforce/resourceUrl/CompanyLogos';

export default class BrandHeader extends LightningElement {
  brandLogo = LOGO_ASSETS + '/images/main-logo.png';
}

```

```html
<template>
  <img src={brandLogo} alt="Company Brand Logo" />
</template>

```

---

### Core Module API: `lightning/platformResourceLoader`

| Method | Parameters | Returns | Usage |
| --- | --- | --- | --- |
| `loadScript(self, fileUrl)` | `self`: Component instance (`this`), `fileUrl`: String URL | `Promise<void>` | Loads external JavaScript files and executes them in component scope. |
| `loadStyle(self, fileUrl)` | `self`: Component instance (`this`), `fileUrl`: String URL | `Promise<void>` | Injects external stylesheets into the component's styling context. |

---

### Best Practices

* **Always Guard the Load Call:**
Because `renderedCallback()` runs multiple times across a component’s lifecycle (after every reactive property change), use a boolean flag (`this.isLibLoaded`) to ensure scripts only download and initialize once.
* **Canvas and DOM Targets:**
Always query the DOM using `this.template.querySelector()` inside `.then()` *after* the loader promise resolves, guaranteeing both the library and the DOM nodes exist before initialization.
* **Use Minified Production Builds:**
Upload `.min.js` and `.min.css` variants to minimize download times and avoid hitting browser parser overhead.

---

### Limitations & Security Constraints

* **Lightning Locker & Lightning Web Security (LWS):**
External libraries execute within client-side sandboxes:
* **LWS:** Allows broader modern JavaScript compatibility, but still restricts unsafe window/document tampering.
* **Lightning Locker (if LWS is disabled):** Restricts access to standard DOM nodes outside the component’s Shadow root, restricts `eval()`, and wraps global objects like `window` and `document` into `SecureWindow` and `SecureDocument`. Libraries that attempt to inspect or modify parent frame elements will fail.


* **No DOM Manipulation Libraries:**
Avoid libraries that hijack or manage the entire DOM tree (such as full jQuery suites or React runtimes). They conflict directly with LWC’s virtual DOM engine. Restrict third-party libraries strictly to UI utilities (e.g., plotting engines, canvas visualizers, or date parsers).
* **Static Resource Size Caps:**
Salesforce imposes a **5 MB** single-file static resource limit and a **250 MB** total org-wide static resource storage cap.
* **No External CDN `<script>` Tags:**
Directly injecting `<script src="[https://cdn.example.com/lib.js](https://cdn.example.com/lib.js)">` in templates is strictly blocked by Salesforce CSP. All third-party libraries must be uploaded directly as Salesforce Static Resources.