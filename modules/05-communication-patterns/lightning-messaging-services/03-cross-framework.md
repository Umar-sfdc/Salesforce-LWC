# LSM Cross Framework 
When communicating between Lightning Web Components that belong to different component hierarchies, different page regions, or different underlying implementation patterns, Salesforce relies on **Lightning Message Service (LMS)** as its standard cross-tree pub/sub layer.

Prior to LMS, developers often used the third-party `pubsub` utility module (an in-memory custom JS event emitter). LMS replaced this by integrating directly into the Lightning runtime container with scoped security and lifecycle-aware cleanup.

---

**1. Architectural Flow**

```
┌──────────────────────────┐          ┌──────────────────────────┐
│   Publisher LWC Tree     │          │    Subscriber LWC Tree   │
│ ┌──────────────────────┐ │          │ ┌──────────────────────┐ │
│ │  Nested Child LWC    │ │          │ │  Nested Child LWC    │ │
│ │  publish(ctx, chan)  │ │          │ │  subscribe(...)      │ │
│ └──────────┬───────────┘ │          │ └──────────▲───────────┘ │
└────────────┼─────────────┘          └────────────┼─────────────┘
             │                                     │
             ▼                                     │
    ┌──────────────────────────────────────────────┴─────────────┐
    │     Lightning Experience In-Memory Message Bus             │
    │     (Channel: e.g., FilterChangeChannel__c)                │
    └────────────────────────────────────────────────────────────┘

```

Because both components interact with the centralized message bus, neither component needs an ancestor-descendant relationship in the DOM, nor do they need to expose `@api` hooks or bubble DOM `CustomEvent` instances up to an enclosing wrapper.

---

**2. Implementation: Channel Definition**

Save as `force-app/main/default/messageChannels/FilterChangeChannel.messageChannel-meta.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningMessageChannel xmlns="http://soap.sforce.com/2006/04/metadata">
    <masterLabel>FilterChangeChannel</masterLabel>
    <isExposed>true</isExposed>
    <description>Publishes global filtering criteria to decoupled components.</description>
    <lightningMessageFields>
        <fieldName>searchTerm</fieldName>
        <description>Search string applied by the user</description>
    </lightningMessageFields>
    <lightningMessageFields>
        <fieldName>activeFilter</fieldName>
        <description>Selected category or status</description>
    </lightningMessageFields>
</LightningMessageChannel>

```

---

**3. Publisher LWC**

The publisher wires `MessageContext` and calls `publish()` whenever its internal state changes.

```javascript
// filterPublisher.js
import { LightningElement, wire } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import FILTER_CHANNEL from '@salesforce/messageChannel/FilterChangeChannel__c';

export default class FilterPublisher extends LightningElement {
    @wire(MessageContext)
    messageContext;

    handleSearchChange(event) {
        const payload = {
            searchTerm: event.target.value,
            activeFilter: 'Active'
        };

        // Dispatches to the bus across all subtrees
        publish(this.messageContext, FILTER_CHANNEL, payload);
    }
}

```

---

**4. Subscriber LWC**

The subscriber binds a handler inside `connectedCallback` and releases its listener in `disconnectedCallback`.

```javascript
// dataListSubscriber.js
import { LightningElement, wire } from 'lwc';
import { 
    subscribe, 
    unsubscribe, 
    APPLICATION_SCOPE, 
    MessageContext 
} from 'lightning/messageService';
import FILTER_CHANNEL from '@salesforce/messageChannel/FilterChangeChannel__c';

export default class DataListSubscriber extends LightningElement {
    subscription = null;
    searchTerm = '';
    currentFilter = '';

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        this.registerSubscription();
    }

    disconnectedCallback() {
        this.unregisterSubscription();
    }

    registerSubscription() {
        if (this.subscription) {
            return;
        }

        this.subscription = subscribe(
            this.messageContext,
            FILTER_CHANNEL,
            (message) => this.handleFilterMessage(message),
            { scope: APPLICATION_SCOPE }
        );
    }

    handleFilterMessage(message) {
        this.searchTerm = message.searchTerm ?? '';
        this.currentFilter = message.activeFilter ?? '';
        
        // Execute dependent fetch or client-side filtering
        this.applyFilter();
    }

    applyFilter() {
        // Business logic here
    }

    unregisterSubscription() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }
}

```

---

**Core Advantages Over Legacy JS Pub/Sub Utilities**

* **Automatic Scope Cleanup:** Using `@wire(MessageContext)` ensures the framework detaches dead listeners automatically when a component instance is destroyed.
* **Console Workspace Compatibility:** By switching between the default scope and `APPLICATION_SCOPE`, components can choose whether to mute messages when moved into background tabs in Lightning Console apps.
* **Strict Contracts:** Defining fields in `.messageChannel-meta.xml` creates an explicit API boundary between independent feature modules.