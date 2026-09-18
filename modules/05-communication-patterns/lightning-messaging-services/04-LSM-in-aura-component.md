# LSM in Aura Component

Cross-framework messaging between Aura components via **Lightning Message Service (LMS)** uses the `<lightning:messageChannel>` tag inside the component markup.

While legacy Aura-to-Aura implementations relied on Aura Application Events (`<aura:event type="APPLICATION">`), using LMS provides a unified message bus that allows Aura components to seamlessly communicate with **other Aura components**, **LWCs**, and **Visualforce pages** without rewriting event architectures.

---

**1. Architectural Shift: Application Events vs. LMS**

* **Legacy Aura Application Events:** Registered via `<aura:registerEvent>` and handled via `<aura:handler event="c:myEvent">`. They operate strictly within the Aura framework runtime and cannot communicate outside Aura without custom bridge components.
* **Aura via LMS:** Declares a `<lightning:messageChannel>` element directly in the markup. It hooks directly into the Lightning Experience client bus, exposing simple controller methods to `publish()` and automatically routing inbound messages to action handlers.

---

**2. Publisher Aura Component**

To publish, declare the channel with an `aura:id`, then call `publish()` on that channel element inside the JavaScript controller.

**`auraPublisher.cmp`**

```html
<aura:component implements="flexipage:availableForAllPageTypes">
    <!-- Reference the Message Channel via aura:id -->
    <lightning:messageChannel 
        type="FilterChangeChannel__c" 
        aura:id="filterMessageChannel" 
    />

    <lightning:card title="Aura Publisher">
        <lightning:input 
            aura:id="searchInput" 
            label="Search Records" 
            placeholder="Type search term..." 
        />
        <lightning:button 
            label="Broadcast Filter" 
            variant="brand" 
            onclick="{!c.handleSendFilter}" 
        />
    </lightning:card>
</aura:component>

```

**`auraPublisherController.js`**

```javascript
({
    handleSendFilter: function(component, event, helper) {
        var searchVal = component.find("searchInput").get("v.value");

        var payload = {
            searchTerm: searchVal,
            activeFilter: 'Aura-Source'
        };

        // Locate the lightning:messageChannel element and publish
        component.find("filterMessageChannel").publish(payload);
    }
})

```

---

**3. Subscriber Aura Component**

To subscribe, include `<lightning:messageChannel>` and specify an `onMessage` callback attribute.

**`auraSubscriber.cmp`**

```html
<aura:component implements="flexipage:availableForAllPageTypes">
    <aura:attribute name="receivedTerm" type="String" default="" />
    <aura:attribute name="receivedSource" type="String" default="" />

    <!-- onMessage binds incoming payload to a controller action -->
    <!-- scope="APPLICATION" is optional (defaults to active tab) -->
    <lightning:messageChannel 
        type="FilterChangeChannel__c" 
        onMessage="{!c.handleIncomingMessage}" 
        scope="APPLICATION" 
    />

    <lightning:card title="Aura Subscriber">
        <p class="slds-p-horizontal_small">
            Received Term: <strong>{!v.receivedTerm}</strong>
        </p>
        <p class="slds-p-horizontal_small">
            Source: <strong>{!v.receivedSource}</strong>
        </p>
    </lightning:card>
</aura:component>

```

**`auraSubscriberController.js`**

```javascript
({
    handleIncomingMessage: function(component, event, helper) {
        // Event arguments provide the published payload
        if (event && event.getParams()) {
            var params = event.getParams();
            component.set("v.receivedTerm", params.searchTerm);
            component.set("v.receivedSource", params.activeFilter);
        }
    }
})

```

---

**Aura-Specific Considerations**

* **Automatic Cleanup:** In Aura, subscriptions declared via `<lightning:messageChannel>` are lifecycle-aware. When the Aura component is unrendered and destroyed, the framework automatically disposes of the listener—no manual `unsubscribe()` step is required in a renderer or helper.
* **No `MessageContext` Wire Required:** Unlike LWC (which requires `@wire(MessageContext)` to hook into the runtime context), Aura encapsulates the runtime context inside the `<lightning:messageChannel>` tag itself.
* **Dynamic Subscriptions:** If you need programmatic control to start or stop listening conditionally in Aura, you can call the channel's programmatic methods (`subscribe()` and `unsubscribe()`) via `component.find('channelAuraId')`, passing a callback function manually.