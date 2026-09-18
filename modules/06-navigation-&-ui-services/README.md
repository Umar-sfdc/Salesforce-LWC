# Navigation & UI Services in LWC

This section covers **client-side routing, interactive user feedback modals, and external asset orchestration in Salesforce Lightning Web Components (LWC)**.

You’ll master how to construct declarative routes across the Lightning container using the **Navigation Service**, how to deliver notifications and promise-based modal dialogs using **Platform UI APIs**, and how to integrate external JavaScript and CSS frameworks securely through **Static Resources**.

## Table of Contents

- [Navigation Service (`lightning/navigation`)](./lightning-navigation-services/README.md)
- [Platform UI Notifications & Dialogs](./platform-ui-notification/README.md)
- [Static Resources & Third-Party Libraries](./static-resources-3rd-party/README.md)

---

## Navigation Service (`lightning/navigation`)

Understand declarative client-side routing, URL resolution, and state preservation across Salesforce application containers.

### Core Topics

- **Navigation Mixin Architecture**: Applying `NavigationMixin` to base components
- **Standard Page Reference Types**:
  - `standard__recordPage` (View, Edit, and Clone actions)
  - `standard__objectPage` (Object Home, List Views, and New record dialogs)
  - `standard__navItemPage` (Custom Lightning Tabs and App Pages)
  - `standard__webPage` (External URLs and relative endpoints)
  - `standard__recordRelationshipPage` (Targeting child related lists)
- **Prepopulating Fields**: Encoding default attributes via `lightning/pageReferenceUtils`
- **State Management & Reading Params**: Subscribing to `@wire(CurrentPageReference)`
- **Accessible Linking**: Generating right-click valid URLs using `NavigationMixin.GenerateUrl`
- **Container Nuances**: Managing navigation behaviors across standard desktop, Lightning Console workspaces, and the Salesforce Mobile App

---

## Platform UI Notifications & Dialogs

Deliver accessible, SLDS-aligned user feedback, confirmation dialogs, and non-modal alert toasts.

### Core Concepts

- **Toast Notifications (`lightning/platformShowToastEvent`)**:
  - Event dispatching via `ShowToastEvent`
  - Visual variants (`success`, `error`, `warning`, `info`)
  - Persistence modes (`dismissable`, `pester`, `sticky`)
  - Dynamic tokens and clickable record links via `messageData`
- **Promise-Based Dialogs**:
  - **Alerts (`lightning/alert`)**: Acknowledgment modals replacing `window.alert()`
  - **Confirmations (`lightning/confirm`)**: Binary decision dialogs replacing `window.confirm()`
  - **Prompt Dialogs (`lightning/prompt`)**: Single-field user input dialogs replacing `window.prompt()`
- **Theming & Variants**: Applying header styling (`theme`) and minimal layouts (`variant="headerless"`)
- **Accessibility & Focus Trapping**: Automated ARIA attributes, keyboard navigation, and focus return policies

---

## Static Resources & Third-Party Libraries

Integrate external stylesheets, media assets, and utility-driven JavaScript libraries cleanly and securely.

### Core Topics

- **Importing Static Assets**: Referencing single files and archives via `@salesforce/resourceUrl`
- **Resource Loading (`lightning/platformResourceLoader`)**: Orchestrating `loadScript` and `loadStyle` inside `renderedCallback()`
- **Execution Lifecycle Guards**: Managing initialization boolean flags to prevent multiple execution loops
- **DOM & Canvas Attachment**: Binding external visualizers (e.g., Chart.js, D3) to Shadow DOM nodes via `this.template.querySelector`
- **Security Sandboxes**: Adhering to Lightning Web Security (LWS) and Lightning Locker DOM restrictions
- **Packaging Constraints**: Managing the 5 MB single-file and 250 MB org-wide static resource limits

---

## Hands-on Practice

Each section includes **theory, practical examples, and in-depth concepts** to help you build resilient, interactive LWC solutions.

For modules that include hands-on exercises, the corresponding `README.md` will clearly mention the **hands-on section at the beginning of the file**.

---

Keep exploring, keep building, and keep learning.