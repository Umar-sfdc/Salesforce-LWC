# GraphQL

**GraphQL** is an open-source query language and server-side runtime for APIs, originally developed by Meta. Instead of hitting multiple endpoints to gather related data (as in REST), a client sends a single structured query describing **exactly** the shape of data it needs, and the server returns a matching JSON response.

---

### REST vs. GraphQL

| Feature | REST | GraphQL |
| --- | --- | --- |
| **Data Fetching** | Multiple endpoints (`/users/1`, `/users/1/posts`) | Single endpoint (typically `/graphql`) |
| **Payload Size** | Fixed responses (often leads to over/under-fetching) | Exact fields requested only |
| **Schema & Typing** | Optional/Separate (OpenAPI, Swagger) | Native, strictly typed via Schema Definition Language (SDL) |
| **Versioning** | URI or header versioning (`/v1/`, `/v2/`) | Evolutionary; deprecate fields without breaking existing queries |
| **Operations** | HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) | Queries, Mutations, Subscriptions (transported via POST) |

---

### The Three Core Operations

**1. Query (Read)**

Fetches data without side effects (equivalent to `GET`).

```graphql
query GetUserProfile($userId: ID!) {
  user(id: $userId) {
    id
    name
    email
    orders(limit: 5) {
      id
      totalAmount
      status
    }
  }
}

```

*Response returns the exact same hierarchy:*

```json
{
  "data": {
    "user": {
      "id": "101",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "orders": [
        { "id": "901", "totalAmount": 149.50, "status": "DELIVERED" }
      ]
    }
  }
}

```

**2. Mutation (Write)**

Creates, updates, or deletes data (equivalent to `POST`, `PUT`, `DELETE`). Mutations return the updated data shape in the same trip.

```graphql
mutation CreateNewProduct($input: ProductInput!) {
  createProduct(input: $input) {
    id
    title
    price
    createdAt
  }
}

```

**3. Subscription (Real-Time Streams)**

Maintains an active connection (usually over WebSockets) to push real-time events from server to client when a specific event occurs.

```graphql
subscription OnOrderShipped($userId: ID!) {
  orderShipped(userId: $userId) {
    orderId
    trackingNumber
    estimatedDelivery
  }
}

```

---

### Core Architecture Components

**Schema Definition Language (SDL)**

Defines object types, field data types, nullability, and operational contracts.

```graphql
type User {
  id: ID!              # Non-nullable scalar
  name: String!
  email: String
  role: Role!
  posts: [Post!]!      # Non-nullable list of non-nullable Posts
}

enum Role {
  ADMIN
  USER
  GUEST
}

type Query {
  user(id: ID!): User
}

```

**Resolvers**

Functions on the server that fetch the actual data for each field defined in the schema. Resolvers can query databases, call microservices, or read from caches.

```javascript
// Conceptual Node.js Resolver
const resolvers = {
  Query: {
    user: async (_, { id }, context) => {
      return await context.db.User.findById(id);
    },
  },
  User: {
    // Nested resolver: only executed if the query requested "posts"
    posts: async (parent, _, context) => {
      return await context.db.Post.find({ authorId: parent.id });
    },
  },
};

```

---

### Salesforce Context: GraphQL Wire Adapter

If you are developing inside Salesforce Lightning Web Components (LWC), Salesforce provides a native client-side **GraphQL Wire Adapter** built on the User Interface API (UI API).

* **Offline & Cache-Aware:** Direct access to Lightning Data Service (LDS) client cache and offline persistence in the Salesforce mobile app.
* **Consolidated Fetching:** Allows fetching parent-child hierarchies and cross-object relationships in a single declarative call without writing custom Apex controllers.

```javascript
import { LightningElement, wire } from 'lwc';
import { gql, graphql } from 'lightning/uiGraphQLApi';

const GET_CONTACTS = gql`
  query AccountWithContacts {
    uiapi {
      query {
        Account(where: { Name: { like: "Acme%" } }, first: 5) {
          edges {
            node {
              Id
              Name { value }
              Contacts {
                edges {
                  node {
                    Id
                    LastName { value }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export default class GraphQlDemo extends LightningElement {
    @wire(graphql, { query: GET_CONTACTS })
    propertyOrFunction;
}

```

---

### Architectural Challenges & Limitations

* **The N+1 Database Problem:** If resolving a nested list (e.g., retrieving 50 posts and each post's author), naive resolvers execute 1 query for the list and 50 separate queries for each author.
* *Solution:* Batching and memoization using tools like **DataLoader** or SQL JOIN consolidation.


* **Complex Query Vulnerabilities:** Clients can request deeply nested, recursive relationships (`user -> posts -> author -> posts...`), leading to denial-of-service or database exhaustion.
* *Solution:* Enforce query depth limiting, cost analysis, and execution timeouts.


* **HTTP Caching Friction:** Unlike REST where `GET /products/123` can be cached seamlessly via standard HTTP proxies (Varnish, Cloudflare) using URL keys, GraphQL typically operates via `POST` to a single route.
* *Solution:* Normalized client-side caches (Apollo Client, Relay, LDS) or persisted queries with GET requests.