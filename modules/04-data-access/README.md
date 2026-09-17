# Salesforce Data Architecture & Backend Integration

This section covers **data retrieval, caching, and server communication in Salesforce Lightning Web Components (LWC)**.

You’ll master how **Lightning Data Service (LDS)** handles client-side data synchronization, how to leverage **`@wire` adapters** for reactive state updates, how to orchestrate **Apex controllers** for complex business logic, and how to query multiple related entities efficiently using the **GraphQL Wire Adapter**.

## Table of Contents

- [Lightning Data Service (LDS)](./lightning-data-services/README.md)
- [@wire Service Architecture](./wire-services/README.md)
- [Apex Integration](./apex-integration/README.md)
- [GraphQL Wire Adapter](./graph-ql-wire-adapter/README.md)

---

## Lightning Data Service (LDS)

Understand the unified client-side data layer that enables shared caching, automatic record synchronization, and offline access.

### Core Topics

- Built-in Record Form Components (`lightning-record-form`, `lightning-record-view-form`, `lightning-record-edit-form`)
- Single Record Operations (`lightning/uiRecordApi`)
- Metadata & Picklists (`lightning/uiObjectInfoApi`)
- List View & Related Record APIs (`lightning/uiListApi`, `lightning/uiRelatedListApi`)
- Client-Side Cache Coherence & `notifyRecordUpdateAvailable`
- Native Offline Synchronization with Briefcase & Mobile Cache

---

## @wire Service Architecture

Learn how LWC communicates reactively with Salesforce data using JavaScript decorators and reactive bindings.

### Core Concepts

- The `@wire` Syntax & Reactive Parameters (`$param`)
- Wire Configuration Objects & Provisioning Lifecycle
- Wiring Properties vs. Wiring Functions
- Cache-First Strategy & Immutability Rules
- Refreshing Wired Data (`refreshApex`)
- Managing Loading and Error States Gracefully

---

## Apex Integration

Integrate custom server-side business logic, complex SOQL queries, and multi-object DML transactions.

### Core Topics

- Exposing Apex to LWC (`@AuraEnabled(cacheable=true)` vs. non-cacheable)
- Wiring Apex Methods Reactively
- Imperative Apex Invocations for On-Demand Operations & DML
- Passing Complex Types, Wrappers, and Lists between JS and Apex
- Transaction Boundaries & Handling DML Rollbacks
- Handling Server Exceptions (`AuraHandledException`)

---

## GraphQL Wire Adapter

Query Salesforce data using declarative GraphQL syntax tailored for modern client-side architectures.

### Core Concepts

- Query Structure & Syntax (`graphql` tagged template literals)
- Filtering, Sorting, and Pagination (`first`, `after`, `where`, `orderBy`)
- Multi-Entity Traversal & Polymorphic Relationships
- Dynamic Query Variables in `@wire(graphql)`
- Comparing GraphQL vs. SOQL in Apex vs. UI API Wire Adapters
- Caching, Aggregations, and Error Boundary Handling

---

## Hands-on Practice

Each section includes **theory, practical examples, and in-depth concepts** to help you build performant, data-driven LWC solutions.

---

Keep exploring, keep building, and keep learning.