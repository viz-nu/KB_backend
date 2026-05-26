# KB Backend — API Reference (Frontend)

This backend exposes a **single GraphQL endpoint**. There are no REST resource routes (`/api/users`, etc.). All application data flows through `POST /graphql`.

---

## Quick reference

| Item | Value |
|------|--------|
| **Local URL** | `http://localhost:8080/graphql` |
| **Production** | `https://kbbackend-production.up.railway.app/graphql` |
| **Protocol** | HTTP `POST`, `Content-Type: application/json` |
| **Auth header** | `Authorization: Bearer <accessToken>` |
| **Access token TTL** | 1 hour |
| **Refresh token TTL** | 7 days |
| **Introspection** | Enabled (Apollo Studio / codegen) |
| **Real-time** | None (no subscriptions, WebSocket, or SSE) |

---

## Making requests

### Request body

```json
{
  "operationName": "Projects",
  "query": "query Projects($page: Int) { projects(page: $page) { data { _id name } PaginationMetaData { totalDocuments } } }",
  "variables": { "page": 1 }
}
```

### Headers

| Header | Required | Notes |
|--------|----------|-------|
| `Content-Type` | Yes | `application/json` |
| `Authorization` | Most operations | `Bearer <accessToken>` |

### CORS

- `credentials: true` — use `credentials: 'include'` in `fetch` if you send cookies (auth does **not** use cookies today; Bearer token is required).
- Allowed dev origins: `http://localhost:5174`, `3000`, `8080`, plus Apollo Studio and the production host.

---

## Authentication

### Public operations (no Bearer token)

These operations skip JWT validation. You **must** use one of these operation names:

| Operation name | Use for |
|----------------|---------|
| `Public` | `login`, `newAccessToken` |
| `IntrospectionQuery` | Schema introspection (tools) |

**Important:** `login` and `newAccessToken` are not protected by scope directives, but the HTTP layer still requires the operation to be named `Public` (or introspection) to skip the Bearer check.

### Login

```http
POST /graphql
Content-Type: application/json

{
  "operationName": "Public",
  "query": "mutation Public($email: String!, $password: String!) { login(email: $email, password: $password) { accessToken refreshToken user { _id name email role scopes projects { _id name code } } } }",
  "variables": {
    "email": "user@example.com",
    "password": "your-password"
  }
}
```

**Success response** (see [Response envelope](#response-envelope)):

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "login": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "user": { "_id": "...", "name": "...", "email": "...", "role": "field_engineer", "scopes": ["activity:read", "..."], "projects": [] }
    }
  }
}
```

Store `accessToken` and `refreshToken`. Send `accessToken` on every authenticated request.

### Refresh access token

```http
POST /graphql
Content-Type: application/json

{
  "operationName": "Public",
  "query": "mutation Public($rt: String!) { newAccessToken(refreshToken: $rt) }",
  "variables": { "rt": "<refreshToken>" }
}
```

Returns a new access token string in `data.newAccessToken`.

### Authenticated requests

```http
POST /graphql
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "operationName": "Me",
  "query": "query Me { me { _id name email role scopes projects { _id name code } spans { _id name status } } }"
}
```

When the access token expires (~1h), call `newAccessToken` with the refresh token, then retry with the new access token.

---

## Response envelope

### Success

Successful GraphQL responses are **wrapped** by the server:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "<rootFieldName>": { }
  }
}
```

- Read your payload from **`response.data`** (not the top-level GraphQL `data` key directly in some clients — unwrap this envelope in your API layer).
- `__typename` fields are stripped from nested objects.

### Errors

When GraphQL returns errors, the wrapper is **not** applied. Shape:

```json
{
  "errors": [
    {
      "message": "Human-readable message",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

### Common error codes

| `extensions.code` | When |
|---------------------|------|
| `UNAUTHENTICATED` | Missing/invalid/expired Bearer token |
| `FORBIDDEN` | User lacks required scope for the field |
| `USER_NOT_FOUND` | User lookup failed |
| `INVALID_PASSWORD` | Wrong password on login |
| `PROJECTS_NOT_FOUND` | Invalid project IDs on user create/update |
| `SPANS_NOT_FOUND` | One or more span IDs in `createUser` do not exist |
| `PROJECT_NOT_FOUND` | Project missing |
| `ACTIVITY_NOT_FOUND` | Activity missing |
| `ACTIVITY_NOT_UPDATED` | Status/lineItems update failed |
| `TOKEN_NOT_FOUND` | Refresh token not in DB |
| `TOKEN_REVOKED` | Refresh token revoked |
| `TOKEN_EXPIRED` | Refresh token expired |
| `SPAN_NOT_FOUND` | Span missing |
| `UNAUTHORIZED` | Span mutation denied |

---

## Authorization (scopes)

Each user has a `role` and `scopes[]`. The server enforces scopes per field via `@requireScope` / `@requireAnyScope`.

### Scopes by role

| Role | Scopes |
|------|--------|
| `system_admin` | `user:read`, `user:write` |
| `project_admin` | `user:*`, `project:*`, `activity:*`, `span:*` |
| `field_engineer` | `activity:read`, `activity:write`, `project:read`, `span:read`, `user:read`, `user:write` |
| `vendor` | `span:read`, `span:write`, `activity:read`, `activity:write`, `user:read`, `user:write`, `project:read` |

Use `me` or the login `user` object to gate UI (hide buttons the user cannot call). The server still enforces scopes on every request.

### Data scoping (automatic)

Even with the right scope, list/detail results are filtered by the logged-in user:

| Domain | Filter |
|--------|--------|
| **Projects** | Only projects in `user.projects` |
| **Spans** | Only spans in `user.spans` |
| **Activities (list)** | Activities whose span is in `user.spans` |
| **Activity (single)** | Activity whose project is in `user.projects` |

Call **`me`** to get the populated `projects` and `spans` arrays that drive this scoping on the client.

---

## Shared types

### Pagination

All list queries return:

```graphql
type PaginationMetaData {
  page: Int
  limit: Int
  totalPages: Int
  totalDocuments: Int
}
```

Example selection:

```graphql
{
  projects(page: 1, limit: 10) {
    data { _id name code status }
    PaginationMetaData { page limit totalPages totalDocuments }
  }
}
```

### Scalars

| Scalar | Usage |
|--------|--------|
| `DateTime` | ISO date strings |
| `JSON` | Arbitrary JSON (`lineItems`, `measurements`, facets, etc.) |

### Geo (Point)

```graphql
input PointLocationInput {
  type: String!      # "Point"
  coordinates: [Float]!  # [longitude, latitude]
}
```

### Chapter / Item (nested under Project)

```graphql
type Chapter {
  _id: ID
  name: String
  code: String
  color: String
  items: [Item]
}

type Item {
  _id: ID
  label: String
  code: String
  description: String
  measurements: JSON
}
```

---

## Users

**Scopes:** `user:read` / `user:write`

### Queries

| Field | Arguments | Returns |
|-------|-----------|---------|
| `me` | — | `User` (see below) |
| `users` | `page`, `limit`, `projects`, `isActive`, `role`, `includeSelf` | `UserPagination` |
| `user` | `_id: ID!` | `User` |

#### `me` — current user with assignments

Returns the authenticated user. The resolver **always populates** `projects` and `spans` (full `Project` and `Span` objects, not just IDs). Use this after login to load the user’s assigned projects and spans for navigation and scoped lists.

```graphql
query Me {
  me {
    _id
    name
    email
    role
    scopes
    projects {
      _id
      name
      code
      status
    }
    spans {
      _id
      name
      status
      project { _id name }
    }
  }
}
```

> `login` returns a `user` object but does **not** populate `projects` / `spans`. Call `me` once you have an access token to fetch populated assignments.

```graphql
query Users($page: Int, $limit: Int, $projects: [ID]) {
  users(page: $page, limit: $limit, projects: $projects, isActive: true) {
    data { _id name email role designation isActive }
    PaginationMetaData { page totalPages totalDocuments }
  }
}
```

### Mutations

| Field | Arguments | Scope | Returns |
|-------|-----------|-------|---------|
| `login` | `email`, `password` | Public op | `LoginResponse` |
| `newAccessToken` | `refreshToken` | Public op | `String` |
| `createUser` | `userInput` | `user:write` | `User` |
| `updateUser` | `_id`, `userInput` | `user:write` | `User` |

#### `createUser` — `userInput.spans`

Optional list of span IDs to assign to the new user:

- Each ID must exist; otherwise the mutation fails with `SPANS_NOT_FOUND`.
- Stored on the user document as `spans`.
- The new user is also added to each span’s `staff` array (`$addToSet`).

```graphql
mutation CreateUser($input: UserInput!) {
  createUser(userInput: $input) {
    _id name email role projects { _id name }
  }
}
```

```json
{
  "input": {
    "name": "Jane Field",
    "email": "jane@example.com",
    "password": "secret",
    "role": "field_engineer",
    "projects": ["<projectId>"],
    "spans": ["<spanId1>", "<spanId2>"]
  }
}
```

```graphql
input UserInput {
  projects: [ID]
  spans: [ID]
  name: String
  designation: String
  email: String
  role: String
  scopes: [String]
  password: String
}

type User {
  _id: ID
  spans: [Span]
  name: String
  designation: String
  email: String
  role: String
  scopes: [String]
  projects: [Project]
  isActive: Boolean
}
```

Password is never returned on `User`.

---

## Projects

**Scopes:** `project:read` / `project:write`

### Queries

| Field | Arguments | Returns |
|-------|-----------|---------|
| `projects` | `page` (default 1), `limit` (default 10) | `ProjectPagination` |
| `project` | `_id: ID!` | `Project` |

```graphql
query ProjectDetail($id: ID!) {
  project(_id: $id) {
    _id name code description status
    Vault { allotedBudjet spentBudjet }
    chapters {
      _id name code color
      items { _id label code description measurements }
    }
    cumulativeProgress
    createdAt updatedAt
  }
}
```

### Mutations

| Field | Arguments | Returns |
|-------|-----------|---------|
| `createProject` | `projectInput: ProjectInput!` | `Project` |
| `updateProject` | `_id`, `projectInput` | `Project` |
| `deleteProject` | `_id` | `Boolean` |

```graphql
enum ProjectStatusEnum {
  ACTIVE INACTIVE ON_HOLD CANCELLED COMPLETED
}

input ProjectInput {
  name: String
  code: String
  description: String
  Vault: VaultInput
  status: ProjectStatusEnum
  chapters: [ChapterInput]
}

input VaultInput {
  allotedBudjet: Int
  spentBudjet: Int
  logs: JSON
}
```

---

## Spans

**Scopes:** `span:read` / `span:write`

### Queries

| Field | Arguments | Returns |
|-------|-----------|---------|
| `spans` | `page`, `limit`, `projects`, `status`, `startPoints`, `endPoints` | `SpanPagination` |
| `span` | `_id: ID!` | `Span` |
| `spansFacet` | `projects`, `status`, `startPoints`, `endPoints` | `JSON` |

```graphql
enum SpanStatusEnum {
  IN_PROGRESS COMPLETED CANCELLED PENDING
}

type Span {
  _id: ID
  project: Project
  name: String
  startPoint: terminal
  endPoint: terminal
  status: SpanStatusEnum
  chapters: [Chapter]
  Vault: Vault
  staff: [User]
  TargetedValues: [TargetedValues]
  createdAt: DateTime
  updatedAt: DateTime
}

input SpanInput {
  project: ID
  name: String
  startPoint: terminalInput
  endPoint: terminalInput
  status: SpanStatusEnum
  chapters: [ID]
  Vault: VaultInput
  TargetedValues: [TargetedValuesInput]
}
```

### `spansFacet` response shape

```json
{
  "statusCount": [{ "status": "IN_PROGRESS", "count": 4 }],
  "projectCount": [{ "project": { "_id": "...", "name": "...", "code": "..." }, "count": 2 }],
  "startPointCount": [{ "startPoint": "Station A", "count": 1 }],
  "endPointCount": [{ "endPoint": "Station B", "count": 1 }],
  "totalDocuments": 5
}
```

### Mutations

| Field | Arguments | Returns |
|-------|-----------|---------|
| `createSpan` | `spanInput` | `Span` |
| `updateSpan` | `_id`, `spanInput` | `Span` |
| `addStaff` | `_id`, `userID` | `Span` |
| `removeStaff` | `_id`, `userID` | `Span` |

---

## Activities

**Scopes:** `activity:read` / `activity:write`

### Queries

| Field | Arguments | Returns |
|-------|-----------|---------|
| `activities` | `page`, `limit`, `status`, `span`, `project`, `createdBy`, `fromDate`, `toDate` | `ActivityPagination` |
| `activitiesFacet` | `status`, `span`, `project`, `createdBy` | `JSON` |
| `activity` | `_id: ID!` | `Activity` |

```graphql
enum EntryStatusEnum {
  DRAFT SUBMITTED APPROVED REJECTED RETURNED
}

query Activities($page: Int, $status: String, $span: [ID]) {
  activities(page: $page, limit: 20, status: $status, span: $span) {
    data {
      _id status locationDescription lineItems
      chinageFrom chinageTo
      project { _id name }
      span { _id name }
      chapter { _id name }
      createdBy { _id name }
      createdAt
    }
    PaginationMetaData { totalDocuments totalPages }
  }
}
```

### `activitiesFacet` response shape

```json
{
  "statusCount": [{ "status": "SUBMITTED", "count": 5 }],
  "projectCount": [{ "project": { "_id": "...", "name": "...", "code": "..." }, "count": 3 }],
  "createdByCount": [{ "createdBy": { "_id": "...", "name": "...", "email": "..." }, "count": 2 }],
  "spanCount": [{ "span": { "_id": "...", "name": "...", "startPoint": {}, "endPoint": {} }, "count": 1 }],
  "totalDocuments": 10
}
```

### Mutations

| Field | Arguments | Notes | Returns |
|-------|-----------|-------|---------|
| `createActivity` | `activityInput` | Optional `chinageFrom` / `chinageTo` (chainage range) | `Activity` |
| `updateActivityStatus` | `_id`, `statusUpdateInput` | Appends remark from `note` | `Activity` |
| `updateActivity` | `_id`, `lineItems` | Sets `status` to `SUBMITTED`; only creator | `Activity` |
| `deleteActivity` | `_id` | — | `Boolean` |

```graphql
type Activity {
  _id: ID
  project: Project
  span: Span
  chapter: Chapter
  status: EntryStatusEnum
  locationDescription: String
  lineItems: JSON
  chinageFrom: Float
  chinageTo: Float
  createdBy: User
  createdAt: DateTime
  updatedAt: DateTime
}

input ActivityInput {
  spanId: ID
  lineItems: JSON
  chapter: ID
  locationDescription: String
  remarks: String
  adminRemark: String
  returnReason: String
  status: String
  chinageFrom: Float
  chinageTo: Float
}

input statusUpdateInput {
  status: String
  note: String
}
```

#### `createActivity` — chainage fields

`chinageFrom` and `chinageTo` are optional numeric values (stored as numbers) representing the chainage range for the activity. They are persisted on create and returned on `Activity` queries.

```graphql
mutation CreateActivity($input: ActivityInput!) {
  createActivity(activityInput: $input) {
    _id
    status
    chinageFrom
    chinageTo
    span { _id name }
    project { _id name }
  }
}
```

```json
{
  "input": {
    "spanId": "<spanId>",
    "chapter": "<chapterId>",
    "locationDescription": "Near km 12",
    "chinageFrom": 1200.5,
    "chinageTo": 1250.0,
    "lineItems": {}
  }
}
```

> Field names in the schema are `chinageFrom` / `chinageTo` (as defined in the API).

---

## Frontend integration patterns

### Recommended API client wrapper

```typescript
const GRAPHQL_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/graphql';

type GraphQLResponse<T> =
  | { success: true; message: string; data: T }
  | { errors: { message: string; extensions?: { code?: string } }[] };

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { operationName?: string; token?: string | null }
): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: JSON.stringify({
      operationName: options?.operationName,
      query,
      variables,
    }),
  });

  const json: GraphQLResponse<T> = await res.json();

  if ('errors' in json && json.errors?.length) {
    const code = json.errors[0].extensions?.code;
    throw new Error(`${code ?? 'GRAPHQL_ERROR'}: ${json.errors[0].message}`);
  }

  if (!('success' in json) || !json.success) {
    throw new Error('Unexpected response shape');
  }

  return json.data;
}
```

### Login + token storage example

```typescript
const data = await gql<{ login: { accessToken: string; refreshToken: string; user: User } }>(
  `mutation Public($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken refreshToken
      user { _id name email role scopes }
    }
  }`,
  { email, password },
  { operationName: 'Public' }
);

localStorage.setItem('accessToken', data.login.accessToken);
localStorage.setItem('refreshToken', data.login.refreshToken);
```

### Apollo Client

Point `HttpLink` at `/graphql`. Use an `authLink` to set `Authorization`. For login/refresh, set `operationName: 'Public'` in the operation context or name the operation `Public`.

Use **introspection** against `/graphql` to generate types:

```bash
npx graphql-codegen --schema http://localhost:8080/graphql
```

(Operation must be named `IntrospectionQuery` or use a tool that sets that name.)

---

## Source of truth (backend files)

| Area | Path |
|------|------|
| GraphQL setup & envelope | `src/graphql/index.js` |
| Users | `src/graphql/users/schema.js`, `resolvers.js` |
| Projects | `src/graphql/project/schema.js`, `resolvers.js` |
| Activities | `src/graphql/activity/schema.js`, `resolvers.js` |
| Spans | `src/graphql/span/schema.js`, `resolvers.js` |
| Shared types | `src/graphql/sharedTypes.js` |
| Auth | `src/middleware/auth.js` |
| Roles/scopes | `src/utils/enums.js` |

---

## Checklist for new frontend features

1. Use `POST /graphql` only — no REST paths for app data.
2. Name unauthenticated mutations/queries **`Public`** (login, refresh).
3. Attach `Authorization: Bearer <accessToken>` for everything else.
4. Unwrap **`response.data`** from `{ success, message, data }`.
5. Handle **`errors[].extensions.code`** for auth refresh and permission UI.
6. Check user **`scopes`** before showing create/update/delete actions.
7. Expect **project/span/activity lists** to be pre-filtered to the user’s assignments.
