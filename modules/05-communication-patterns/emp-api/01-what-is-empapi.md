# Salesforce EmpAPI

`lightning/empApi` is the Lightning Web Component module used to subscribe to real-time event streams directly in the browser. It implements Salesforce's streaming architecture over **Bayeux protocol / CometD**, allowing your UI to react instantly to database modifications or custom events without polling.

---

### What Can You Subscribe To?

* **Change Data Capture (CDC):** Near-real-time notifications of changes to Salesforce records (create, update, delete, undelete).
* Channel format: `/data/<Standard_Object>ChangeEvent` (e.g., `/data/AccountChangeEvent`) or `/data/<Custom_Object>__ChangeEvent`.


* **Platform Events:** Custom event payloads defined via Setup.
* Channel format: `/event/<Event_API_Name>__e` (e.g., `/event/Order_Shipped__e`).


* **PushTopic Events:** Legacy queries that broadcast updates when record changes match criteria.
* Channel format: `/topic/<TopicName>`.



---

### The Big LDS Connection: Combining `empApi` + `notifyRecordUpdateAvailable`

`empApi` listens to the event stream, but it **does not automatically update the LDS cache**.

When another user (or a background automated batch) updates a record, `empApi` receives a CDC message. You can extract the changed record ID from that event and feed it directly into **`notifyRecordUpdateAvailable`**. This forces LDS to refresh its cache and updates every wire adapter or form component on the screen in real time.

---

### Complete Implementation Example (CDC + LDS Cache Busting)

This component listens for any changes made to the current Account record anywhere in the org, displays a toast notification, and automatically triggers an LDS cache refresh.

**JavaScript:**

```javascript
import { LightningElement, api } from 'lwc';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class AccountCdcListener extends LightningElement {
    @api recordId;

    // Channel for Account Change Data Capture
    channelName = '/data/AccountChangeEvent';
    subscription = {};

    connectedCallback() {
        this.registerErrorListener();
        this.handleSubscribe();
    }

    disconnectedCallback() {
        // Always clean up subscriptions to prevent memory leaks
        this.handleUnsubscribe();
    }

    handleSubscribe() {
        // Callback invoked whenever an event is received on the channel
        const messageCallback = async (response) => {
            const payload = response.data.payload;
            const changedRecordIds = payload.ChangeEventHeader.recordIds;
            const changeType = payload.ChangeEventHeader.changeType; // CREATE, UPDATE, DELETE

            // Verify if the current record was part of this change event
            if (changedRecordIds.includes(this.recordId)) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Live Record Update',
                        message: `Account was modified via ${changeType}. Refreshing view...`,
                        variant: 'info'
                    })
                );

                // Invalidate LDS cache so all @wire and forms re-fetch fresh data
                await notifyRecordUpdateAvailable([{ recordId: this.recordId }]);
            }
        };

        // ReplayId: -1 means only receive new events broadcast after subscribing
        subscribe(this.channelName, -1, messageCallback).then((response) => {
            this.subscription = response;
        });
    }

    handleUnsubscribe() {
        unsubscribe(this.subscription, (response) => {
            console.log('Unsubscribed from channel:', response);
        });
    }

    registerErrorListener() {
        onError((error) => {
            console.error('EmpApi streaming error received:', JSON.stringify(error));
        });
    }
}

```

---

### Replay IDs: Catching Missed Events

When calling `subscribe(channel, replayId, callback)`, the `replayId` determines where the stream starts reading:

| Replay ID Value | Meaning |
| --- | --- |
| **`-1`** | **Tip of the stream (Default):** Receives only events broadcast *after* the client subscribes. |
| **`-2`** | **Earliest retained event:** Replays all events currently stored in the streaming retention window (typically up to 72 hours for CDC/Platform Events). |
| **Specific Number** | **Point-in-time replay:** Replays all retained events published *after* that specific event's replay ID. |

---

### Key API Reference

| Function | Parameters | Purpose |
| --- | --- | --- |
| `subscribe` | `(channelName, replayId, callback)` | Initiates subscription. Returns a Promise resolving to a subscription object. |
| `unsubscribe` | `(subscription, callback)` | Cancels an active streaming subscription. |
| `onError` | `(callback)` | Global error listener for streaming disconnections, handshake failures, or CometD issues. |
| `isEmpEnabled` | `()` | Returns a Promise resolving to a boolean indicating whether the current user context supports `empApi`. |

---

### Best Practices and Gotchas

* **Unsubscribe in `disconnectedCallback`:** Forgetting to unsubscribe when components unmount leaves listeners running in the background, causing memory leaks and duplicate executions.
* **Enable CDC in Setup:** To listen to `/data/<Object>ChangeEvent`, the object must first be enabled under **Setup > Change Data Capture**.
* **Governor Limits Apply:** Streaming channels share org-wide streaming allocation limits (concurrent clients, daily event delivery limits). Use targeted channels rather than subscribing to entire enterprise-wide feeds unnecessarily.