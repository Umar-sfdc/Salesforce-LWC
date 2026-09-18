# Salesforce CDC

**Change Data Capture (CDC)** is Salesforce's event-driven framework that automatically tracks and streams changes made to Salesforce records (create, update, delete, and undelete) in near-real time.

Instead of polling Salesforce every few minutes to see if records changed, downstream systems and Lightning Web Components subscribe to a CDC event stream. Whenever a record changes in the database, Salesforce pushes an event message containing the record ID and the exact fields that were modified.

---

### How CDC Works Under the Hood

```
Record Updated in Salesforce 
(UI, Apex, Flow, API, or Bulk)
           │
           ▼
Salesforce Commit Phase (Database Commit)
           │
           ▼
Change Data Capture Engine captures change
           │
           ▼
Published to Event Bus (retention up to 72 hours)
           │
     ┌─────┴──────────────────────┐
     ▼                            ▼
External Subscribers         LWC via empApi
(Kafka, MuleSoft, AWS)      (Refreshes LDS cache)

```

1. **Commit-Triggered:** Events are only published **after** a transaction commits successfully. If an Apex transaction rolls back, no CDC event is generated.
2. **Delta (Diff) Publishing:** For update operations, CDC events contain **only the modified fields**, not the entire record snapshot. This drastically reduces payload size and network traffic.
3. **Transaction Bundling:** If a single transaction updates 200 records, CDC can bundle those changes into one or few event messages sharing a single transaction key (`transactionKey`).

---

### Channel Naming Conventions

To subscribe to CDC events via `lightning/empApi` or external CometD/Pub/Sub clients:

| Target Object | Channel Pattern | Example |
| --- | --- | --- |
| **Standard Objects** | `/data/<Standard_Object>ChangeEvent` | `/data/AccountChangeEvent`<br>

<br>`/data/ContactChangeEvent` |
| **Custom Objects** | `/data/<Custom_Object_Name>__ChangeEvent` | `/data/Invoice__ChangeEvent`<br>

<br>`/data/Order_Item__ChangeEvent` |
| **All Objects (Org-wide)** | `/data/ChangeEvents` | Single channel capturing all enabled objects |

> **Setup Prerequisite:** Objects do not broadcast CDC events by default. You must enable them in **Setup > Change Data Capture** by selecting entities and moving them to the *Selected Entities* column.

---

### Anatomy of a CDC Event Payload

When an event fires, it carries standard record fields alongside a critical metadata block called **`ChangeEventHeader`**:

```json
{
  "data": {
    "schema": "s0m3Sch3m4Id",
    "payload": {
      "Phone": "555-0199",
      "AnnualRevenue": 1500000.0,
      "ChangeEventHeader": {
        "commitNumber": 104829103,
        "commitUser": "005XXXXXXXXXXXXAAA",
        "commitTimestamp": 1789726200000,
        "entityName": "Account",
        "changeType": "UPDATE",
        "changeOrigin": "com/salesforce/api/soap",
        "transactionKey": "0002b80a-9d2a-...",
        "sequenceNumber": 1,
        "recordIds": ["001XXXXXXXXXXXXAAA"],
        "nulledFields": ["Fax"],
        "diffFields": ["Phone", "AnnualRevenue"],
        "changedFields": ["Phone", "AnnualRevenue", "Fax"]
      }
    },
    "event": {
      "replayId": 248102
    }
  },
  "channel": "/data/AccountChangeEvent"
}

```

#### Key `ChangeEventHeader` Attributes

* **`recordIds`:** Array of record IDs affected by this change.
* **`changeType`:** The operation that caused the event: `CREATE`, `UPDATE`, `DELETE`, or `UNDELETE`.
* **`commitUser`:** The Salesforce user ID who made the modification. (Useful for filtering out changes made by the current user to avoid self-triggering updates).
* **`nulledFields`:** Explicitly lists fields that were cleared out (set to `null`), because standard JSON serialization often omits null values.
* **`diffFields`:** Contains fields whose values actually changed relative to the previous state.

---

### Listening to CDC in LWC with `empApi`

The most common architectural pattern for CDC in LWC is **reactive UI updates**: when a record changes in the background, invalidate the LDS cache so the screen updates instantly.

```javascript
import { LightningElement, api } from 'lwc';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';
import Id from '@salesforce/user/Id';

export default class AccountLiveSync extends LightningElement {
    @api recordId;
    channelName = '/data/AccountChangeEvent';
    subscription = {};
    currentUserId = Id;

    connectedCallback() {
        this.handleSubscribe();
    }

    disconnectedCallback() {
        this.handleUnsubscribe();
    }

    handleSubscribe() {
        const messageCallback = async (response) => {
            const header = response.data.payload.ChangeEventHeader;
            
            // Ignore updates initiated by the current user to avoid redundant re-renders
            if (header.commitUser === this.currentUserId) {
                return;
            }

            // Check if this event impacts the record currently on screen
            if (header.recordIds.includes(this.recordId)) {
                console.log(`Record updated via ${header.changeType} by user ${header.commitUser}`);
                
                // Invalidate LDS client cache - automatically refreshes @wire and record forms
                await notifyRecordUpdateAvailable([{ recordId: this.recordId }]);
            }
        };

        subscribe(this.channelName, -1, messageCallback).then((res) => {
            this.subscription = res;
        });
    }

    handleUnsubscribe() {
        if (this.subscription.id) {
            unsubscribe(this.subscription, () => {
                console.log('Unsubscribed from CDC channel');
            });
        }
    }
}

```

---

### Change Data Capture vs. Platform Events vs. PushTopic

| Feature | Change Data Capture (CDC) | Platform Events | PushTopic (Legacy) |
| --- | --- | --- | --- |
| **Payload Structure** | Predefined header + delta fields | Fully customized schema | SOQL-defined fields |
| **Trigger Mechanism** | Automatic database DML | Explicit `EventBus.publish()` | SOQL criteria match on DML |
| **Enrichment** | Supports event enrichment (Setup) | Defined manually | Limited to SOQL `SELECT` |
| **Retention Window** | Up to 72 hours | Up to 72 hours | 24 hours |
| **Primary Focus** | Data sync & cache busting | Custom business flows & microservices | Legacy integrations |

---

### Event Enrichment: Overcoming "Delta-Only" Payloads

By default, an `UPDATE` event only contains the fields that changed. If an external system or LWC needs identifying fields (like `AccountNumber` or an `External_ID__c`) regardless of whether they changed, you can configure **Event Enrichment** in Setup:

* Enriched fields are included in every change event payload for that object even if their values were not touched during the update transaction.