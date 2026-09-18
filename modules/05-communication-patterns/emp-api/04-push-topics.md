# Salesforce PushTopic

A **PushTopic** is Salesforce’s original, query-based streaming mechanism. Unlike Change Data Capture (which tracks every change across an entire object) or Platform Events (which use custom event schemas), a PushTopic publishes notifications based on a **SOQL query** you define.

Whenever a record is created or updated in a way that matches your SOQL query criteria, Salesforce pushes a notification containing the exact fields specified in your `SELECT` statement.

---

### How a PushTopic Works

1. **You define a `PushTopic` record:** You write a SOQL query (e.g., `SELECT Id, Name, StageName FROM Opportunity WHERE Amount > 100000`).
2. **Salesforce monitors DML:** The database watches for inserts, updates, deletes, or undeletes that evaluate to `true` against that query.
3. **Event Generation:** When a record enters, changes within, or exits that SOQL criteria, Salesforce packages the queried fields into a message.
4. **Delivery:** The notification streams across Bayeux/CometD to subscribers listening to `/topic/<PushTopicName>`.

---

### Step 1: Creating a PushTopic (Apex / Anonymous Window)

Unlike CDC or Platform Events (configured in Setup), a PushTopic is actually a standard sObject named `PushTopic`. You create it by inserting a record:

```apex
PushTopic pushTopic = new PushTopic();
pushTopic.Name = 'HighValueOpps';
pushTopic.Query = 'SELECT Id, Name, StageName, Amount, CloseDate FROM Opportunity WHERE Amount >= 100000';
pushTopic.ApiVersion = 61.0;

// Trigger conditions
pushTopic.NotifyForOperationCreate = true;
pushTopic.NotifyForOperationUpdate = true;
pushTopic.NotifyForOperationDelete = true;
pushTopic.NotifyForOperationUndelete = false;

// Notification evaluation logic
pushTopic.NotifyForFields = 'Referenced'; // Options: All, Referenced, Select, Where

insert pushTopic;

```

#### Understanding `NotifyForFields`

This setting dictates what triggers an update notification:

* **`Referenced` (Default & Recommended):** Triggers only if changes affect fields in the `SELECT` or `WHERE` clauses.
* **`Select`:** Triggers only if fields in the `SELECT` clause change.
* **`Where`:** Triggers only if fields in the `WHERE` clause change.
* **`All`:** Triggers if *any* field on the record changes, regardless of whether it is in the query.

---

### Step 2: Subscribing in LWC via `empApi`

PushTopic channel names always follow the syntax `/topic/<PushTopicName>`.

```javascript
import { LightningElement } from 'lwc';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class HighValueOppTracker extends LightningElement {
    // Channel path matching the PushTopic.Name
    channelName = '/topic/HighValueOpps';
    subscription = {};

    connectedCallback() {
        this.registerErrorListener();
        this.handleSubscribe();
    }

    disconnectedCallback() {
        this.handleUnsubscribe();
    }

    handleSubscribe() {
        const messageCallback = (response) => {
            const oppData = response.data.sobject;
            const eventMetadata = response.data.event;

            this.dispatchEvent(
                new ShowToastEvent({
                    title: `Opportunity ${eventMetadata.type}: ${oppData.Name}`,
                    message: `Stage: ${oppData.StageName} | Amount: $${oppData.Amount}`,
                    variant: 'info'
                })
            );
        };

        // ReplayId: -1 receives only new events
        subscribe(this.channelName, -1, messageCallback).then((res) => {
            this.subscription = res;
        });
    }

    handleUnsubscribe() {
        if (this.subscription.id) {
            unsubscribe(this.subscription, () => {
                console.log('Unsubscribed from PushTopic');
            });
        }
    }

    registerErrorListener() {
        onError((error) => {
            console.error('PushTopic error:', JSON.stringify(error));
        });
    }
}

```

---

### Anatomy of a PushTopic Payload

The payload structure differs slightly from CDC and Platform Events. The record data lives directly under `response.data.sobject`:

```json
{
  "data": {
    "event": {
      "type": "updated",
      "createdDate": "2026-09-18T10:12:00.000Z"
    },
    "sobject": {
      "Id": "006XXXXXXXXXXXXAAA",
      "Name": "Global Media Deal",
      "StageName": "Negotiation/Review",
      "Amount": 150000.0,
      "CloseDate": "2026-10-31"
    }
  },
  "channel": "/topic/HighValueOpps"
}

```

---

### PushTopic SOQL Limitations

PushTopic queries are not general-purpose SOQL queries. They come with strict query constraints:

* **No Aggregate Expressions:** `COUNT()`, `MAX()`, `MIN()`, `SUM()`, and `GROUP BY` are forbidden.
* **No Semi-Joins or Anti-Joins:** Subqueries like `WHERE AccountId IN (SELECT ...)` are unsupported.
* **No Polymorphic Fields:** Querying polymorphic relationships like `Owner.Name` or `WhatId` is restricted.
* **Single Object Only:** You cannot traverse relationships across multiple objects in the `SELECT` list (e.g., `SELECT Contact.Account.Name` is not allowed).

---

### Streaming Architecture Comparison

| Feature | PushTopic | Change Data Capture (CDC) | Platform Events |
| --- | --- | --- | --- |
| **Filter Location** | Filtered on server via SOQL `WHERE` clause. | Server filters (event channels) or client-side checks. | Published deliberately or filtered with channel filters. |
| **Payload Content** | Exactly what is in the `SELECT` statement. | Delta of changed fields + `ChangeEventHeader`. | Custom event fields defined in Setup. |
| **Configuration** | Defined via DML on `PushTopic` sObject. | Configured in Setup > Change Data Capture. | Configured in Setup > Platform Events. |
| **Message Retention** | Up to **24 hours**. | Up to **72 hours**. | Up to **72 hours**. |
| **Status in Architecture** | **Legacy / Maintenance** (Use CDC or Pub/Sub API for new apps). | **Current Standard** for record-level events. | **Current Standard** for integration & enterprise messaging. |