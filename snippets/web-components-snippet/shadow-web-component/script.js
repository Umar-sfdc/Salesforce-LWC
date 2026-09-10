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

                h3 {
                    margin : 2rem;
                    color: #2b6cb0;
                }

                p {
                    margin : 2rem;
                    color: #dadada;
                }
            </style>

            <h3>Shadow Component</h3>
            <p>My paragraph styles will not bleed into the page!</p>
        `;
        
    }
}

customElements.define("encapsulate-card", EncapsulateCard)