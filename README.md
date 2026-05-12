# nodox-cli

[![npm version](https://img.shields.io/npm/v/nodox-cli)](https://www.npmjs.com/package/nodox-cli)
[![npm downloads](https://img.shields.io/npm/dw/nodox-cli)](https://www.npmjs.com/package/nodox-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**API documentation that works the moment you run your server — no annotations, no YAML, no setup.**

nodox-cli is an Express middleware that automatically discovers every route in your app, detects request/response schemas using a 5-layer pipeline, and serves a live interactive docs UI at `/__nodox`. Think FastAPI's `/docs`, but for Node.js — the first time you see it, your entire API is already there.

```bash
npm install nodox-cli
```

---

## Why nodox-cli

Annotation-based tools start empty — you get a blank UI and a checklist of work: annotate this route, write this YAML block, run this code generator. Traffic-based tools show routes but leave them schema-less until you hit every endpoint manually. Either way, the documentation is a separate project you maintain alongside your actual code.

nodox-cli is different. Add one line and your existing routes are immediately documented — with detected schemas, an interactive playground, and live schema updates as real requests flow through.

| | nodox-cli | express-oas-generator | swagger-jsdoc | tsoa | Postman |
|---|---|---|---|---|---|
| Setup | One middleware line | Two middleware placements (before + after routes) | Config file + point to routes | TypeScript decorators + codegen step | Manual collection or CLI generator |
| Annotate every route? | No | No | Yes (`@swagger` JSDoc) | Yes (class decorators) | No (but no Express integration) |
| Schema without hitting routes? | Yes | No — needs real traffic | No — needs annotations | No — needs annotations | No |
| Live request playground | Yes, built-in | Via Swagger UI | Via Swagger UI add-on | Via Swagger UI add-on | Separate app |
| Schema from real traffic | Yes (Layer 5) | Yes (only mechanism) | No | No | No |
| Multiple schema detection layers | Yes (5 layers) | No | No | No | No |
| Chain builder / flow simulation | Yes | No | No | No | Separate Flows tool |
| OpenAPI 3.1 export | Yes — `/__nodox/openapi.json` | Via separate tooling | Yes (core output) | Yes (core output) | Manual export |

---

## Quick start

```js
import express from 'express'
import nodox from 'nodox-cli'

const app = express()
app.use(express.json())
app.use(nodox(app))       // add this line

app.get('/users', handler)
app.post('/users', handler)

app.listen(3000)
// → docs live at http://localhost:3000/__nodox
```

That's the entire setup. Every route you've already written will appear in the UI. No annotations, no changes to your existing handlers, no configuration files.

You can also call `nodox()` without passing `app` — it detects the Express app automatically from the first incoming request:

```js
app.use(nodox())   // app detected from req.app at runtime
```

Passing `app` explicitly enables Layer 2 source screening immediately at startup rather than waiting for the first request.

---

> **Nothing below requires any code changes.** nodox-cli detects schema from your existing handlers automatically — no annotations, no wrappers, no extra setup. `validate()` is covered later in this README as a purely optional enhancement. You can skip it entirely and still get full documentation for every route.

## How schema detection works

nodox-cli uses a **5-layer pipeline** to detect request/response schemas. Layers run in priority order — a higher-confidence result is never overwritten by a lower one.

| Layer | Source | What it does |
|---|---|---|
| 1 | `validate()` wrapper | Reads the schema you explicitly attached to a route |
| 2 | Source-code heuristic scan | Parses route handler source for Zod / Joi / yup / express-validator references |
| 3 | Dry-run with mock request | Calls the handler with a synthetic request, observes what it reads and validates |
| 4 | Test suite recording (`.apicache.json`) | Loads shapes recorded from your real test suite |
| 5 | Live `res.json()` interception | Intercepts actual responses as they happen in development |

**express-validator** chains are detected automatically in Layer 2 — no wrapper needed. If your routes use `check()`, `body()`, or `param()` validation chains, nodox-cli extracts field names and detects types directly from the validator names (`isEmail`, `isInt`, `isUUID`, etc.).

**Layers 2–5 run entirely on their own.** You don't write a single extra line for them — they work against your existing code as-is. Layer 1 (`validate()`) is there if you ever want to go further, but it is never required. If you never touch it, the other four layers still run and your entire API is still documented.

One honest caveat: if a handler has **no validation logic at all** (no Zod, Joi, yup, or express-validator — just reading `req.body` directly), there is nothing for Layers 2 and 3 to detect. The route still appears in the UI, but its request body schema will be populated once real traffic flows through Layer 5. Response schema detection is unaffected.

> **Layer 3 runs in a sandbox.** The dry-run calls your handler with a mock request but blocks all outgoing network connections, database calls (covers TCP-based drivers like Postgres, MySQL, MongoDB, Redis), and filesystem writes. Nothing is executed for real — no external API is called, no database row is written, no file is touched. Real requests flowing through the server at the same time are completely unaffected.

---

## A note on validate()

nodox-cli is built on the assumption that most users will never touch `validate()` at all.

The entire detection pipeline — source scanning, dry-runs, test recording, live interception — exists specifically so that your existing, unmodified codebase gets full documentation without any extra work. That is the core promise: no annotations, no changes to your handlers, no manual anything.

`validate()` exists for one specific case: when you want a schema to be *confirmed* rather than detected. It is Layer 1 of 5. If you never use it, the other four layers still run and your routes are still documented.

---

## Explicit schema with validate() (optional)

Wrap a handler with `validate()` to attach a confirmed schema to a route. nodox-cli reads it at Layer 1 and marks those fields as confirmed in the UI. It also validates `req.body` at runtime — returning a structured `400` on failure, or passing the parsed and coerced value to the next handler on success.

Define your schema once, then pass it to `validate()` as a middleware:

```js
import { validate } from 'nodox-cli'
import { z } from 'zod'

const CreateUserSchema = z.object({
  name:  z.string(),
  email: z.string().email(),
  age:   z.number().int().optional(),
})

app.post('/users', validate(CreateUserSchema), async (req, res) => {
  const user = await db.createUser(req.body)   // req.body is validated and coerced
  res.json(user)
})
```

`validate()` accepts **Zod**, **Joi**, **yup**, and plain **JSON Schema** objects:

```js
// Joi
import Joi from 'joi'

const LoginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
})

app.post('/login', validate(LoginSchema), handler)
```

```js
// yup
import * as yup from 'yup'

const ProductSchema = yup.object({
  name:    yup.string().required(),
  price:   yup.number().positive().required(),
  inStock: yup.boolean().default(true),
})

app.post('/products', validate(ProductSchema), (req, res) => {
  res.status(201).json(req.body)
})
```

```js
// Plain JSON Schema — displayed in UI but does not perform runtime validation
// Use Zod/Joi/yup if you need the 400 rejection behaviour
import { validate } from 'nodox-cli'

const OrderSchema = {
  type: 'object',
  properties: {
    productId: { type: 'string' },
    quantity:  { type: 'integer', minimum: 1 },
  },
  required: ['productId', 'quantity'],
}

app.post('/orders', validate(OrderSchema), (req, res) => {
  res.status(201).json({ orderId: 'ord_123', ...req.body })
})
```

**Validation error response format** (Zod/Joi/yup — returned automatically on failure):

```json
{
  "error": "Validation failed",
  "details": [
    { "path": "name",  "message": "Required",       "code": "invalid_type" },
    { "path": "email", "message": "Invalid email",  "code": "invalid_string" }
  ]
}
```

### Document the response schema

Pass a `response` schema to document what the route returns. This is used for display in the UI only — outgoing responses are not validated:

```js
const CreateUserSchema = z.object({ name: z.string(), email: z.string().email() })
const UserResponse     = z.object({ id: z.number(), name: z.string(), email: z.string() })

app.post('/users', validate(CreateUserSchema, { response: UserResponse }), handler)
```

### Multiple response schemas

Pass a `responses` map to document different schemas per HTTP status code. This appears in the UI Schema tab and in the OpenAPI export. Use this when your route returns different shapes for different outcomes:

```js
const CreateUserSchema = z.object({ name: z.string(), email: z.string().email() })
const UserResponse     = z.object({ id: z.number(), name: z.string(), email: z.string() })
const ErrorResponse    = z.object({ error: z.string(), details: z.array(z.any()) })

app.post('/users',
  validate(CreateUserSchema, {
    responses: {
      201: UserResponse,
      400: ErrorResponse,
      409: z.object({ error: z.string() }),
    }
  }),
  handler
)
```

When `responses` is present it takes precedence over `response` in both the UI and the OpenAPI export. Each value accepts Zod, Joi, yup, or a plain JSON Schema object — the same types as the request schema.

### Tag routes for grouping

Pass `tags` to group a route under a named section in the nodox UI sidebar and in the OpenAPI export. Routes sharing a tag are shown together; routes without tags appear below all groups.

```js
app.get('/users',
  validate(z.object({}), { tags: ['Users'] }),
  handler
)

app.post('/users',
  validate(CreateUserSchema, { tags: ['Users'], responses: { 201: UserResponse } }),
  handler
)

app.post('/login',
  validate(LoginSchema, { tags: ['Auth'] }),
  handler
)
```

A route can appear in multiple groups by listing more than one tag:

```js
validate(schema, { tags: ['Users', 'Admin'] })
```

### Strict mode

Pass `strict: true` to reject any fields not declared in the schema — unknown fields return a `400`:

```js
app.post('/users', validate(CreateUserSchema, { strict: true }), handler)
```

---

## Test suite integration

Record real request/response shapes from your existing tests automatically — no changes to test code required:

```bash
npx nodox init    # injects nodox-cli/jest-setup into your Jest/Vitest config
```

`init` also adds `.apicache.json` to your `.gitignore` automatically if one exists.

Recorded shapes are stored in `.apicache.json` and loaded on the next server start. This is Layer 4 — shapes observed from real test data, not synthesized. The cache stores the number of times each route was seen and when it was last recorded, and merges new observations into existing entries rather than overwriting them.

nodox-cli searches for `.apicache.json` upward from your working directory (up to 5 levels), so monorepo setups with a cache at the workspace root are supported without any path configuration.

Run `npx nodox prune` to reset the cache.

---

## UI features

- **Schema tab** — field names, types, required badges, and a confidence indicator per field; per-status response schemas shown separately when declared via `responses`
- **Tag grouping** — routes with `tags` declared via `validate()` are grouped under named headers in the sidebar; routes without tags appear below all groups
- **Playground** — send live requests directly from the browser; path params render as inline inputs; body fields are pre-filled from detected schema; query parameters are documented for GET, DELETE, HEAD, and OPTIONS routes
- **Chain builder** — connect routes on a canvas, wire output fields to input fields, and simulate multi-step flows with `{{step0.fieldName}}` interpolation
- **Environment switcher** — swap the base URL between local, staging, and production without leaving the UI
- **Response diff** — save a baseline response and compare it against subsequent calls to catch regressions
- **OpenAPI export link** — one-click link in the sidebar footer opens `/__nodox/openapi.json` in a new tab

### Schema confidence levels

Every field in the UI is marked with a badge showing how nodox got its schema:

| Badge | How it got there |
|---|---|
| **confirmed** | You used `validate()` explicitly |
| **inferred** | nodox dry-ran your handler or read express-validator chains |
| **observed** | nodox watched real traffic or loaded from `.apicache.json` |
| *(none)* | Route has no data yet |

---

## Chain builder & simulation

The **Chain** tab lets you wire routes together into a multi-step flow and execute them in sequence — without leaving the docs UI.

### Building a chain

1. Click **+** next to any route in the sidebar to drop it onto the canvas.
2. Drag from the right handle of one node to the left handle of another to connect them.
3. Repeat for as many steps as you need. Circular connections are rejected automatically.

### Running a simulation

Click **▶ Simulate** (top-right of the canvas) to open the simulation panel, then **▶ Run all**.

Steps execute in dependency order (topological sort). Each step shows its HTTP status and the full response body once complete. Use **Clear** to reset all outputs while keeping your inputs, so you can tweak values and rerun without rebuilding the canvas.

### Passing data between steps — `{{stepN.field}}`

Use `{{stepN.field}}` in any input field to splice a value from a previous step's response body into the current step. `N` is the zero-based position of the step you want to read from, and `field` is a dot-separated path into its JSON response.

```
{{step0.id}}          → top-level field "id" from step 0's response
{{step0.user.email}}  → nested field
{{step1.token}}       → field from step 1's response
{{step0.0.name}}      → first item of an array response, then "name"
```

**Example flow — create a user, then fetch it:**

| Step | Route | Input |
|------|-------|-------|
| 0 | `POST /users` | `{ "name": "Alice", "email": "alice@example.com" }` |
| 1 | `GET /users/:id` | `:id` → `{{step0.id}}` |

After step 0 responds with `{ "id": 42, "name": "Alice" }`, nodox-cli replaces `{{step0.id}}` with `42` before firing the step 1 request — no copy-pasting required.

**Interpolation works everywhere in a step's inputs:**

- Path parameters (e.g. `:id`, `:token`)
- Individual body fields (when a schema is detected, fields render as a key-value form)
- The raw JSON body textarea (when no schema is detected)

If a referenced step hasn't run yet, or its response isn't JSON, the placeholder is left as-is so you can see exactly what failed.

---

## Options

```js
app.use(nodox(app, {
  uiPath:    '/__nodox',  // URL prefix for the docs UI
  log:       true,        // print startup banner with route count and URL
  schema:    true,        // enable schema detection pipeline
  intercept: true,        // enable live res.json() interception (Layer 5)
  force:     false,       // allow running in NODE_ENV=production
}))
```

nodox-cli is a **no-op in production** by default (`NODE_ENV=production`). Pass `force: true` to override — but do not expose `/__nodox` publicly, as it reveals all routes, detected schemas, and a full request playground.

---

## OpenAPI export

nodox-cli serves a live **OpenAPI 3.1** spec at `/__nodox/openapi.json`. It is generated from the same schema data shown in the UI — no separate configuration, no extra step.

```
GET http://localhost:3000/__nodox/openapi.json
```

The spec includes:

- All discovered routes as OpenAPI path items
- Path parameters (`:id` → `{id}`)
- Query parameters observed from live traffic
- Request body schemas (POST, PUT, PATCH)
- Response schemas — per-status when declared via `responses`, or the single observed/confirmed schema otherwise
- Tags declared via `validate()` for grouping in external tools

You can paste this URL directly into **Swagger UI**, **Redocly**, **Scalar**, or any OpenAPI-compatible viewer. SDK generators like **Speakeasy** or **Fern** can consume it without any extra configuration.

The endpoint is CORS-open (`Access-Control-Allow-Origin: *`) so browser-based tools can fetch it directly.

---

## CLI

```bash
npx nodox init    # set up test suite integration (Jest or Vitest); updates .gitignore
npx nodox prune   # clear .apicache.json
npx nodox status  # print route count and schema coverage per route
```

`npx nodox status` output example:

```
◆ nodox status

  Routes tracked: 6
  Schema coverage:

  GET  /users          confirmed  (validate)
  POST /users          confirmed  (validate)
  GET  /users/:id      inferred   (dry-run)
  PUT  /users/:id      observed   (traffic)
  DELETE /users/:id    observed   (traffic)
  GET  /health         —          (no data yet)
```

---

## Full control — you decide how much nodox does

nodox works in three modes depending on how much control you want:

**Mode 1 — Zero config (fully automatic)**
Add one line. nodox handles everything. No other changes.

```js
app.use(nodox(app))
```

**Mode 2 — Selective validation**
Keep zero-config for most routes. Use `validate()` only on the routes where you want confirmed schemas and runtime validation.

```js
app.use(nodox(app))

app.get('/users', handler)                                    // auto-detected
app.post('/users', validate(CreateUserSchema), handler)       // confirmed + validated
app.get('/users/:id', handler)                                // auto-detected
app.delete('/users/:id', validate(IdSchema), handler)         // confirmed + validated
```

**Mode 3 — Full manual control**
Use `validate()` on every route with confirmed schemas, tags, and per-status responses. Every field is confirmed. Nothing is inferred.

```js
app.use(nodox(app, { schema: false, intercept: false }))  // disable auto-detection

app.post(
  '/users',
  validate(CreateUserSchema, {
    tags: ['Users'],
    responses: { 201: UserResponse, 400: ErrorResponse },
    strict: true,
  }),
  handler
)
```

You pick the mode. You can mix and match per route. nodox never forces you into a pattern.

---

## TypeScript

Type declarations are included. The package is ESM-first with a CJS fallback.

```ts
import nodox, { validate } from 'nodox-cli'
import type { NodoxOptions, ValidateOptions } from 'nodox-cli'
```

`NodoxOptions` covers all middleware options. `ValidateOptions` covers the `strict`, `response`, `responses`, and `tags` options accepted by `validate()`.

Both Zod v3 and Zod v4 are supported. nodox-cli uses different patching strategies for each (prototype-level for v3, per-instance for v4) and detects the installed version automatically.

---

## Compatibility

- Node.js ≥ 18
- Express ≥ 4 (Express 5 is supported)
- Schema libraries: Zod v3 and v4, Joi, yup, express-validator v6 and v7, plain JSON Schema

---

## License

MIT
