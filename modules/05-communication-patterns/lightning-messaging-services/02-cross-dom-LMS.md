# LSM Cross DOM
Cross-DOM communication with **Lightning Message Service (LMS)** bridges components separated by shadow boundaries, distinct component hierarchies, separate page regions, or different runtime containers (LWC, Aura, Visualforce).

Because LWC implements shadow DOM encapsulation, standard DOM events cannot bubble up past shadow roots without `composed: true`, and even then, they cannot cross unrelated component trees. LMS bypasses the DOM tree entirely by operating via a centralized, in-memory event bus managed by the Lightning Experience container.

---

**Cross-DOM Mechanics Across Technologies**

* **LWC to LWC (Unrelated Subtrees):** Standard DOM events stop at the common ancestor. LMS publishes directly to the client-side channel, allowing completely decoupled sibling components in separate page regions (e.g., Header vs. Sidebar) to react without bubbling up through a parent component.
* **LWC to Aura:** Aura does not use standard Shadow DOM encapsulation in the same way, but it cannot directly catch non-composed LWC events. In Aura, the `<lightning:messageChannel>` tag attaches a listener directly to the same channel.
* **LWC / Aura to Visualforce (Cross-iFrame):** Visualforce pages in Lightning Experience are embedded inside `<iframe>` wrappers served from a different domain (`*.visualforce.com` vs. `*.lightning.force.com`). LMS uses secure `window.postMessage` under the hood via the `$Lightning.messageService` JavaScript library to safely navigate browser cross-origin boundaries.

---

**Best Practices & Tips**

* **Manage Subscriptions with Component Lifecycles:**
Always wire `MessageContext` rather than creating a manual context if you are using an LWC inside standard Lightning containers. Wire context automatically unbinds active subscriptions when the component is destroyed.
* **Manually Unsubscribe in `disconnectedCallback`:**
Even though the wire service cleans up when a component is garbage-collected, explicitly calling `unsubscribe(this.subscription)` inside `disconnectedCallback` prevents orphaned listeners if components are dynamically added and removed from the DOM (e.g., via `lwc:if`).
* **Keep Payloads Small and Primitive:**
Pass record IDs, identifiers, or simple state flags rather than massive, deeply nested objects or complex class instances. Passing large payloads increases client-side memory usage and can lead to performance degradation. Let the receiving component query or wire the remaining data using the passed ID.
* **Use `APPLICATION_SCOPE` Deliberately:**
By default, subscriptions only fire if the component is in an active workspace tab or subtab. If you are building a utility bar component, header tool, or global cache that must update regardless of which console tab is focused, supply `{ scope: APPLICATION_SCOPE }`. Avoid using it universally, as it can cause background components to execute unnecessary re-renders.
* **Prefix Custom Channels Cleanly:**
Give your `.messageChannel-meta.xml` files distinct business names (e.g., `OrderSelectedChannel__c`) and document the payload fields in the metadata XML so multiple teams can consume the schema safely.

---

**Limitations & Constraints**

* **Single-Browser-Window Only:**
LMS is strictly an in-memory client-side event bus. It **cannot** communicate across multiple browser tabs, across different users, or between a browser and the Salesforce server. (For server-driven pushes or multi-tab syncing, use Platform Events or Change Data Capture with `lightning/empApi`).
* **Not Supported in All Containers:**
LMS is supported in Lightning Experience, Salesforce Mobile App, and Experience Cloud (LWR/Aura sites). However, it is **not supported** in standalone Visualforce pages running outside of Lightning Experience or in custom external web apps using Lightning Out.
* **Visualforce Requires Domain Readiness:**
In Visualforce, the `$Lightning.messageService` scripts load asynchronously. Subscribing or publishing immediately during page initialization can fail if scripts have not completed their handshake with the parent container.
* **Payload Serialization Overhead:**
When messages cross the iFrame boundary into a Visualforce page, data is serialized and deserialized via `postMessage`. Functions, non-serializable objects, or circular references in the payload will throw errors or be stripped.
* **No Built-in Delivery Guarantees / Replay:**
LMS does not store historical state. If Publisher A broadcasts a message before Subscriber B has mounted and subscribed, Subscriber B will miss the message entirely.