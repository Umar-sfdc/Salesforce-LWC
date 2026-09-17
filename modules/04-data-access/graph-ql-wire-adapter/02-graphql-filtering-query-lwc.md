# GraphQL in LWC

The **GraphQL Wire Adapter** (`lightning/uiGraphQLApi`) brings the power of GraphQL directly into Lightning Web Components. Built on top of the Salesforce User Interface API (UI API), it enables querying multiple related objects in a single declarative request, enforces user Object/Field-Level Security (FLS/CRUD) automatically, and seamlessly integrates with the **Lightning Data Service (LDS)** client-side cache (including offline support in the Salesforce mobile app).

---

### Core Syntax & Querying Structure

The adapter uses the **Relay specification** for collections. Instead of flat lists, sets of records are modeled as `edges` containing `node` objects. Field values are returned wrapped in metadata objects (typically `{ value, displayValue }`).

To use it, import `gql` and `graphql` from `lightning/uiGraphQLApi`:

```javascript
import { LightningElement, wire } from 'lwc';
import { gql, graphql } from 'lightning/uiGraphQLApi';

const GET_ACCOUNTS_AND_CONTACTS = gql`
  query GetAccounts {
    uiapi {
      query {
        Account(first: 5) {
          edges {
            node {
              Id
              Name {
                value
                displayValue
              }
              AnnualRevenue {
                value
                displayValue
              }
              Contacts {
                edges {
                  node {
                    Id
                    LastName {
                      value
                    }
                    Email {
                      value
                    }
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

export default class AccountGraphQLList extends LightningElement {
    accounts = [];
    errors;

    @wire(graphql, { query: GET_ACCOUNTS_AND_CONTACTS })
    wiredGraphQL({ data, errors }) {
        if (data) {
            // Flatten the Relay response structure for simple template iteration
            this.accounts = data.uiapi.query.Account.edges.map(edge => ({
                id: edge.node.Id,
                name: edge.node.Name.value,
                revenue: edge.node.AnnualRevenue.displayValue,
                contacts: edge.node.Contacts.edges.map(cEdge => ({
                    id: cEdge.node.Id,
                    lastName: cEdge.node.LastName.value,
                    email: cEdge.node.Email.value
                }))
            }));
            this.errors = undefined;
        } else if (errors) {
            this.errors = errors;
            this.accounts = [];
        }
    }
}

```

---

### Filtering & Ordering with Reactive Variables

Filtering in UI API GraphQL uses the `where` argument, while sorting uses `orderBy`. To make these responsive to user input, define dynamic variables inside the `query` block and bind them using the `variables` property in `@wire`.

#### Common Filter Operators

* **Equality/Comparison:** `eq`, `ne`, `lt`, `lte`, `gt`, `gte`
* **Pattern Matching:** `like` (supports `%` wildcards)
* **Sets:** `in`, `nin`
* **Logical Combinations:** `and`, `or`, `not`

#### Implementation Example

```javascript
import { LightningElement, wire } from 'lwc';
import { gql, graphql } from 'lightning/uiGraphQLApi';

const SEARCH_ACCOUNTS = gql`
  query SearchAccounts($searchKey: String, $minRevenue: Currency) {
    uiapi {
      query {
        Account(
          where: {
            and: [
              { Name: { like: $searchKey } }
              { AnnualRevenue: { gte: $minRevenue } }
            ]
          }
          orderBy: { Name: { order: ASC } }
          first: 10
        ) {
          edges {
            node {
              Id
              Name { value }
              AnnualRevenue { value }
            }
          }
        }
      }
    }
  }
`;

export default class FilteredAccounts extends LightningElement {
    searchKeyword = 'Acme%';
    minimumRevenue = 50000;

    // Reactive parameter binding
    @wire(graphql, {
        query: SEARCH_ACCOUNTS,
        variables: '$graphqlVariables'
    })
    wiredAccounts;

    get graphqlVariables() {
        return {
            searchKey: this.searchKeyword,
            minRevenue: this.minimumRevenue
        };
    }

    handleSearch(event) {
        this.searchKeyword = `${event.target.value}%`;
    }
}

```

---

### Cursor-Based Pagination

Salesforce UI API GraphQL uses **cursor-based pagination** rather than offset-based pagination (`first` and `after` arguments), which scales cleanly without database offset penalties.

* `first`: Integer specifying how many records to fetch.
* `after`: The opaque cursor string of the last record in the previous page.
* `pageInfo`: Metadata block returning `hasNextPage` and `endCursor`.

#### Complete Pagination Pattern

```javascript
import { LightningElement, wire } from 'lwc';
import { gql, graphql } from 'lightning/uiGraphQLApi';

const PAGINATED_OPPORTUNITIES = gql`
  query PaginatedOpportunities($pageSize: Int, $cursor: String) {
    uiapi {
      query {
        Opportunity(first: $pageSize, after: $cursor, orderBy: { CreatedDate: { order: DESC } }) {
          totalCount
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          edges {
            cursor
            node {
              Id
              Name { value }
              Amount { displayValue }
              StageName { value }
            }
          }
        }
      }
    }
  }
`;

export default class OpportunityPaginator extends LightningElement {
    pageSize = 10;
    cursor = null; // null fetches the initial page
    pageHistory = []; // Stack to track backward navigation cursors

    opportunities = [];
    pageInfo;
    totalRecords = 0;

    @wire(graphql, {
        query: PAGINATED_OPPORTUNITIES,
        variables: '$variables'
    })
    wiredResult({ data, errors }) {
        if (data) {
            const oppData = data.uiapi.query.Opportunity;
            this.totalRecords = oppData.totalCount;
            this.pageInfo = oppData.pageInfo;
            this.opportunities = oppData.edges.map(edge => ({
                id: edge.node.Id,
                name: edge.node.Name.value,
                amount: edge.node.Amount.displayValue,
                stage: edge.node.StageName.value
            }));
        } else if (errors) {
            console.error(errors);
        }
    }

    get variables() {
        return {
            pageSize: this.pageSize,
            cursor: this.cursor
        };
    }

    get isNextDisabled() {
        return !this.pageInfo?.hasNextPage;
    }

    get isPrevDisabled() {
        return this.pageHistory.length === 0;
    }

    handleNext() {
        if (this.pageInfo?.hasNextPage) {
            // Push current cursor so we can return back
            this.pageHistory.push(this.cursor);
            this.cursor = this.pageInfo.endCursor;
        }
    }

    handlePrevious() {
        if (this.pageHistory.length > 0) {
            // Pop the previous cursor off the history stack
            this.cursor = this.pageHistory.pop();
        }
    }
}

```

---

### Tips & Architecture Nuances

* **Direct LDS Cache Sharing:** If an imperative Apex call or UI API record form modifies a record, the GraphQL wire updates automatically as long as the record IDs and requested fields overlap with the modified record.
* **Always Extract `{ value }`:** Unlike standard Apex JSON serialization, UI API fields are wrapped objects. Referencing `record.Name` directly yields an object, not a string; target `record.Name.value` (or `displayValue` for formatted Currencies/Dates).
* **Aggregate Limitations:** While UI API GraphQL supports `totalCount`, complex grouping (`GROUP BY`) and aggregate functions (`AVG()`, `SUM()`) are not supported—use Apex for statistical reporting queries.
* **SOQL Injection Immunity:** Because variable parameters (`$searchKey`, `$cursor`) are strictly typed via the GraphQL schema, the engine prevents SOQL injection natively without manual sanitization or string escaping.

---

### Key Limitations

| Constraint | Limit / Rule |
| --- | --- |
| **Max Page Size (`first`)** | Maximum **50 records** per page request. |
| **Query Depth** | Maximum query depth is **5 levels** of object relationships. |
| **Object Support** | Limited to objects supported by the **UI API** (excludes objects like `UserLicense`, `AsyncApexJob`, or certain Setup entities). |
| **DML / Mutations** | The LWC GraphQL adapter is currently **Read-Only (Query only)**. Creating/updating records must be handled via `lightning/uiRecordApi` (`createRecord`, `updateRecord`) or Apex. |