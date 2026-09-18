// Standard Custom Element from scratch.

class ProfileBadge extends HTMLElement {
    // execute when the html is completely parse or added to DOM.
    connectedCallback() {
        const name = this.getAttribute("name") || "Madhost"
        this.innerHTML = `
            <div style = "border : 1px solid #414141; color: #cacaca; font-family: Monospace; font-size:1.5rem; padding : 25px; margin: 20px;">
            <p>Profile Card</p>    
            <strong>Username : ${name}</strong>
            </div>
        `
    }
}

// register custom element.
customElements.define("profile-badge", ProfileBadge)