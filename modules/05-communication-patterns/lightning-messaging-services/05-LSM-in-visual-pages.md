# LSM in Visualforce Pages

Communication between Visualforce (VF) pages via **Lightning Message Service (LMS)** uses the global JavaScript object `$Lightning.messageService`.

Because Visualforce pages inside Lightning Experience render inside distinct `<iframe>` elements hosted on a different domain (`*.visualforce.com` or `*.vf.force.com`), LMS handles the underlying browser `postMessage` cross-domain messaging behind a unified client-side API.

---

**1. Prerequisites & Setup**

To use LMS in Visualforce:

* The Visualforce page **must be embedded inside Lightning Experience** (e.g., standard page layout, Lightning App Page, or utility bar). Standalone Visualforce accessed via direct URL outside of Lightning does not support LMS.
* Reference the message channel using the global Visualforce expression `{!$MessageChannel.YourChannelName__c}`.

---

**2. Publisher Visualforce Page**

To publish, pass the message channel reference and a JSON payload to `$Lightning.messageService.publish()`.

```html
<apex:page>
    <div>
        <h3>Visualforce Publisher</h3>
        <input type="text" id="filterInput" placeholder="Enter filter value..." />
        <button onclick="broadcastFilter()">Broadcast via LMS</button>
    </div>

    <script>
        // Reference the Message Channel using the global VF expression
        const FILTER_CHANNEL = "{!$MessageChannel.FilterChangeChannel__c}";

        function broadcastFilter() {
            const inputVal = document.getElementById("filterInput").value;

            const payload = {
                searchTerm: inputVal,
                activeFilter: "Visualforce-Source"
            };

            // Broadcast message across the Lightning container
            sforce.one.publish(FILTER_CHANNEL, payload); 
            // Note: $Lightning.messageService.publish(FILTER_CHANNEL, payload) is also supported
        }
    </script>
</apex:page>

```

---

**3. Subscriber Visualforce Page**

To subscribe, call `$Lightning.messageService.subscribe()`. Unlike LWC or Aura (which have declarative framework lifecycles), Visualforce requires **explicit subscription handling and manual cleanup** when the page unloads.

```html
<apex:page>
    <div>
        <h3>Visualforce Subscriber</h3>
        <p>Search Term: <span id="displaySearchTerm">None</span></p>
        <p>Source: <span id="displaySource">None</span></p>
        <button onclick="stopListening()">Unsubscribe</button>
    </div>

    <script>
        const FILTER_CHANNEL = "{!$MessageChannel.FilterChangeChannel__c}";
        let subscriptionRef = null;

        function subscribeToChannel() {
            if (!subscriptionRef) {
                // Subscribe with a callback and optional scope configuration
                subscriptionRef = sforce.one.subscribe(
                    FILTER_CHANNEL,
                    handleMessage,
                    { scope: "APPLICATION" } // Options: "APPLICATION" or default active area
                );
            }
        }

        function handleMessage(message) {
            if (message) {
                document.getElementById("displaySearchTerm").innerText = message.searchTerm || "";
                document.getElementById("displaySource").innerText = message.activeFilter || "";
            }
        }

        function stopListening() {
            if (subscriptionRef) {
                sforce.one.unsubscribe(subscriptionRef);
                subscriptionRef = null;
            }
        }

        // Initialize subscription when the DOM is ready
        window.addEventListener("DOMContentLoaded", subscribeToChannel);

        // Clean up when the iframe is destroyed / navigated away
        window.addEventListener("unload", stopListening);
    </script>
</apex:page>

```

> **API Note:** Both `sforce.one.publish()` / `sforce.one.subscribe()` and `$Lightning.messageService.publish()` / `$Lightning.messageService.subscribe()` interact with the same message bus. Using `sforce.one` is the standard convention inside Visualforce.

---

**Key Nuances & Gotchas for Visualforce**

* **iFrame Initialization Delays:** The `$Lightning.messageService` library is injected asynchronously into the page. If your script attempts to publish or subscribe immediately on raw script execution, the API might not yet be defined. Wrap initial calls inside `window.addEventListener('DOMContentLoaded', ...)` or check for API existence.
* **Manual Cleanup is Mandatory:** Visualforce does not have reactive component lifecycle hooks like LWC's `disconnectedCallback` or Aura's auto-cleanup. Always unregister via `sforce.one.unsubscribe(subscriptionRef)` on `window.addEventListener('unload', ...)` to prevent dangling listener leaks in the parent Lightning container.
* **Serialization Integrity:** All data passed between Visualforce iframes and the outer Lightning runtime must cross the `window.postMessage` boundary. Ensure your payload consists purely of serializable JSON data (primitives, plain objects, arrays) and contains no DOM elements or function references.