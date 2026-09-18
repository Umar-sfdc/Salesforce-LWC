# Salesforce LWC - `:host` Selector

**`:host`** styles the custom element itself from within its own shadow boundary, while **Shared CSS Modules** let you reuse design tokens, resets, and layout patterns across separate components without duplicating code.

---

### Part 1: Deep Dive into `:host`

By default, custom HTML elements like `<c-user-card>` are treated as inline elements (`display: inline`) by browsers, meaning `margin`, `width`, and `height` behave unpredictably unless explicitly defined on the host element.

#### 1. Basic Host Layout

Use `:host` to declare the outer box-model characteristics of your component:

```css
/* userCard.css */
:host {
    display: block; /* Turns <c-user-card> into a block-level container */
    width: 100%;
    margin-bottom: 1rem;
    box-sizing: border-box;
}

```

#### 2. Conditional Styling via Functional Selectors: `:host(selector)`

You can conditionally restyle the host based on **classes**, **attributes**, or **states** applied to the custom tag itself.

```css
/* Matches <c-user-card class="is-compact"> */
:host(.is-compact) {
    padding: 0.25rem;
    font-size: 0.8rem;
}

/* Matches <c-user-card variant="warning"> */
:host([variant="warning"]) {
    border-left: 4px solid #fe9339;
    background-color: #fff8e6;
}

/* Matches <c-user-card aria-disabled="true"> */
:host([aria-disabled="true"]) {
    opacity: 0.5;
    pointer-events: none;
}

```

#### 3. Specifying Defaults with Low Specificity

Styles applied via `:host` have **lower specificity** than selectors defined by the parent component on the outside element.

```css
/* Inside child: userCard.css */
:host {
    background-color: white; /* Default fallback */
}

```

```css
/* Inside parent: dashboard.css */
c-user-card {
    background-color: #f3f3f3; /* Wins over child's :host rule */
}

```

*This allows child components to declare sensible baseline layout defaults while leaving external layout overrides open to parent templates.*

---

### Part 2: Shared CSS Modules

In LWC, you cannot use native `@import url("style.css")` inside your CSS files. Instead, Salesforce supports **CSS-only modules**: components that contain only a `.css` file and a `.js-meta.xml` metadata file, with no HTML template.

```
force-app/main/default/lwc/
├── sharedDesignTokens/
│   ├── sharedDesignTokens.css
│   └── sharedDesignTokens.js-meta.xml
└── billingCard/
    ├── billingCard.html
    ├── billingCard.js
    ├── billingCard.css
    └── billingCard.js-meta.xml

```

#### Step 1: Create the Shared CSS Module

Create a folder containing the CSS definitions and metadata.

```css
/* sharedDesignTokens/sharedDesignTokens.css */

/* Utility classes */
.card-elevation-high {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
}

.text-gradient {
    background: linear-gradient(135deg, #0176d3, #1589ee);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

/* Shared Custom Properties / Design Tokens */
:host {
    --brand-accent: #0176d3;
    --border-subtle: #dddbda;
}

```

```xml
<!-- sharedDesignTokens/sharedDesignTokens.js-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>60.0</apiVersion>
    <isExposed>false</isExposed>
</LightningComponentBundle>

```

#### Step 2: Import into Consuming Components

In any standard component's `.css` file, import the shared module using the `c/` namespace:

```css
/* billingCard/billingCard.css */
@import 'c/sharedDesignTokens';

/* Component-specific additions */
:host {
    display: block;
    border: 1px solid var(--border-subtle);
}

.internal-wrapper {
    padding: 1.5rem;
}

```

Now, classes like `.card-elevation-high` and `.text-gradient` are compiled directly into `billingCard`'s shadow scope at build time.

---

### Key Gotchas & Limitations

* **Build-Time Inlining:** Shared CSS modules are not loaded as external stylesheets at runtime; the LWC compiler inlines the imported CSS directly into each component's stylesheet. Large shared CSS bundles will bloat individual bundle sizes if overused.
* **Order of Precedence:** If both the shared CSS and your component's CSS define the same rule, the last one evaluated based on standard cascading rules wins. Place `@import 'c/...';` at the very top of your `.css` file.
* **No Dynamic Imports:** You cannot programmatically switch stylesheets using JavaScript logic or conditional imports.
* **Named Exports Unsupported:** You cannot import specific chunks or cherry-pick selectors; the entire shared stylesheet imports as a single payload.