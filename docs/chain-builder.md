# Chain Builder

The **Chain** tab in the nodox UI lets you wire routes together into a multi-step flow and execute them in sequence — without leaving the docs UI. Use it to simulate end-to-end workflows like create → fetch → update without writing test scripts.

---

## Building a flow

1. Click **+** next to any route in the sidebar to drop it onto the canvas.
2. Drag from the right handle of one node to the left handle of another to connect them.
3. Click **▶ Simulate** → **▶ Run all**. Steps execute in dependency order (topological sort).
4. Use **Clear** to reset outputs while keeping the configured inputs.

---

## Passing data between steps — `{{stepN.field}}`

Use `{{stepN.field}}` in any input field to splice a value from a previous step's response body. `N` is the zero-based step index. `field` is a dot-separated path into its JSON response:

```
{{step0.id}}          → top-level field "id" from step 0's response
{{step0.user.email}}  → nested field
{{step1.token}}       → field from step 1's response
{{step0.0.name}}      → first item of an array response, then "name"
```

Interpolation works in:
- Path parameters (`:id`, `:slug`, etc.)
- Individual body fields
- The raw JSON body textarea

If a referenced step hasn't run yet, the placeholder is left as-is.

---

## Example — create a user, then fetch it

| Step | Route | Input |
|------|-------|-------|
| 0 | `POST /users` | `{ "name": "Alice", "email": "alice@example.com" }` |
| 1 | `GET /users/:id` | `:id` → `{{step0.id}}` |

After step 0 responds with `{ "id": 42, "name": "Alice" }`, nodox replaces `{{step0.id}}` with `42` before firing the step 1 request — no copy-pasting required.

---

## Example — auth flow

| Step | Route | Input |
|------|-------|-------|
| 0 | `POST /auth/login` | `{ "username": "alice", "password": "secret" }` |
| 1 | `GET /profile` | `Authorization` header → `Bearer {{step0.token}}` |
| 2 | `PUT /profile` | `{ "bio": "Updated" }`, `Authorization` → `Bearer {{step0.token}}` |
