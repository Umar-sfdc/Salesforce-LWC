# Salesforce LWC Architecture

A Salesforce **Lightning Web Component (LWC)** directly leverages the core web standards you just learned: Custom Elements, Shadow DOM, ES Modules, and DOM Events.

In a Salesforce DX (SFDX) workspace, all components live inside the source directory, following strict folder and naming conventions.

---

### Overall Project Directory

A standard SFDX project puts all metadata inside `force-app/main/default/`. Components live inside the `lwc` folder:

```text
my-salesforce-project/
├── sfdx-project.json
└── force-app/
    └── main/
        └── default/
            ├── classes/           # Apex controllers
            └── lwc/               # All Lightning Web Components live here
                └── userCard/      # One component bundle folder (camelCase)
                    ├── userCard.html
                    ├── userCard.js
                    ├── userCard.js-meta.xml
                    ├── userCard.css
                    └── userCard.svg

```

---

### Strict Naming Rules

* **Bundle folder and file names must match exactly.** If the folder is `userCard`, every file starts with `userCard.` (case-sensitive).
* **CamelCase convention:** Components are written in camelCase (e.g., `userCard`, `accountSummary`).
* **HTML kebab-case mapping:** When referencing a component inside another component's template, Salesforce transforms camelCase into kebab-case, with a `c-` namespace prefix:
```html
<!-- userCard component referenced in another template -->
<c-user-card></c-user-card>

```



---

### The Anatomy of an LWC Bundle

A component bundle can have up to 5 core files. Three are primary, and two are optional.

#### 1. The Template: `userCard.html` (Required)

Every template must be wrapped in a root `<template>` tag. LWC handles compiling this into a Shadow DOM tree automatically.

```html
<template>
  <div class="card">
    <h3>{name}</h3>
    <p>{title}</p>
    <!-- Standard DOM Event handler -->
    <button onclick={handleClick}>Contact</button>
  </div>
</template>

```

#### 2. The Controller: `userCard.js` (Required)

This is an ES Module. Instead of extending `HTMLElement` directly (like raw Custom Elements), you extend `LightningElement` (Salesforce's base class providing reactivity and lifecycle hooks).

```javascript
import { LightningElement, api } from 'lwc';

export default class UserCard extends LightningElement {
  // @api exposes a public property (like a custom HTML attribute)
  @api name = 'Jane Doe';
  @api title = 'Sales Representative';

  handleClick(event) {
    // Dispatching a standard CustomEvent up to a parent
    this.dispatchEvent(new CustomEvent('contactselect', {
      detail: { contactName: this.name }
    }));
  }
}

```

#### 3. The Configuration File: `userCard.js-meta.xml` (Required)

This metadata file tells Salesforce where this component is allowed to appear (e.g., App Pages, Record Pages, Experience Cloud sites) and sets its API version.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>60.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <!-- Makes component available on Lightning Record Pages and App Pages -->
        <target>lightning__RecordPage</target>
        <target>lightning__AppPage</target>
    </targets>
</LightningComponentBundle>

```

> **Important:** If `<isExposed>` is set to `false`, the component can only be used as a child component inside other LWCs and cannot be placed on a page via the Lightning App Builder.

#### 4. The Stylesheet: `userCard.css` (Optional)

Styles placed here are automatically encapsulated within the component's Shadow DOM. They will not bleed into the Salesforce page.

```css
:host {
  display: block;
}

.card {
  border: 1px solid #d8dde6;
  border-radius: 4px;
  padding: 1rem;
  background-color: #ffffff;
}

```

#### 5. The Icon: `userCard.svg` (Optional)

A custom vector icon that represents your component in the Lightning App Builder palette when admins drag and drop it onto pages.

---

### How Your Prior JS Knowledge Maps to LWC

| Standard Web Platform | Salesforce LWC Equivalent |
| --- | --- |
| `class MyElement extends HTMLElement` | `class MyElement extends LightningElement` |
| `customElements.define('my-element', ...)` | Automatically handled by the folder name & `c-` namespace |
| `this.attachShadow({ mode: 'open' })` | Automatic (Synthetic or Native Shadow DOM) |
| `connectedCallback()` / `disconnectedCallback()` | Same names, identical lifecycle roles |
| `getAttribute('name')` / HTML Attributes | Reactive properties decorated with `@api` |
| `this.dispatchEvent(new CustomEvent(...))` | Same standard browser API |