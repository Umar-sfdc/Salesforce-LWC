# JavaScript Destructuring

**Destructuring** is a JavaScript syntax that lets you unpack values from arrays or properties from objects directly into distinct variables.

Before ES6, extracting values meant writing repetitive assignment code:

```javascript
// The legacy way
const user = { name: "Alex", role: "Developer", city: "Nagpur" };

const name = user.name;
const role = user.role;
const city = user.city;

```

With destructuring, that collapses into a single declarative line:

```javascript
// Modern destructuring
const { name, role, city } = user;

```

---

### 1. Object Destructuring

Object destructuring matches values **by property name** (keys). The order does not matter.

#### Basic Extraction

```javascript
const person = { firstName: "Jane", age: 28 };

const { firstName, age } = person;
console.log(firstName); // "Jane"
console.log(age);       // 28

```

#### Renaming Variables

If you want the extracted variable to have a different name than the object key, use a colon `:`:

```javascript
const config = { api_key: "secret_123", timeout_ms: 5000 };

const { api_key: apiKey, timeout_ms: timeout } = config;
console.log(apiKey);  // "secret_123"
console.log(timeout); // 5000

```

#### Default Values

If a key is missing or explicitly `undefined`, fallback values prevent errors:

```javascript
const settings = { theme: "dark" };

const { theme, fontSize = 14, autoSave = true } = settings;
console.log(fontSize); // 14 (default applied)

```

*(Note: Defaults trigger **only** when the value is `undefined`. If a property is `null`, `false`, or `0`, the default will not apply).*

#### Nested Object Destructuring

You can dig into nested data structures in one statement:

```javascript
const userProfile = {
  id: 101,
  details: {
    email: "dev@example.com",
    address: { state: "Maharashtra" }
  }
};

const { details: { email, address: { state } } } = userProfile;
console.log(email); // "dev@example.com"
console.log(state); // "Maharashtra"

```

---

### 2. Array Destructuring

Array destructuring matches values **by index position**, not by name. You can name the variables whatever you like.

#### Basic Extraction & Skipping Elements

```javascript
const rgb = [255, 140, 0];

// Extract by position
const [red, green, blue] = rgb;
console.log(red); // 255

// Skip an index using an empty comma
const [, onlyGreen] = rgb;
console.log(onlyGreen); // 140

```

#### Swapping Variables Without a Temp Variable

Array destructuring is the cleanest way to swap two variables in JavaScript:

```javascript
let a = 1;
let b = 2;

[a, b] = [b, a];
console.log(a); // 2
console.log(b); // 1

```

#### Default Values

Just like objects, array items can define fallbacks for undefined slots:

```javascript
const scores = [95];

const [math, physics = 80] = scores;
console.log(physics); // 80

```

---

### 3. Destructuring with Rest (`...`)

The **rest pattern** (`...`) collects remaining items into a single container. It must always appear as the **last** element in the destructuring pattern.

#### In Objects

```javascript
const employee = { id: 1, name: "Sam", dept: "IT", salary: 70000 };

const { salary, ...publicProfile } = employee;
console.log(salary);        // 70000
console.log(publicProfile); // { id: 1, name: "Sam", dept: "IT" }

```

#### In Arrays

```javascript
const runners = ["Alice", "Bob", "Charlie", "David"];

const [winner, runnerUp, ...others] = runners;
console.log(winner); // "Alice"
console.log(others); // ["Charlie", "David"]

```

---

### 4. Function Parameter Destructuring

Destructuring directly inside function parameters is one of the most widely used patterns in modern JavaScript, UI frameworks, and component design.

#### Handling Configuration Objects

Instead of taking a generic `options` object:

```javascript
// Clean & self-documenting
function createCard({ title, width = 300, isVisible = true } = {}) {
  console.log(`Rendering ${title}, width: ${width}, visible: ${isVisible}`);
}

createCard({ title: "Product Card", width: 400 });
createCard(); // Defaults kick in safely because the param has a default `= {}`

```

---

### 5. Common Pitfalls & Limitations

* **Destructuring `null` or `undefined` throws a TypeError:**
```javascript
const user = null;
const { name } = user; // TypeError: Cannot destructure property 'name' of null

```


*Solution:* Provide a fallback default:
```javascript
const { name } = user || {};

```


* **Reassignment without declaration needs parentheses:**
When reassigning existing variables via object destructuring without `const` or `let`, JavaScript thinks `{}` is a code block:
```javascript
let width, height;
// SyntaxError: Unexpected token '='
// { width, height } = getDimensions();

// Correct: Wrap the entire statement in parentheses
({ width, height } = getDimensions());

```


* **Deeply nested destructuring loses intermediate objects:**
```javascript
const { details: { email } } = userProfile;

```


Here, `email` is created as a variable, but `details` is **not**. If you also need the `details` object itself, you must extract it separately or duplicate it:
```javascript
const { details, details: { email } } = userProfile;

```