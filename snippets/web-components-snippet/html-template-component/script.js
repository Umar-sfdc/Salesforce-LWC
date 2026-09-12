// Define the blueprint once
const userBadgeTemplate = document.createElement('template');
userBadgeTemplate.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 9999px;
      font-family: sans-serif;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #22c55e;
    }
    .name {
      font-weight: 600;
      color: #fff;
    }
  </style>

  <span class="status-dot"></span>
  <span class="name"><slot>Anonymous</slot></span>
`;

class UserBadge extends HTMLElement {
  constructor() {
    super();
    // Attach an isolated Shadow Root
    this.attachShadow({ mode: 'open' });
    
    // Stamp the template clone directly into the Shadow DOM
    this.shadowRoot.appendChild(userBadgeTemplate.content.cloneNode(true));
  }
}

customElements.define('user-badge', UserBadge);