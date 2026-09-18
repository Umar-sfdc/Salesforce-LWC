# JavaScript Promise async/await

JavaScript runs on a **single thread**, meaning it executes one operation at a time. If an operation takes time—such as fetching data from an API, reading a file, or querying a database—JavaScript cannot simply freeze the browser or server while waiting.

Instead of blocking execution, JavaScript handles long-running tasks **asynchronously**.

What to pracitce? [Go to Proimse-aync-await Snippets](../../snippets/promise-async-await/)

---

### 1. The Core Problem: Why We Need Promises

Before Promises, asynchronous code relied entirely on **callbacks** (passing a function to be executed once an operation finishes). When multiple asynchronous actions depended on each other, code quickly spiraled into **Callback Hell** (or the "Pyramid of Doom"):

```javascript
// The legacy callback approach:
getUser(userId, function(user) {
  getOrders(user.id, function(orders) {
    getOrderDetails(orders[0].id, function(details) {
      applyDiscount(details, function(finalPrice) {
        console.log("Final total:", finalPrice);
      });
    });
  });
});

```

Callback-based code is hard to read, difficult to debug, and fragile when handling errors at each nested level.

---

### 2. What Is a Promise?

A **Promise** is an object representing the eventual completion (or failure) of an asynchronous operation and its resulting value.

A Promise can only be in one of **three states**:

* **`Pending`**: The initial state. The asynchronous operation is still in progress.
* **`Fulfilled`**: The operation succeeded (`resolve()` was called).
* **`Rejected`**: The operation failed (`reject()` was called).

Once a Promise is either fulfilled or rejected, it is **settled** and its state can never change again.

#### Creating a Promise from Scratch

```javascript
const fetchUserData = new Promise((resolve, reject) => {
  const success = true;

  setTimeout(() => {
    if (success) {
      resolve({ id: 101, name: "Jordan" }); // Moves to Fulfilled
    } else {
      reject(new Error("Failed to load user")); // Moves to Rejected
    }
  }, 1000);
});

```

#### Consuming a Promise with `.then()`, `.catch()`, and `.finally()`

```javascript
fetchUserData
  .then((data) => {
    console.log("User retrieved:", data.name);
    return data.id; // Returns a new Promise to chain next
  })
  .then((id) => {
    console.log("User ID is:", id);
  })
  .catch((error) => {
    console.error("An error occurred:", error.message);
  })
  .finally(() => {
    console.log("Operation finished (cleanup runs here).");
  });

```

---

### 3. Modern Syntax: `async` / `await`

Introduced in ES2017, `async` and `await` are syntactic sugar over Promises. They allow you to write asynchronous code that reads sequentially, just like synchronous code.

* **`async` keyword:** Declares that a function returns a Promise. Any non-Promise return value is automatically wrapped in `Promise.resolve()`.
* **`await` keyword:** Pauses the execution of the `async` function until the Promise settles. It unwraps the resolved value or throws an error if the Promise rejects. *(Can only be used inside `async` functions or at the top level of modern ES modules).*

#### Rewriting the Chain with `async` / `await` and `try...catch`

```javascript
async function displayUserSummary(userId) {
  try {
    const user = await getUser(userId);
    const orders = await getOrders(user.id);
    const details = await getOrderDetails(orders[0].id);
    const finalPrice = await applyDiscount(details);

    console.log("Final total:", finalPrice);
  } catch (error) {
    // Catches any rejection that occurs in any of the steps above
    console.error("Failed to complete order workflow:", error.message);
  } finally {
    console.log("Workflow complete.");
  }
}

```

---

### 4. Running Promises in Parallel: `Promise.all` vs `Promise.allSettled`

When tasks do not depend on each other, running them sequentially with consecutive `await` statements slows down your program unnecessarily.

#### The Sequential Bottleneck (Slow)

```javascript
// Takes 3 seconds total (1s + 1s + 1s)
const user = await fetchUser();       // 1 second
const posts = await fetchPosts();     // 1 second
const metrics = await fetchMetrics(); // 1 second

```

#### Parallel Execution (Fast)

```javascript
// Takes only 1 second total (all run at the same time)
const [user, posts, metrics] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchMetrics()
]);

```

#### Choosing the Right Combinator

| Combinator | Behavior | Use Case |
| --- | --- | --- |
| **`Promise.all([...])`** | Resolves when **all** succeed; rejects immediately if **any single one** fails ("all or nothing"). | Critical workflows where one failure invalidates the entire job (e.g., checkout). |
| **`Promise.allSettled([...])`** | Waits for **all** to finish, regardless of success or failure. Returns an array of `{ status, value/reason }`. | Independent dashboards where a single widget failure shouldn't crash the page. |
| **`Promise.race([...])`** | Settles as soon as the **first** Promise completes (success or failure). | Request timeouts (racing an API call against a timer). |
| **`Promise.any([...])`** | Resolves as soon as the **first** Promise fulfills (ignores rejections unless all fail). | Querying multiple mirrors/replicas to take the fastest successful result. |

---

### 5. Practical Tips for Beginners

* **Always handle errors:** An unhandled rejected Promise triggers an `UnhandledPromiseRejection` warning or crashes your process in Node.js. Always use `.catch()` or wrap `await` calls in a `try...catch` block.
* **Avoid unnecessary wrapping:** If a function already returns a Promise (like `fetch()`), do not wrap it inside `new Promise(...)`:
```javascript
// Bad practice:
function getScore() {
  return new Promise((resolve) => {
    fetch('/api/score').then(res => resolve(res.json()));
  });
}

// Best practice:
async function getScore() {
  const res = await fetch('/api/score');
  return res.json();
}

```


* **Be careful in `Array.prototype.forEach`:** `forEach` does not wait for `async` callbacks to finish. Use `for...of` loops for sequential execution or `Promise.all(array.map(...))` for concurrent execution:
```javascript
// Does NOT wait for requests to finish:
items.forEach(async (item) => {
  await saveItem(item);
});

// Correct (sequential):
for (const item of items) {
  await saveItem(item);
}

// Correct (concurrent):
await Promise.all(items.map((item) => saveItem(item)));

```



---

### 6. Limitations & Common Pitfalls

* **`await` blocks local function flow:** While `await` pauses execution inside its specific `async` function, it does **not** freeze the browser or other scripts. However, placing `await` on unrelated tasks sequentially will inadvertently hurt your app's performance.
* **Promises cannot be cancelled natively:** Standard JavaScript Promises cannot be aborted once created. To cancel network requests, you must pair them with modern browser APIs like `AbortController`.
* **Single resolution:** A Promise represents a one-time event; once resolved or rejected, it cannot emit new values. For repeated events (like user clicks, WebSocket messages, or mouse movements), use event listeners, Streams, or Observables instead.

