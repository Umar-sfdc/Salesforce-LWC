// creating a custom element from scratch using shadow dom.

class EncapsulateCard extends HTMLElement {

    constructor() {
        super()

        // create and attach the shadow dom to custom element.
        const shadow = this.attachShadow({mode : "open"})

        // add scope and markup
        shadow.innerHTML = `
            <style>
                /* These styles ONLY apply inside this component */
                :host {
                    display: inline-block;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    font-family: sans-serif;
                }

                .card {
                    padding : 12px;
                    margin : 12px;
                    border : 2px dotted #dadada;
                }
            </style>

            <div class="card">
                <!-- Slot acts as a placeholder for user-provided HTML -->
                <slot name="title">Default Text</slot>

                <!-- Default unnamed slot -->
                <slot></slot>
            </div>
            
        `;
        
    }
}

customElements.define("encapsulate-card", EncapsulateCard)