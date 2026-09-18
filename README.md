# Salesforce LWC


### File Organization

```bash
lwc-mastery-hub/
├── README.md                          # Visual index, roadmap progress, setup steps
├── sfdx-project.json                  # Multi-package configuration
├── package.json                       # Jest, ESLint, Prettier scripts
│
├── modules/                           # Progressive learning by category
│   ├── 01-foundations/
│   │   ├── js-cheatsheet/             # Markdown + pure JS snippets (ES6+, Promises)
│   │   └── main/default/lwc/          # Hello world, basic template iteration
│   ├── 02-component-core/
│   │   └── main/default/lwc/          # Lifecycle demo, custom getters, slots
│   ├── 03-styling-design/
│   │   └── main/default/lwc/          # SLDS blueprints, design tokens, scoped CSS
│   ├── 04-data-access/
│   │   └── main/default/lwc/          # LDS forms, @wire uiRecordApi, GraphQL
│   ├── 05-communication/
│   │   └── main/default/
│   │       ├── lwc/                   # Event bubbling, LMS publisher & subscriber
│   │       └── messageChannels/       # SampleMessageChannel.messageChannel-meta.xml
│   ├── 06-navigation-services/
│   │   └── main/default/lwc/          # NavigationMixin targets, custom toast/modals
│   ├── 07-third-party-libraries/
│   │   └── main/default/
│   │       ├── staticresources/       # Chart.js, Confetti.js, Lodash zip files
│   │       └── lwc/                   # Components using loadScript / loadStyle
│   └── 08-enterprise-testing/
│       └── main/default/lwc/          # Components paired with __tests__/*.test.js
│
├── snippets/                          # Fast-reference patterns & reusable helpers
│   ├── apex-patterns/                 # Cacheable handlers, dynamic SOQL wrappers
│   ├── js-utils/                      # Debounce, deepClone, formatters
│   └── recipes/                       # "How to pass data up", "Dynamic modal trigger"
│
└── projects/                          # Production-grade mini-apps
    ├── 01-contact-batch-editor/       # Inline edit datatable with LDS + draft values
    ├── 02-live-weather-dashboard/     # Callout integration + Chart.js via static resource
    └── 03-interactive-product-picker/ # LMS + Flow integration + screen actions

```