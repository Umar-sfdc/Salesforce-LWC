# Salesforce Subscribe Component

Subscribing to **Platform Events** in Lightning Web Components uses the same `lightning/empApi` module as Change Data Capture (CDC), but targets custom event definitions created in Setup.

While CDC is tied directly to database record changes (CRUD operations), Platform Events allow you to publish and consume **custom enterprise-wide event payloads** triggered by Apex, Flows, or external systems.

---

### Platform Event Channel Format

All custom Platform Events end with the suffix `__e`.

The channel string passed to `empApi` follows this strict syntax:

```text
/event/<Event_API_Name>__e

```

For example, an event named `Order_Processed__e` uses the channel:

```javascript
const channel = '/event/Order_Processed__e';

```

---

### Anatomy of a Platform Event Payload

When an event fires, `empApi` receives an object with two primary layers:

```json
{
  "data": {
    "schema": "schema_id_hash",
    "payload": {
      "CreatedById": "005XXXXXXXXXXXXAAA",
      "CreatedDate": "2026-09-18T09:30:00.000Z",
      "Order_Number__c": "ORD-10492",
      "Status__c": "Shipped",
      "Total_Amount__c": 250.00
    },
    "event": {
      "replayId": 140239
    }
  },
  "channel": "/event/Order_Processed__e"
}

```

* **`response.data.payload`**: Holds standard audit fields (`CreatedById`, `CreatedDate`) and your custom fields defined on the event.
* **`response.data.event.replayId`**: The streaming bus position marker for that specific message.

---

### Step-by-Step Implementation

This example subscribes to `Order_Processed__e`, inspects incoming orders, and updates the local component UI when relevant orders arrive.

**HTML (`orderListener.html`):**

```html
<template>
    <lightning-card title="Live Order Notifications" icon-name="custom:custom18">
        <div class="slds-p-around_medium">
            <template lwc:if={latestOrder}>
                <p><strong>Order:</strong> {latestOrder.Order_Number__c}</p>
                <p><strong>Status:</strong> {latestOrder.Status__c}</p>
                <p><strong>Total:</strong> ${latestOrder.Total_Amount__c}</p>
            </template>
            <template lwc:else>
                <p class="slds-text-color_weak">Waiting for live order events...</p>
            </template>
        </div>
    </lightning-card>
</template>

```

**JavaScript (`orderListener.js`):**

```javascript
import { LightningElement } from 'lwc';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class OrderListener extends LightningElement {
    channelName = '/event/Order_Processed__e';
    subscription = {};
    latestOrder;

    connectedCallback() {
        this.registerErrorListener();
        this.handleSubscribe();
    }

    disconnectedCallback() {
        this.handleUnsubscribe();
    }

    handleSubscribe() {
        // Callback function triggered when an event is broadcast
        const messageCallback = (response) => {
            const payload = response.data.payload;
            
            // Assign payload data directly to reactive component properties
            this.latestOrder = payload;

            // Notify user in real-time
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'New Order Processed',
                    message: `Order #${payload.Order_Number__c} marked as ${payload.Status__c}`,
                    variant: 'success'
                })
            );
        };

        // -1 receives only new events broadcast after subscription
        subscribe(this.channelName, -1, messageCallback).then((response) => {
            this.subscription = response;
        });
    }

    handleUnsubscribe() {
        if (this.subscription && this.subscription.id) {
            unsubscribe(this.subscription, (response) => {
                console.log('Successfully unsubscribed:', response);
            });
        }
    }

    registerErrorListener() {
        onError((error) => {
            console.error('Streaming error encountered:', JSON.stringify(error));
        });
    }
}

```

---

### Platform Events vs. Change Data Capture (CDC)

| Feature | Platform Events (`/event/Name__e`) | Change Data Capture (`/data/ObjectChangeEvent`) |
| --- | --- | --- |
| **Trigger Source** | Explicit publication (Apex `EventBus.publish()`, Flow, external REST API). | Automatic (fires on database `INSERT`, `UPDATE`, `DELETE`, `UNDELETE`). |
| **Payload** | Custom-defined fields matching your business event model. | Standard diff of changed fields, plus `ChangeEventHeader`. |
| **Use Case** | System integrations, process completion notices, custom alerts. | Synchronizing external DBs, audit trails, real-time UI data updates. |
| **Channel Syntax** | `/event/<Name>__e` | `/data/<Object>ChangeEvent` |

---

### Key Gotchas with Platform Events in LWC

* **Publish Behavior:** Standard-volume and high-volume platform events publish either **Immediately** (`Publish Immediately`) or **After Commit** (`Publish After Commit`). If set to `Publish After Commit`, the LWC won't receive the event until the entire database transaction successfully commits.
* **Component Teardown:** Never omit `unsubscribe()` in `disconnectedCallback()`. If a user navigates away and back to the page, failing to unsubscribe causes ghost listeners and duplicate toasts.
* **Data Context Limits:** Event subscribers run in the context of the running user viewing the browser tab. Field-level security and record accessibility rules must be accounted for if processing IDs delivered via the payload.