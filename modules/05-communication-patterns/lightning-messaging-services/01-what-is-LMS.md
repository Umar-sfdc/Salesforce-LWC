# Salesforce Lightning Messaging Service

Lightning Message Service (LMS) is Salesforce’s client-side publish-subscribe framework that enables communication between components across different DOM trees on a Lightning page.

Unlike standard Custom Events (which require a DOM relationship like child-to-parent), LMS allows completely decoupled components to communicate, including across different UI technologies: **Lightning Web Components (LWC)**, **Aura Components**, and **Visualforce Pages**.

---

**Core Building Blocks**

* **Lightning Message Channel (LMC):** A metadata file defining the communication channel and payload schema.
* **Publisher:** The component broadcasting data to a channel.
* **Subscriber:** The component listening to that channel to handle incoming payloads.
* **Message Context (`@wire(MessageContext)`):** Provides contextual information about the component using LMS and handles automatic subscription teardown in LWCs.

---

**Step 1: Define the Lightning Message Channel**

Create a folder named `messageChannels` inside `force-app/main/default/`. Then create a file named `RecordDataChannel.messageChannel-meta.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningMessageChannel xmlns="http://soap.sforce.com/2006/04/metadata">
    <masterLabel>RecordDataChannel</masterLabel>
    <isExposed>true</isExposed>
    <description>Message channel to broadcast selected record information.</description>
    <lightningMessageFields>
        <fieldName>recordId</fieldName>
        <description>The Id of the selected record</description>
    </lightningMessageFields>
    <lightningMessageFields>
        <fieldName>recordData</fieldName>
        <description>Payload data for the record</description>
    </lightningMessageFields>
</LightningMessageChannel>

```

*Note: Deploy this channel to your Salesforce org before referencing it in code.*

---

**Step 2: Create the Publisher Component (LWC)**

Import the channel using the scoped `@salesforce/messageChannel/` module and call `publish()` with the context and payload.

```javascript
// publisherComponent.js
import { LightningElement, wire } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import RECORD_CHANNEL from '@salesforce/messageChannel/RecordDataChannel__c';

export default class PublisherComponent extends LightningElement {
    @wire(MessageContext)
    messageContext;

    handleSend() {
        const payload = {
            recordId: '001xx000003DGbYAAW',
            recordData: { status: 'Active', category: 'Enterprise' }
        };

        // Broadcast to the channel
        publish(this.messageContext, RECORD_CHANNEL, payload);
    }
}

```

---

**Step 3: Create the Subscriber Component (LWC)**

Use `subscribe()` to register a callback listener, and unsubscribe when disconnected to prevent memory leaks.

```javascript
// subscriberComponent.js
import { LightningElement, wire } from 'lwc';
import { 
    subscribe, 
    unsubscribe, 
    APPLICATION_SCOPE, 
    MessageContext 
} from 'lightning/messageService';
import RECORD_CHANNEL from '@salesforce/messageChannel/RecordDataChannel__c';

export default class SubscriberComponent extends LightningElement {
    subscription = null;
    receivedMessage = '';

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }

    subscribeToMessageChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                RECORD_CHANNEL,
                (message) => this.handleMessage(message),
                { scope: APPLICATION_SCOPE } // Optional: listens even when tab/subtab is inactive
            );
        }
    }

    handleMessage(message) {
        this.receivedMessage = JSON.stringify(message);
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }
}

```

---

**Scoping: Default vs. `APPLICATION_SCOPE**`

* **Active Area (Default):** The subscriber receives messages only when its enclosing tab or window is in focus.
* **`APPLICATION_SCOPE`:** The subscriber receives events regardless of whether its subtab or container area is active (useful for utility bars, cross-subtab listeners, or global notification banners).

---

**When to Use What**

| Communication Type | Best Approach |
| --- | --- |
| Parent to Child | `@api` public properties or methods |
| Child to Parent | Standard Custom DOM Events (`CustomEvent` / `dispatchEvent`) |
| Unrelated Siblings / Cross-DOM | **Lightning Message Service (LMS)** |
| LWC to Aura / Visualforce | **Lightning Message Service (LMS)** |
| Server-to-Client Streaming | Platform Events / Change Data Capture (EmpApi) |