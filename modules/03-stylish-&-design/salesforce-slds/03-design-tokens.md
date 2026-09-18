# Salesforce SLDS Design Tokens

In Salesforce Lightning Web Components (LWC), CSS Custom Properties (variables) pierce the Shadow DOM boundary by standard CSS inheritance rules, making them the primary architecture for cross-component theming and branding.

---

### How Theming Works in Salesforce

Salesforce implements two layers of CSS custom properties:

1. **Global Tokens / Styling Hooks (`--slds-g-*`):** Brand-level variables defined at the application root for global colors, fonts, and elevation.
2. **Component Styling Hooks (`--slds-c-*` or `--sds-c-*`):** Placeholders inside Salesforce base components (e.g., `lightning-button`, `lightning-card`) allowing external customization without breaking encapsulation.

```css
/* myThemeContainer.css */
:host {
  /* 1. Target standard base components inside your LWC */
  --slds-c-button-brand-color-background: #008080;
  --slds-c-button-brand-color-border: #008080;
  --slds-c-card-color-background: #f8fafc;

  /* 2. Expose your own theme tokens for child components */
  --custom-brand-primary: #008080;
  --custom-brand-contrast: #ffffff;
}

```

---

### Key Theming Architecture Patterns

| Pattern | Implementation | Purpose |
| --- | --- | --- |
| **Exposing Custom Hooks** | `var(--my-theme-color, #1e293b)` | Allows parent components or Experience Cloud sites to inject brand colors while keeping local defaults. |
| **Dynamic JS Theming** | `this.template.host.style.setProperty()` | Changes themes dynamically at runtime based on record data, user roles, or tenant configuration. |
| **Dark / High-Contrast Themes** | `:host([data-theme="dark"])` | Swaps out sets of custom property values based on an attribute toggle. |
| **Cascading Themes** | Defined on parent `:host` | Variables automatically cascade through nested shadow trees to all child LWCs. |

---

### Exposing Your Own Component Hooks

Always supply a fallback value when consuming a custom variable. This guarantees your component looks complete in isolation while allowing upstream consumers to customize it.

```css
/* customCard.css */
.card-wrapper {
  /* var(--variable-name, fallback-value) */
  background-color: var(--custom-card-bg, #ffffff);
  border: 1px solid var(--custom-card-border-color, #e2e8f0);
  border-radius: var(--custom-card-radius, 8px);
  color: var(--custom-card-text-color, #1e293b);
}

```

A consuming parent can re-theme that component without touching its internal DOM:

```css
/* parentContainer.css */
c-custom-card {
  --custom-card-bg: #1e1e2f;
  --custom-card-border-color: #3b3b54;
  --custom-card-text-color: #f1f5f9;
  --custom-card-radius: 16px;
}

```

---

### Tips & Tricks

* **Runtime Theming via JavaScript:** Change custom properties on the fly without triggering template re-renders by setting inline properties directly on `:host`:
```javascript
// myComponent.js
applyBrandColor(hexCode) {
  this.template.host.style.setProperty('--slds-c-button-brand-color-background', hexCode);
  this.template.host.style.setProperty('--custom-brand-primary', hexCode);
}

```


* **Never Target Internal SLDS Classes:** Do not attempt `.slds-button_brand { background: purple; }`. It fails under native shadow DOM and is treated as an anti-pattern that breaks during Salesforce release updates. Use `--slds-c-button-*` hooks instead.
* **Namespace Your Custom Variables:** Avoid generic names like `--background-color` or `--primary`. Use a company or project prefix (e.g., `--acme-color-brand-primary`) to prevent collisions with SLDS or other AppExchange packages.
* **SLDS 1 vs. SLDS 2 / Cosmos Considerations:** Component-level styling hooks (`--slds-c-*`) are primarily tied to SLDS 1 component blueprints. In newer Salesforce Cosmos / SLDS 2 themes, Salesforce emphasizes global design tokens (`--slds-g-*`) over component-specific overrides.
* **Handle Design-Time Customization in Experience Builder:** Expose string/color properties in your component’s `.js-meta.xml`:
```xml
<property name="headerColor" type="Color" label="Header Color" default="#0070d2"/>

```


Map that `@api headerColor` property to your host element's CSS custom property in `renderedCallback()`. This lets non-technical admins theme the component using the Experience Builder GUI.
* **Chain Variables with Fallbacks:** You can chain CSS custom properties to implement multi-tiered fallback cascades:
```css
.badge {
  /* Uses component hook -> falls back to brand global -> falls back to static hex */
  background-color: var(--custom-badge-bg, var(--slds-g-color-brand-base-50, #0176d3));
}

```