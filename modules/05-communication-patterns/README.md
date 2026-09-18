# Salesforce LWC Communication Patterns

This section covers **inter-component messaging, cross-boundary communication, and real-time event streaming in Salesforce Lightning Web Components (LWC)**.

You’ll master how components pass state up and down the DOM hierarchy, how to decouple unrelated components across different UI layers using **Lightning Message Service (LMS)**, and how to subscribe to real-time server-side events using **empApi (Streaming API & Change Data Capture)**.

## Table of Contents

- [empApi (Streaming & CDC)](./emp-api/README.md)
- [Parent-Child Communication](./parent-to-child-communication/README.md)
- [Lightning Message Service (LMS)](./lightning-messaging-services/README.md)

---

## Parent-Child Communication

Master the foundational data-down, events-up architecture used to coordinate components within the same DOM tree.

### Core Topics

- **Passing Data Down**: Exposing public properties with `@api`
- **Method Invocation**: Calling child public methods via `@api methodName()`
- **Passing Data Up**: Dispatching custom DOM events (`new CustomEvent('eventname', { detail })`)
- **Event Propagation Controls**: `bubbles` and `composed` boundary behavior
- **Declarative vs. Programmatic Listeners**: Handling events in HTML templates (`oncustomevent`) vs. `addEventListener` in `connectedCallback`
- **Dynamic Data Binding**: Responding to parent-driven attribute changes via getters and setters

---

## Lightning Message Service (LMS)

Publish and subscribe across loosely coupled components spanning LWC, Aura, Visualforce, and utility bars on a Salesforce page.

### Core Concepts

- **Lightning Message Channel (LMC)**: Creating and deploying `*.messageChannel-meta.xml` definitions
- **Scoped Context**: Managing message delivery with `APPLICATION_SCOPE` vs. default standard page scope
- **Message Publishing**: Emitting payloads using the `publish()` API
- **Message Subscribing**: Registering listener callbacks via `subscribe()` and the `@wire(MessageContext)` adapter
- **Lifecycle Cleanup**: Unsubscribing gracefully using `unsubscribe()` in `disconnectedCallback`
- **Cross-Framework Interoperability**: Bridging communication between LWC, Aura components, and Visualforce iframes

---

## empApi (Streaming & CDC)

Establish persistent CometD WebSocket connections to capture asynchronous, real-time database modifications and server-published platform events.

### Core Topics

- **Supported Channels**: Change Data Capture (`/data/ChangeEvents`, `/data/<Object>ChangeEvent`), Platform Events (`/event/<Event_Name>__e`), and PushTopics
- **Subscription Lifecycle**: Initializing listener streams using `subscribe()` and terminating via `unsubscribe()`
- **Replay Options**: Configuring `replayId` values (`-1` for newest, `-2` for all retained events)
- **Error Handling & Diagnostics**: Registering global stream error callbacks via `onError()`
- **Triggering Cache Invalidation**: Orchestrating `empApi` event payloads with `refreshApex` or `notifyRecordUpdateAvailable` to trigger seamless client UI updates
- **Client Constraints**: Managing connection limits, mobile execution constraints, and Lightning Console navigation contexts

---

## Hands-on Practice

Each section includes **theory, practical examples, and in-depth concepts** to help you build responsive, event-driven Salesforce architectures.

---

Keep exploring, keep building, and keep learning.