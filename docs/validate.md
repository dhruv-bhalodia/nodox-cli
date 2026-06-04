# validate() — Full API Reference

`validate()` is nodox's optional Layer 1 schema declaration. It wraps a route handler to attach a confirmed schema, validate `req.body` at runtime, and register rich documentation metadata.

Skip it entirely and the other four detection layers still run — every route is documented. Use it when you want a schema marked as **confirmed** in the UI, runtime body validation with structured error responses, or any of the metadata options (tags, descriptions, examples, auth).

```js
import { validate } from 'nodox-cli'
import { z } from 'zod'

app.post('/users', validate(CreateUserSchema), handler)
```

---

## Supported schema libraries

`validate()` accepts schemas from any of these libraries:

### Zod

```js
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

Both Zod v3 and v4 are supported. nodox detects the installed version automatically.

### Joi

```js
import Joi from 'joi'

const LoginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
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

TypeBox schemas are already JSON Schema objects, so display and runtime checking both work without conversion:

```js
import { Type } from '@sinclair/typebox'

const ProductSchema = Type.Object({
  name:  Type.String(),
  price: Type.Number({ minimum: 0 }),
})

app.post('/products', validate(ProductSchema), handler)
```

### Plain JSON Schema

Displayed in the UI but does not perform runtime validation (nodox treats it as display-only):

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

## Options

### `response` — document the response schema

Pass a schema to document what the route returns. Display only — outgoing responses are not validated at runtime:

```js
const UserResponse = z.object({ id: z.number(), name: z.string(), email: z.string() })

app.post('/users', validate(CreateUserSchema, { response: UserResponse }), handler)
```

### `responses` — per-status response schemas

Pass a map of HTTP status code → schema to document different response shapes:

```js
const ErrorResponse = z.object({ error: z.string(), details: z.array(z.any()) })

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

When `responses` is present it takes precedence over `response` in both the UI and the OpenAPI export. Each value accepts Zod, Joi, yup, or a plain JSON Schema object.

### `tags` — group routes in the sidebar

Routes with tags are grouped under named headers in the sidebar and auto-tagged in the OpenAPI export. A route can belong to multiple groups:

```js
app.get('/users',  validate(z.object({}), { tags: ['Users'] }), handler)
app.post('/users', validate(CreateUserSchema, { tags: ['Users'] }), handler)
app.post('/login', validate(LoginSchema, { tags: ['Auth'] }), handler)

// Multiple groups
validate(schema, { tags: ['Users', 'Admin'] })
```

### `meta` — summary, description, examples

```js
app.post('/users',
  validate(CreateUserSchema, {
    tags: ['Users'],
    meta: {
      summary:     'Create a new user',
      description: 'Creates a user and sends a welcome email. Returns 409 if the email already exists.',
      examples: {
        body: { name: 'Alice', email: 'alice@example.com' },
        responses: {
          201: { id: 1, name: 'Alice', email: 'alice@example.com' },
          409: { error: 'Email already in use' },
        },
      },
    },
    responses: { 201: UserResponse, 409: ErrorResponse },
  }),
  handler
)
```

| Field | Where it shows |
|---|---|
| `summary` | Subtitle beneath the route path in the detail panel |
| `description` | Longer prose below the summary; supports inline Markdown |
| `examples.body` | Pre-fills the Playground body editor when you click **Load example** |
| `examples.responses` | Code blocks in the Schema tab next to each status response |
| `examples.response` | Code block next to the single-status response when `responses` is not used |

### `meta.deprecated` — mark a route as deprecated

```js
app.get('/v1/users',
  validate(z.object({}), {
    tags: ['Users'],
    meta: { summary: 'List users (v1 — use /v2/users instead)', deprecated: true },
  }),
  handler
)
```

Deprecated routes show a strikethrough path and badge in the sidebar. The OpenAPI export includes `deprecated: true`.

### `auth` — document the authentication scheme

Display-only — does not add runtime authentication logic:

```js
// Bearer token (JWT)
validate(schema, { auth: { type: 'bearer' } })

// API key
validate(schema, { auth: { type: 'apiKey', name: 'X-API-Key', in: 'header' } })
validate(schema, { auth: { type: 'apiKey', name: 'api_key',   in: 'query' } })
validate(schema, { auth: { type: 'apiKey', name: 'session',   in: 'cookie' } })

// HTTP Basic
validate(schema, { auth: { type: 'basic' } })

// OAuth2 with scopes
validate(schema, { auth: { type: 'oauth2', scopes: ['read:users', 'write:users'] } })
```

All types accept an optional `description` string included in the OpenAPI `securitySchemes` block.

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

Shown as a clickable link in the detail panel and included as `externalDocs` in the OpenAPI export.

### `strict` — reject unknown fields

```js
app.post('/users', validate(CreateUserSchema, { strict: true }), handler)
```

Unknown fields (not declared in the schema) return a `400`. Without `strict`, extra fields are stripped (Zod) or allowed (Joi with `allowUnknown: true`).

### `problemDetails` — RFC 7807 error format

See [Validation error response](#rfc-7807-problem-details-format) above.
