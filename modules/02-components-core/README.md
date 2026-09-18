# Salesforce Component Core

This section covers the **essential internal mechanics of Salesforce Lightning Web Components (LWC)**.

You’ll master how data flows reactively within a component, how the framework manages a component's birth-to-destruction cycle, how to define clean public interfaces, and how to compose elements flexibly using the Shadow DOM and slots.

## Table of Contents

- [Reactivity & Data Binding](./reactivity-&-data-binding/README.md)
- [Lifecycle Hooks](./life-cycle-hooks/README.md)
- [Properties and Public API](./properties-&-public-api/README.md)
- [DOM & Slot Propagation](./dom-slot-propogation/README.md)

---

## Reactivity & Data Binding

Understand how the LWC engine tracks state changes, optimizes renders, and syncs data to the template.

### Core Topics

- One-way Data Binding (`{property}` syntax)
- Primitive vs. Complex Reactivity (Objects and Arrays)
- Deep Reactivity (`@track` vs. mutating object references)
- Getters for Computed Properties
- Template Directives (`lwc:if`, `lwc:elseif`, `lwc:else`, and `for:each`)

---

## Lifecycle Hooks

Learn the exact order of execution and best practices for running logic at every stage of a component's existence.

### Core Concepts

- `constructor()` — Initialization & constraints
- `connectedCallback()` — Flow entry, DOM insertion, and event listeners
- `renderedCallback()` — Post-render DOM interactions and infinite loop traps
- `disconnectedCallback()` — Cleanup and teardown
- `errorCallback(error, stack)` — Boundary error handling

---

## Properties and Public API

Design robust, reusable components with well-defined contracts for parent-child communication.

### Core Topics

- Public Properties (`@api`)
- Contextual Properties (`@api recordId`, `@api objectApiName`)
- Public Methods (Exposing functionality via `@api myMethod()`)
- Getters and Setters (`get` / `set`) for intercepting property mutations
- Boolean Attribute Norms and Casting Rules

---

## DOM & Slot Propagation

Master DOM access boundaries, slotted content, and how events travel across the component tree.

### Core Topics

- Shadow DOM Querying (`this.template.querySelector` vs. `this.querySelector`)
- Slots: Default, Named, and Conditional Slots
- Slot Content Distribution & Styling Scopes
- Event Dispatching (`CustomEvent`)
- Event Propagation: `bubbles` and `composed` flags across the Shadow Boundary

---

## Hands-on Practice

Each section includes **theory, practical examples, and in-depth concepts** to help you build a solid foundation in core LWC development.

---

Keep exploring, keep building, and keep learning.
