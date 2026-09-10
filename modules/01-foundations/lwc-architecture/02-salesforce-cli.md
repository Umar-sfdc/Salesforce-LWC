# Salesforce CLI

The **Salesforce CLI** is the command-line tool used to connect your local development environment (your machine, files, and VS Code) with Salesforce orgs.

Instead of building components directly inside the browser setup menu, you write code locally, track it in Git, and use the CLI to create projects, authenticate orgs, deploy components, and run tests.

---

### `sf` vs. `sfdx`

You will frequently see older tutorials reference `sfdx` (e.g., `sfdx force:source:deploy`).

* **The Modern Standard:** The CLI uses the unified **`sf`** executable with noun-verb structure (e.g., `sf project deploy start`).
* **The Legacy:** `sfdx` commands have been deprecated in favor of the cleaner, human-readable `sf` syntax.

---

### The 5 Core Workflows Every Beginner Needs

#### 1. Creating a New Project

Run this to scaffold the folder structure (`force-app/main/default/lwc/...`):

```bash
sf project generate --name my-lwc-project

```

This sets up `sfdx-project.json`, standard config files, and the default directory.

#### 2. Authenticating (Logging into) an Org

Connect the CLI to your Developer Edition, Trailhead Playground, or Sandbox:

```bash
# Opens your browser to log in interactively
sf org login web --alias devOrg --set-default

```

* `--alias devOrg`: Gives this connection a friendly nickname so you don't have to type your username every time.
* `--set-default`: Makes this org the target for all subsequent deploy and retrieve commands.

To verify which orgs you have connected:

```bash
sf org list

```

#### 3. Generating Components Quickly

Rather than creating HTML, JS, and XML files manually, let the CLI scaffold them:

```bash
sf project generate component --name userCard --type lwc --output-dir force-app/main/default/lwc

```

This automatically produces the matching folder and files with correct template boilerplate.

#### 4. Deploying & Retrieving Code

Once you edit your component locally, you sync it with your org:

* **Deploy to the org:**
```bash
# Deploy a specific component
sf project deploy start --source-dir force-app/main/default/lwc/userCard

# Or deploy the entire default directory
sf project deploy start

```


* **Retrieve changes from the org** (e.g., if an admin added a field in Setup):
```bash
sf project retrieve start --source-dir force-app/main/default/lwc/userCard

```



#### 5. Opening Your Org in the Browser

Open your default org directly to your browser without typing passwords:

```bash
sf org open

```

Or open directly to a specific Lightning App or path:

```bash
sf org open --path lightning/app/standard__LightningSales

```

---

### Scratch Orgs vs. Sandboxes

In Salesforce development, you will encounter two main types of test environments:

| Feature | Scratch Org | Sandbox / Developer Edition |
| --- | --- | --- |
| **Lifespan** | Disposable (expires in 1–30 days) | Permanent until deleted |
| **Purpose** | Clean-slate testing, automated CI/CD pipelines | Long-term dev, user acceptance testing |
| **Creation** | Created instantly via CLI: `sf org create scratch` | Created from the Production Org UI |

For beginners, connecting to a free **Developer Edition Org** or **Trailhead Playground** using `sf org login web` is the simplest way to start without configuring scratch org definitions.

---

### Handy Shortcut Commands

```bash
# View Apex debug logs streaming in real-time
sf apex tail log --color

# Run Apex tests
sf apex test run --code-coverage --result-format human

# Run anonymous Apex code
sf apex run

```