# nodox-cli

[![npm version](https://img.shields.io/npm/v/nodox-cli)](https://www.npmjs.com/package/nodox-cli)
[![npm downloads](https://img.shields.io/npm/dw/nodox-cli)](https://www.npmjs.com/package/nodox-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**API documentation that works the moment you run your server. No annotations, no YAML, no setup.**

nodox-cli is an Express middleware that automatically discovers every route in your app, detects request/response schemas using a 5-layer pipeline, and serves a live interactive docs UI at `/__nodox`. Think FastAPI's `/docs`, but for Node.js. The first time you see it, your entire API is already there.

```bash
npm install nodox-cli
```

---

## Why nodox-cli

Annotation-based tools start empty: you annotate routes, write YAML, run generators. Traffic-based tools show routes but leave them schema-less until you hit every endpoint manually. Either way, documentation is a separate project you maintain alongside your actual code.

nodox-cli is different. Add one line and your existing routes are immediately documented, with detected schemas, an interactive playground, and live schema updates as real requests flow through.

| | nodox-cli | express-oas-generator | swagger-jsdoc | tsoa | swagger-autogen | Postman |
|---|---|---|---|---|---|---|
| Setup | One middleware line | Two middleware placements (before + after routes) | Config file + annotated route files | TypeScript decorators + codegen step | Separate generate script; re-run after route changes; `swagger-ui-express` for UI | Manual collection or CLI generator |
| Annotate every route? | No | No | Yes (`@swagger` JSDoc on every route) | Yes (class decorators) | No for route listing; `#swagger.*` comments needed for body and response schemas | No (but no Express integration) |
| Schema without hitting routes? | Yes, automatic, zero annotations | No, needs real traffic | Via manual `@swagger` annotations only | Via manual TypeScript decorators only | Partial: scans `req.body` access patterns; no Zod/Joi/yup detection | No |
| Live request playground | Yes, built-in | Via Swagger UI | Via Swagger UI add-on | Via Swagger UI add-on | Via Swagger UI (`swagger-ui-express`) | Separate app |
| Schema from real traffic | Yes (Layer 4) | Yes (only mechanism) | No | No | No | No |
| Multiple schema detection layers | Yes (5 layers) | No | No | No | No | No |
| Chain builder / flow simulation | Yes | No | No | No | No | Separate Flows tool |
| OpenAPI 3.1 export | Yes, at `/__nodox/openapi.json` | OpenAPI 3.0 natively (not 3.1); Swagger 2.0 default | Yes (any version you configure) | Yes, 3.1 default since v7 | Static `.json` file; OpenAPI 3.0.0 max (Swagger 2.0 default) | Manual export from Spec Hub |

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

Every route you've already written will appear in the UI. No annotations, no changes to your existing handlers.

You can also call `nodox()` without passing `app`; it detects the Express app automatically from the first incoming request:

```js
app.use(nodox())   // app detected from req.app at runtime
```

Passing `app` explicitly enables Layer 1 source screening immediately at startup rather than waiting for the first request.

---

## How schema detection works

nodox-cli uses a **5-layer pipeline** to detect request/response schemas. Layers 1–4 run automatically against your existing code, no changes needed.

| Layer | Source | What it does |
|---|---|---|
| 1 | Source-code heuristic scan | Parses route handler source for Zod / Joi / yup / express-validator references |
| 2 | Dry-run with mock request | Calls the handler with a synthetic request, observes what it reads and validates |
| 3 | Test suite recording (`.apicache.json`) | Loads shapes recorded from your real test suite |
| 4 | Live `res.json()` interception | Intercepts actual responses as they happen in development |
| 5 *(optional)* | `validate()` wrapper | Explicitly attach a schema when auto-detection isn't enough; produces a `confirmed` badge and validates `req.body` at runtime |

**express-validator** chains are detected automatically in Layer 1, no wrapper needed. If your routes use `check()`, `body()`, or `param()` validation chains, nodox-cli extracts field names and detects types directly from the validator names (`isEmail`, `isInt`, `isUUID`, etc.).

> **Layer 1 and bundlers/minifiers:** Layer 1 reads handler source code as a string to detect validation patterns. If your dev server runs code through Babel, SWC, esbuild, or `tsc`, the source is mangled and Layer 1 cannot match patterns. Fall back to Layers 3–4 (test cache + live interception), or use `validate()` on that specific route.

Layers 1–4 run entirely on their own against your existing code, no extra lines needed. If a handler has no validation logic at all (just reading `req.body` directly), request body schema will be populated once real traffic flows through Layer 4. Response schema detection is unaffected.

> **Layer 2 runs in a sandbox.** The dry-run calls your handler with a mock request but blocks all outgoing network connections, database calls, and filesystem writes; nothing is executed for real.

---

## validate(): when auto-detection isn't enough

`validate()` is Layer 5; skip it entirely and Layers 1–4 still document every route. Use it on specific routes when you hit one of these cases:

**Bundler/transpiler in use:** Babel, SWC, esbuild, or `tsc` mangle source code so Layer 1 can't read patterns. `validate()` passes the schema object directly, bypassing source scanning entirely.

```js
import { validate } from 'nodox-cli'
import { z } from 'zod'

const CreateUserSchema = z.object({
  name:  z.string(),
  email: z.string().email(),
  age:   z.number().int().optional(),
})

app.post('/users', validate(CreateUserSchema), async (req, res) => {
  // req.body is already validated and coerced, safe to use directly
  const user = await db.createUser(req.body)
  res.status(201).json(user)
})
```

**Runtime validation needed:** Layers 1–4 only document; they never enforce. `validate()` runs the schema against `req.body` on every real request and returns a structured `400` on failure, with no `if (!result.success)` boilerplate needed.

```js
// without validate(): you handle validation yourself
app.post('/users', async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error })
  const user = await db.createUser(result.data)
  res.status(201).json(user)
})

// with validate(): middleware handles the 400, handler only runs on valid input
app.post('/users', validate(CreateUserSchema), async (req, res) => {
  const user = await db.createUser(req.body)
  res.status(201).json(user)
})
```

**Response schema:** no layer auto-detects what your route returns. Pass a `responses` map keyed by status code.

```js
const UserResponse = z.object({ id: z.number(), name: z.string(), email: z.string() })
const ErrorResponse = z.object({ error: z.string(), details: z.array(z.string()) })

app.post('/users', validate(CreateUserSchema, {
  responses: {
    201: UserResponse,
    400: ErrorResponse,
  },
}), handler)
```

**Metadata:** tags, auth scheme, summary, deprecated flag, examples. None of this is detectable from code; `validate()` is the only way to attach it.

```js
app.post('/users', validate(CreateUserSchema, {
  tags: ['Users'],
  auth: { type: 'bearer' },
  meta: {
    summary: 'Create a new user',
    description: 'Creates a user and returns the created record.',
    deprecated: false,
    examples: { body: { name: 'Jane Doe', email: 'jane@example.com' } },
  },
}), handler)
```

All four options can be combined in a single `validate()` call. Accepts **Zod** (v3 and v4), **Joi**, **yup**, **Valibot**, **TypeBox**, and plain **JSON Schema**.

→ **[Full validate() reference: all options, libraries, error formats, tags, auth, examples](docs/validate.md)**

---

## Test suite integration

Record real request/response shapes from your existing tests automatically, no changes to test code required:

```bash
npx nodox init    # injects nodox-cli/jest-setup into your Jest/Vitest config
```

`init` also adds `.apicache.json` to your `.gitignore` automatically if one exists.

Recorded shapes are stored in `.apicache.json` and loaded on the next server start. This is Layer 4: shapes observed from real test data, not synthesized. New observations are merged into existing entries rather than overwriting them. nodox-cli searches for `.apicache.json` upward from your working directory (up to 5 levels), so monorepo setups with a cache at the workspace root are supported without any path configuration.

Run `npx nodox prune` to reset the cache.

---

## API versioning

nodox-cli automatically detects API versions from route prefixes (`/v1/`, `/v2/`, `/v3/`, etc.) with no configuration needed. When multiple versions are present, the sidebar gains a version filter strip and groups routes by version:

```
[ALL] [v1] [v2]
```

Routes are also **auto-tagged** in the OpenAPI export so external viewers like Scalar, Redocly, and Swagger UI group them correctly.

```js
app.get('/api/v1/users', handler)    // → version: v1, tag: v1
app.get('/api/v2/users', handler)    // → version: v2, tag: v2
```

When a route has `tags` declared via `validate()` (Layer 5), those take precedence over the auto-detected version tag.

---

## UI features

- **Schema tab**: field names, types, required badges, confidence indicator, per-status response schemas, example code blocks, and auth info block when declared
- **Tag grouping**: routes with `tags` declared via `validate()` are grouped under named headers in the sidebar; routes without tags appear below all groups
- **Version grouping**: when multiple API versions are detected (e.g. `/v1/`, `/v2/`), routes are automatically grouped by version with a version filter strip at the top of the sidebar
- **Auth badges**: routes with `auth` declared show a lock badge (🔒) in the sidebar row and in the detail panel header, with full scheme details in the Schema tab. Common auth middleware functions (`authenticate`, `requireAuth`, `jwtAuth`, etc.) are detected automatically even without an explicit `auth` declaration.
- **Deprecated routes**: routes with `meta.deprecated: true` show a strikethrough path and "deprecated" badge in the sidebar; the detail panel header also shows the badge
- **Rich metadata**: `meta.summary` and `meta.description` render beneath the route path in the detail panel; `meta.description` supports inline Markdown (bold, italic, inline code, links); `meta.examples` render as code blocks and fill the Playground
- **External docs link**: routes with `externalDocs` declared show a clickable link in the detail panel header; also emitted as `externalDocs` in the OpenAPI export
- **Playground**: send live requests directly from the browser; path params render as inline inputs; body fields are pre-filled from detected schema; click **Load example** to pre-fill from `meta.examples.body`; query parameters are documented for GET, DELETE, HEAD, and OPTIONS routes
- **Code snippets**: expand the "Code snippets" section in the Playground to copy a ready-to-run **cURL**, **JavaScript fetch**, or **Python requests** command built from the current route, path params, headers, and body
- **Middleware chain**: the detail panel lists every function in the route's handler stack by name, so you can see at a glance which guards, validators, and handlers apply to each route
- **Chain builder**: connect routes on a canvas, wire output fields to input fields, and simulate multi-step flows with `{{step0.fieldName}}` interpolation
- **Environment switcher**: swap the base URL between local, staging, and production without leaving the UI
- **Response diff**: save a baseline response and compare it against subsequent calls to catch regressions
- **Dark / light mode**: toggle between dark (default) and light themes using the ◑/☀ button in the header; preference is saved across sessions
- **OpenAPI export links**: one-click links in the sidebar footer open `/__nodox/openapi.json` and `/__nodox/openapi.yaml` in new tabs

### Schema confidence levels

Every field in the UI is marked with a badge showing how nodox got its schema:

| Badge | How it got there |
|---|---|
| **confirmed** | `validate()` was used on this route |
| **inferred** | nodox dry-ran your handler or read express-validator chains (Layers 1–2) |
| **observed** | nodox watched real traffic or loaded from `.apicache.json` (Layers 3–4) |
| *(none)* | Route has no data yet |

---

## Chain builder & simulation

The **Chain** tab lets you wire routes together into a multi-step flow and execute them in sequence, without leaving the docs UI.

Drop routes onto the canvas, connect them, and use `{{step0.fieldName}}` to pass values from one step's response into the next step's input. No copy-pasting between requests.

→ **[Full chain builder guide: syntax, examples, auth flows](docs/chain-builder.md)**

---

## Options

```js
app.use(nodox(app, {
  uiPath:    '/__nodox',  // URL prefix for the docs UI
  log:       true,        // print startup banner with route count and URL
  schema:    true,        // enable schema detection pipeline
  intercept: true,        // enable live res.json() interception (Layer 4)
  force:     false,       // allow running in NODE_ENV=production
  server:    undefined,   // pass your http.Server when using http.createServer(app) + server.listen()
                          // instead of app.listen(). Without it nodox still works correctly but the
                          // startup log shows "localhost:PORT" until the first request arrives.
                          // Recommended pattern:
                          //   const httpServer = http.createServer(app)
                          //   app.use(nodox(app, { server: httpServer }))
                          //   httpServer.listen(3000)

  // OpenAPI spec info shown in external viewers (Scalar, Redocly, Swagger UI)
  info: {
    title:          'My API',
    version:        '2.0.0',
    description:    'Internal service API',
    contact:        { name: 'Platform Team', email: 'platform@example.com' },
    license:        { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
    termsOfService: 'https://example.com/tos',
  },
}))
```

nodox-cli is a **no-op in production** by default (`NODE_ENV=production`). Pass `force: true` to override, but do not expose `/__nodox` publicly, as it reveals all routes, detected schemas, and a full request playground.

---

## OpenAPI export

nodox-cli serves a live **OpenAPI 3.1** spec in both JSON and YAML, generated from the same schema data shown in the UI:

```
GET http://localhost:3000/__nodox/openapi.json
GET http://localhost:3000/__nodox/openapi.yaml
```

The spec includes all discovered routes, path and query parameters, request/response schemas, tags, auth security schemes, deprecation flags, and reusable `components/schemas` entries so SDK generators produce named types rather than anonymous inline shapes. Both endpoints are CORS-open (`Access-Control-Allow-Origin: *`).

Paste either URL directly into **Swagger UI**, **Redocly**, **Scalar**, or any OpenAPI-compatible viewer. SDK generators like **Speakeasy** or **Fern** can consume it without any extra configuration.

---

## CLI

```bash
npx nodox init      # set up test suite integration (Jest or Vitest); updates .gitignore
npx nodox prune     # clear .apicache.json
npx nodox status    # print per-route schema coverage (live server or cache fallback)
npx nodox snapshot  # save a baseline OpenAPI snapshot for diff
npx nodox diff      # compare snapshots and report breaking changes
```

→ **[Full CLI reference: options, output examples, CI setup](docs/cli.md)**

---

## Full control: you decide how much nodox does

**Mode 1: Zero config.** Add one line, nodox handles everything.

```js
app.use(nodox(app))
```

**Mode 2: Patch specific routes.** Let auto-detection handle most routes, drop `validate()` only where you need runtime enforcement or metadata.

```js
app.use(nodox(app))
app.get('/users', handler)                                    // auto-detected
app.post('/users', validate(CreateUserSchema), handler)       // confirmed + runtime validation
app.get('/users/:id', handler)                                // auto-detected
app.delete('/users/:id', validate(IdSchema), handler)         // confirmed + runtime validation
```

**Mode 3: Disable auto-detection.** Turn off Layers 1–4 and declare everything manually with `validate()`.

```js
app.use(nodox(app, { schema: false, intercept: false }))

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

---

## TypeScript

Type declarations are included. The package is ESM-first with a CJS fallback.

```ts
import nodox, { validate } from 'nodox-cli'
import type { NodoxOptions, NodoxInfoOptions, ValidateOptions } from 'nodox-cli'
```

`validate()` is generic; when passed a Zod schema, the inferred output type flows into `req.body` in the next handler:

```ts
import { z } from 'zod'
import { validate } from 'nodox-cli'

const CreateUser = z.object({ name: z.string(), email: z.string().email() })

app.post('/users',
  validate(CreateUser),   // req.body inferred as { name: string; email: string }
  (req, res) => {
    const { name, email } = req.body  // fully typed, no cast needed
    res.status(201).json({ id: 1, name, email })
  }
)
```

Both Zod v3 and Zod v4 are supported. nodox-cli detects the installed version automatically and uses the appropriate patching strategy for each.

---

## Compatibility

- Node.js ≥ 18
- Express ≥ 4 (Express 5 is supported)
- Schema libraries: Zod v3 and v4, Joi, yup, Valibot, TypeBox, express-validator v6 and v7, plain JSON Schema

**Valibot** and **TypeBox** are optional peer dependencies; install whichever you use:

```bash
npm install valibot          # for Valibot support
npm install @sinclair/typebox  # for TypeBox support
```

Neither is required. nodox-cli detects them at runtime if installed.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT
