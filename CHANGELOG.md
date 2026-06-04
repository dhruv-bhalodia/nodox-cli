# Changelog

All notable changes to nodox are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
nodox follows [Semantic Versioning](https://semver.org/).

---

## [1.1.8] — 2026-06-05

### Fixed

- **Optional fields now inferred correctly without `validate()` or traffic** — Zod v4 dropped the `received` property from validation issues, causing the dry-run reconstruction to never populate the `required` array. Fixed by removing the broken `received` check.
- **All-optional Zod schemas now detected** — schemas where every field is `.optional()` caused `safeParse({})` to succeed silently, making the schema invisible to dry-run. A second null-probe pass now surfaces all fields by returning `null` for every property access, triggering type errors for both required and optional fields.
- **ESM/CJS Zod split** — `import { z } from 'zod'` (ESM) and `require('zod')` (CJS) are separate instances in Node.js. nodox only patched the CJS instance at startup, leaving ESM module-level schemas undetected. The ESM z instance is now also patched asynchronously in `runDeferredDryRuns`.
- **`http.createServer` + `server.listen()` schemas not showing in UI** — `runDeferredDryRuns()` was fire-and-forgotten in the `setTimeout` fallback path, causing `doExtraction()` to run before dry-runs wrote anything to the registry. Added `await` and a post-dry-run re-enrichment so schemas appear correctly without requiring `{ server }` to be passed.
- **`bugs` URL in package.json** pointed to the wrong repository (`nodox` instead of `nodox-cli`).

### Changed

- **`server` option description** corrected — previously said "needed when you attach a WebSocket server to the same port" which was wrong. Now accurately describes when to use it and what you gain.
- **README restructured** — `validate()` full reference, chain builder tutorial, and CLI reference moved to `docs/` to keep the README focused on discovery and quick start.
- **`docs/` added to published files** so README links to `docs/validate.md`, `docs/chain-builder.md`, and `docs/cli.md` resolve correctly on npmjs.com.
- **Keywords expanded** for better npm registry searchability.
- **`.gitignore` updated** with standard entries (`.env`, `*.log`, `.DS_Store`, `coverage/`).

---

## [1.1.0] — 2026-05-15

### Added

- **API versioning** — routes with `/v1/`, `/v2/` (etc.) prefixes are automatically detected.
  The UI groups them under collapsible version headers and shows a version filter strip in the
  sidebar when multiple API versions are present. The OpenAPI export auto-tags versioned routes.

- **Breaking-change detection CLI** — two new commands:
  - `npx nodox snapshot [--url <url>] [--out <file>]` — captures the live OpenAPI spec as a
    baseline and saves it to `.nodox-snapshot.json`.
  - `npx nodox diff [old.json new.json | --url <url> --snapshot <file>]` — compares two
    snapshots (or a snapshot against a live server) and reports breaking changes (route
    removals, required-field removals, field type changes). Exits with code 1 when breaking
    changes are found, making it CI-friendly.

- **YAML export** — `GET /__nodox/openapi.yaml` returns the spec as OpenAPI 3.1 YAML without
  requiring any additional dependencies. A YAML ↗ link appears next to the JSON ↗ link in the
  sidebar footer.

- **`$ref` deduplication** — complex request/response schemas are hoisted into
  `components/schemas` in the OpenAPI export to eliminate duplication across multiple routes
  that share the same shape.

- **Deprecated route support** — pass `meta: { deprecated: true }` to `validate()` to mark a
  route as deprecated. The UI renders a strikethrough path and a "deprecated" badge; the
  OpenAPI export emits `deprecated: true` on the operation.

- **Auth middleware inference** — nodox inspects middleware function names (e.g. `jwtAuth`,
  `requireAuth`, `apiKey`) and automatically sets the auth scheme on the route even when
  `validate()` is not used.

- **Code snippets** — the Playground generates curl, `fetch`, and Python `requests` snippets
  for each request, with one-click copy.

- **Dark / light mode** — a theme toggle button in the sidebar switches between dark and light
  themes; the preference is persisted to `localStorage`.

- **OpenAPI `info` block** — pass `info: { title, version, description, contact, license,
  termsOfService }` to the `nodox()` middleware to populate the OpenAPI spec's info section
  for use with external viewers (Scalar, Redocly, Swagger UI).

- **TypeScript generics on `validate()`** — `validate(ZodSchema)` now infers the schema output
  type and propagates it to `req.body` in subsequent handlers:
  ```ts
  app.post('/users', validate(CreateUserSchema), (req, res) => {
    // req.body is typed as { name: string; email: string }
  })
  ```

- **`NodoxInfoOptions` TypeScript interface** — exported from the package for use in typed
  Express setups.

- **Joi nullable fields** — `joi.string().allow(null)` is now correctly emitted as
  `{ "type": ["string", "null"] }` in JSON Schema / OpenAPI output.

- **yup nullable fields** — `yup.string().nullable()` is now correctly emitted as
  `{ "type": ["string", "null"] }`.

- **Response schemas by status code** — `validate(schema, { responses: { 201: ..., 400: ... } })`
  documents multiple response shapes per route, both in the UI and the OpenAPI export.

- **Tags** — `validate(schema, { tags: ['Users'] })` groups routes in the sidebar and in the
  OpenAPI export's `tags` field.

- **Route metadata** — `validate(schema, { meta: { summary, description, deprecated, examples } })`
  surfaces human-readable text and example payloads in the Schema tab and the Playground.

- **Auth declaration** — `validate(schema, { auth: { type: 'bearer' } })` attaches a security
  scheme to the route in the UI and generates `securitySchemes` + `security` entries in the
  OpenAPI export.

### Changed

- `buildOpenApiSpec` now accepts an `info` option forwarded from `nodox()` options.
- CLI help output updated to include `snapshot` and `diff` commands.

---

## [1.0.0] — initial release

### Added

- Zero-config Express middleware (`nodox(app)`) that auto-discovers all registered routes.
- 5-layer schema detection pipeline:
  1. `validate()` wrapper (confirmed schemas)
  2. Source screener (static AST-free detection)
  3. Dry-run execution
  4. Test cache (`.apicache.json` populated by Jest/Vitest setup)
  5. Live `res.json()` interception
- Interactive UI at `/__nodox` with search, method filter, and route detail panel.
- Playground — send real requests directly from the docs; path parameters render as inline
  inputs.
- Chain builder — wire multiple endpoints together and simulate multi-step flows.
- OpenAPI 3.1 JSON export at `/__nodox/openapi.json`.
- CLI (`npx nodox`):
  - `init` — detects Jest / Vitest and injects the nodox setup file.
  - `prune` — wipes `.apicache.json`.
  - `status` — shows cache stats and route list.
- WebSocket live updates — the UI reflects route and schema changes without a page refresh.
- Production guard — nodox is a no-op when `NODE_ENV=production` unless `force: true` is set.
- TypeScript declarations (`index.d.ts`) for all public APIs.
- Guided tour (first-visit walkthrough of key UI features).
