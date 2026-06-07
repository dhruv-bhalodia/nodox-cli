# validate(): Full Reference

`validate()` is nodox's optional Layer 5. Layers 1-4 run automatically and document every route without any code changes. Use `validate()` on specific routes when the automatic layers aren't giving you what you need, or when you want runtime enforcement on top of documentation.

```js
import { validate } from 'nodox-cli'
```

---

## When to use it

### Bundler or transpiler in your stack

Layer 1 detects schemas by reading handler source code as a string. When your dev server runs through Babel, SWC, esbuild, or `tsc`, that source is mangled and the patterns no longer match. `validate()` passes the actual schema object directly, so it works regardless of how your code is transformed.

If you see routes documented with no schema even though they clearly have Zod/Joi validation inside them, this is almost always the reason.

```js
// Layer 1 would read this as scrambled text after transpilation.
// validate() bypasses that entirely.
app.post('/users', validate(CreateUserSchema), async (req, res) => {
  const user = await db.createUser(req.body)  // req.body is validated and coerced
  res.status(201).json(user)
})
```

### Runtime validation (actual 400 enforcement)

Layers 1-4 document schemas. None of them enforce anything at runtime. If a client sends a bad body, it goes straight to your handler unless you check it yourself.

`validate()` adds a middleware step that runs the schema against `req.body` before your handler is called. Invalid input never reaches your code.

```js
// Without validate() — you do the checking
app.post('/users', async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error })
  const user = await db.createUser(result.data)
  res.status(201).json(user)
})

// With validate() — middleware handles the 400, handler only runs on clean input
app.post('/users', validate(CreateUserSchema), async (req, res) => {
  const user = await db.createUser(req.body)
  res.status(201).json(user)
})
```

The 400 response shape is structured and consistent across all routes that use `validate()`. See [Validation error response](#validation-error-response) for the format.

### Response schema

No layer can reliably detect what your route returns from static analysis alone. If you want response schemas shown in the docs and included in the OpenAPI export, `validate()` is the only way to attach them.

```js
const UserResponse = z.object({
  id:    z.number(),
  name:  z.string(),
  email: z.string(),
})
const ErrorResponse = z.object({
  error:   z.string(),
  details: z.array(z.string()),
})

app.post('/users', validate(CreateUserSchema, {
  responses: {
    201: UserResponse,
    400: ErrorResponse,
  },
}), handler)
```

### Metadata: tags, auth, descriptions, examples

None of the following is detectable from code. If you want it in the docs, you attach it through `validate()`.

```js
app.post('/users', validate(CreateUserSchema, {
  tags: ['Users'],
  auth: { type: 'bearer' },
  meta: {
    summary:     'Create a new user',
    description: 'Creates a user record and sends a welcome email. Returns 409 if the email already exists.',
    deprecated:  false,
    examples: {
      body: { name: 'Jane Doe', email: 'jane@example.com' },
    },
  },
}), handler)
```

---

## All options together

All options can be combined in a single call. This is the full shape:

```js
app.post('/users',
  validate(CreateUserSchema, {
    // Runtime behavior
    strict:         false,        // reject unknown fields (default: strip them)
    problemDetails: false,        // RFC 7807 error format (default: { error, details })

    // Documentation
    tags:    ['Users', 'Admin'],
    auth:    { type: 'bearer', description: 'JWT from /auth/login' },
    meta: {
      summary:     'Create a new user',
      description: 'Supports Markdown: **bold**, `code`, [links](https://example.com).',
      deprecated:  false,
      examples: {
        body: { name: 'Jane Doe', email: 'jane@example.com' },
        responses: {
          201: { id: 1, name: 'Jane Doe', email: 'jane@example.com' },
          400: { error: 'Validation failed', details: [{ path: 'email', message: 'Invalid email' }] },
        },
      },
    },
    responses: {
      201: UserResponse,
      400: ErrorResponse,
      409: z.object({ error: z.string() }),
    },
    externalDocs: {
      url:         'https://docs.example.com/users',
      description: 'User API reference',
    },
  }),
  handler
)
```

---

## Supported schema libraries

### Zod

```js
import { z } from 'zod'

const CreateUserSchema = z.object({
  name:  z.string(),
  email: z.string().email(),
  age:   z.number().int().optional(),
})

app.post('/users', validate(CreateUserSchema), async (req, res) => {
  const user = await db.createUser(req.body)  // req.body is validated and coerced
  res.json(user)
})
```

Both Zod v3 and v4 are supported. nodox detects the installed version automatically.

**TypeScript:** when passed a Zod schema, `validate()` is generic and the inferred output type flows into `req.body` in the next handler:

```ts
const CreateUser = z.object({ name: z.string(), email: z.string().email() })

app.post('/users',
  validate(CreateUser),  // req.body inferred as { name: string; email: string }
  (req, res) => {
    const { name, email } = req.body  // fully typed, no cast needed
    res.status(201).json({ id: 1, name, email })
  }
)
```

### Joi

```js
import Joi from 'joi'

const LoginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().min(8).required(),
})

app.post('/login', validate(LoginSchema), handler)
```

### yup

```js
import * as yup from 'yup'

const ProductSchema = yup.object({
  name:  yup.string().required(),
  price: yup.number().positive().required(),
})

app.post('/products', validate(ProductSchema), (req, res) => {
  res.status(201).json(req.body)
})
```

### Valibot

```js
import * as v from 'valibot'

const CreateUserSchema = v.object({
  name:  v.string(),
  email: v.pipe(v.string(), v.email()),
})

app.post('/users', validate(CreateUserSchema), handler)
```

### TypeBox

TypeBox schemas are already JSON Schema objects, so display and runtime checking both work without any conversion:

```js
import { Type } from '@sinclair/typebox'

const ProductSchema = Type.Object({
  name:  Type.String(),
  price: Type.Number({ minimum: 0 }),
})

app.post('/products', validate(ProductSchema), handler)
```

### Plain JSON Schema

Displayed in the UI and included in the OpenAPI export, but does not perform runtime validation (nodox treats it as display-only):

```js
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

---

## Validation error response

On a validation failure nodox returns a `400` with this shape (Zod / Joi / yup / Valibot / TypeBox):

```json
{
  "error": "Validation failed",
  "details": [
    { "path": "name",  "message": "Required",      "code": "invalid_type" },
    { "path": "email", "message": "Invalid email", "code": "invalid_string" }
  ]
}
```

### RFC 7807 Problem Details format

Pass `problemDetails: true` to switch to the [IETF RFC 7807](https://www.rfc-editor.org/rfc/rfc7807) format:

```js
app.post('/users', validate(CreateUserSchema, { problemDetails: true }), handler)
```

```json
{
  "type": "about:blank",
  "title": "Validation Failed",
  "status": 400,
  "detail": "One or more fields failed validation.",
  "errors": [
    { "pointer": "/name",  "detail": "Required" },
    { "pointer": "/email", "detail": "Invalid email" }
  ]
}
```

---

## Option reference

### `responses` — per-status response schemas

Pass a map of HTTP status code to schema to document different response shapes per status. Each value accepts Zod, Joi, yup, or a plain JSON Schema object.

```js
app.post('/users',
  validate(CreateUserSchema, {
    responses: {
      201: UserResponse,
      400: ErrorResponse,
      409: z.object({ error: z.string() }),
    },
  }),
  handler
)
```

Shown in the Schema tab per status code and included in the OpenAPI export. When `responses` is present, a single `response` key is ignored.

### `tags` — group routes in the sidebar

Routes with tags are grouped under named headers in the sidebar and auto-tagged in the OpenAPI export. A route can belong to multiple groups.

```js
app.get('/users',  validate(z.object({}), { tags: ['Users'] }), handler)
app.post('/users', validate(CreateUserSchema, { tags: ['Users'] }), handler)
app.post('/login', validate(LoginSchema, { tags: ['Auth'] }), handler)

// Multiple groups
validate(schema, { tags: ['Users', 'Admin'] })
```

Tags declared via `validate()` take precedence over auto-detected version tags (`/v1/`, `/v2/`, etc.).

### `meta` — summary, description, deprecated, examples

```js
app.post('/users',
  validate(CreateUserSchema, {
    meta: {
      summary:     'Create a new user',
      description: 'Creates a user and sends a welcome email. Returns **409** if the email already exists.',
      deprecated:  false,
      examples: {
        body: { name: 'Alice', email: 'alice@example.com' },
        responses: {
          201: { id: 1, name: 'Alice', email: 'alice@example.com' },
          409: { error: 'Email already in use' },
        },
      },
    },
  }),
  handler
)
```

| Field | Where it appears |
|---|---|
| `summary` | Subtitle beneath the route path in the detail panel |
| `description` | Prose below the summary; supports inline Markdown (bold, italic, code, links) |
| `deprecated` | Strikethrough + badge in the sidebar when `true`; `deprecated: true` in OpenAPI export |
| `examples.body` | Pre-fills the Playground body editor when **Load example** is clicked |
| `examples.responses` | Code blocks in the Schema tab next to each status response |

### `auth` — document the authentication scheme

Display-only. Does not add runtime authentication logic.

```js
// Bearer token (JWT)
validate(schema, { auth: { type: 'bearer' } })
validate(schema, { auth: { type: 'bearer', description: 'JWT from POST /auth/login' } })

// API key
validate(schema, { auth: { type: 'apiKey', name: 'X-API-Key', in: 'header' } })
validate(schema, { auth: { type: 'apiKey', name: 'api_key',   in: 'query'  } })
validate(schema, { auth: { type: 'apiKey', name: 'session',   in: 'cookie' } })

// HTTP Basic
validate(schema, { auth: { type: 'basic' } })

// OAuth2 with scopes
validate(schema, { auth: { type: 'oauth2', scopes: ['read:users', 'write:users'] } })
```

Routes with `auth` declared show a lock badge in the sidebar and in the detail panel header. Auth type and scheme are included in the OpenAPI `securitySchemes` block.

### `externalDocs` — link to external documentation

```js
app.post('/payments',
  validate(PaymentSchema, {
    externalDocs: {
      url:         'https://docs.example.com/payments',
      description: 'Payment API reference',
    },
  }),
  handler
)
```

Shown as a clickable link in the detail panel header and included as `externalDocs` in the OpenAPI export.

### `strict` — reject unknown fields

```js
app.post('/users', validate(CreateUserSchema, { strict: true }), handler)
```

Without `strict`, extra fields are stripped (Zod) or passed through (Joi with `allowUnknown: true`). With `strict: true`, any field not declared in the schema causes an immediate `400`.

### `problemDetails` — RFC 7807 error format

```js
app.post('/users', validate(CreateUserSchema, { problemDetails: true }), handler)
```

See [Validation error response](#validation-error-response) for the full response shape.
