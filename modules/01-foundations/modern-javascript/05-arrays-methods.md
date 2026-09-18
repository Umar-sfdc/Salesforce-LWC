# JavaScript Arrays Methods
JavaScript arrays come with built-in iteration methods that eliminate traditional `for` loops. Modern array methods follow a **functional approach**: you pass a callback function (typically an arrow function) that runs on each element.

The most critical distinction to keep in mind is:

* **Non-mutating methods:** Return a brand-new array or value without changing the original array (e.g., `map`, `filter`, `reduce`).
* **Mutating methods:** Change the array in-place (e.g., `push`, `splice`, `sort`).

---

### 1. The Core Big Three: `map`, `filter`, and `reduce`

These three methods handle roughly 80% of daily data transformations.

#### `map()`: Transform Every Element

Creates a **new array of the exact same length**, where each item is the result of running your callback on the original item.

```javascript
const prices = [100, 200, 300];

// Double each price
const doubled = prices.map(price => price * 2);
console.log(doubled); // [200, 400, 600]
console.log(prices);  // [100, 200, 300] (Original unchanged)

```

#### `filter()`: Keep Only Matching Elements

Returns a **new array containing only elements that pass a test** (where the callback returns `true`). If no items pass, it returns an empty array `[]`.

```javascript
const products = [
  { name: 'Laptop', inStock: true, price: 50000 },
  { name: 'Mouse', inStock: false, price: 500 },
  { name: 'Keyboard', inStock: true, price: 1500 }
];

const available = products.filter(item => item.inStock);
// [{ name: 'Laptop', ... }, { name: 'Keyboard', ... }]

```

#### `reduce()`: Condense an Array Down to a Single Value

Iterates through the array and carries forward an **accumulator** (`acc`). It is commonly used for sums, counts, or reshaping data.

*Syntax:* `array.reduce((accumulator, currentItem) => { ... }, initialValue)`

```javascript
const expenses = [500, 1200, 350, 40];

// Summing numbers (initialValue = 0)
const total = expenses.reduce((acc, curr) => acc + curr, 0);
console.log(total); // 2090

```

---

### 2. Searching & Finding Elements

| Method | What It Returns | Stops When? |
| --- | --- | --- |
| **`find()`** | The **first matching element** (or `undefined`) | As soon as it finds a match |
| **`findIndex()`** | The **index** of the first match (or `-1`) | As soon as it finds a match |
| **`some()`** | `true` if **at least one** item matches | As soon as 1 match is found |
| **`every()`** | `true` only if **all** items match | As soon as 1 item fails |
| **`includes()`** | `true` if a simple primitive value exists | When found or list ends |

```javascript
const users = [
  { id: 1, name: 'Aarav', role: 'admin' },
  { id: 2, name: 'Pooja', role: 'user' },
  { id: 3, name: 'Rohan', role: 'user' }
];

// 1. Find single object
const pooja = users.find(u => u.id === 2);
// { id: 2, name: 'Pooja', role: 'user' }

// 2. Check if at least one admin exists
const hasAdmin = users.some(u => u.role === 'admin'); // true

// 3. Check if all users are verified
const allAdmins = users.every(u => u.role === 'admin'); // false

// 4. Primitive check
const tags = ['sales', 'tech', 'marketing'];
console.log(tags.includes('tech')); // true

```

---

### 3. Iteration: `forEach()`

Use `forEach()` strictly for **side effects** (logging, updating a UI, saving to an outside variable). It returns `undefined`.

```javascript
const fruits = ['Apple', 'Mango', 'Orange'];

fruits.forEach((fruit, index) => {
  console.log(`${index + 1}: ${fruit}`);
});

```

*(Note: Unlike a traditional `for` loop, you **cannot** use `break` or `continue` inside a `forEach()` callback).*

---

### 4. Method Chaining

Because methods like `filter()` and `map()` return new arrays, you can pipe them together into a readable processing pipeline:

```javascript
const inventory = [
  { name: 'Monitor', price: 12000, category: 'Electronics' },
  { name: 'Notebook', price: 100, category: 'Stationery' },
  { name: 'Headphones', price: 3000, category: 'Electronics' },
  { name: 'Pen', price: 20, category: 'Stationery' }
];

// Task: Find total cost of all Electronics
const totalElectronicsCost = inventory
  .filter(item => item.category === 'Electronics')
  .map(item => item.price)
  .reduce((sum, price) => sum + price, 0);

console.log(totalElectronicsCost); // 15000

```

---

### 5. Flattening Nested Arrays: `flat()` and `flatMap()`

```javascript
// Flatten 1 level deep
const nested = [1, [2, 3], [4, [5]]];
console.log(nested.flat()); // [1, 2, 3, 4, [5]]

// Flatten completely
console.log(nested.flat(Infinity)); // [1, 2, 3, 4, 5]

// Map and flatten at the same time
const sentences = ["Hello world", "JavaScript is fun"];
const words = sentences.flatMap(s => s.split(" "));
console.log(words); // ['Hello', 'world', 'JavaScript', 'is', 'fun']

```

---

### 6. Gotchas & Tips for Beginners

* **The `sort()` trap:** By default, `.sort()` converts elements to strings and compares UTF-16 code units.
```javascript
const nums = [10, 5, 40, 25];
nums.sort();
console.log(nums); // [10, 25, 40, 5] -> 10 comes before 5 alphabetically!

// Always supply a comparator function for numbers:
nums.sort((a, b) => a - b); // [5, 10, 25, 40]

```


* **Mutating vs Non-Mutating:**
* `sort()`, `reverse()`, `splice()` mutate the original array.
* Modern alternatives (ES2023): `toSorted()`, `toReversed()`, and `toSpliced()` perform the exact same work but return a brand new array instead of modifying the source.


* **Don't use `map()` if you don't use the result:** If you only need to loop through items without building a new array, use `forEach()` or `for...of`. Using `map()` just to run a side effect wastes memory by allocating an unused array.