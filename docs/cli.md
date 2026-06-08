# CLI Reference

```bash
npx nodox init      # set up test suite integration (Jest or Vitest)
npx nodox prune     # clear .apicache.json
npx nodox status    # print per-route schema coverage
npx nodox snapshot  # save a baseline OpenAPI snapshot
npx nodox diff      # compare snapshots and report breaking changes
npx nodox export    # export OpenAPI spec as JSON and/or YAML
```

---

## `npx nodox init`

Injects `nodox-cli/jest-setup` into your Jest or Vitest config so request/response shapes are recorded automatically during test runs. Also adds `.apicache.json` to your `.gitignore` if one exists.

Run this once per project. No changes to test code are required — shapes are recorded by intercepting `supertest` and `axios` requests in the background.

---

## `npx nodox prune`

Deletes `.apicache.json` to reset the Layer 4 cache. Useful when your route shapes have changed significantly and the cached data is stale.

---

## `npx nodox status`

Connects to your running server and prints per-route schema coverage with confidence levels.

```bash
npx nodox status                              # connects to http://localhost:3000 by default
npx nodox status --url http://localhost:4000  # non-default port
```

Example output:

```
◆ nodox status

  Server: http://localhost:3000
  Routes tracked: 6

  Schema coverage:

  GET     /users                         confirmed    (validate)
  POST    /users                         confirmed    (validate)
  GET     /users/:id                     inferred     (dry-run)
  PUT     /users/:id                     observed     (traffic)
  DELETE  /users/:id                     observed     (traffic)
  GET     /health                        —

  Coverage: 5/6 routes have schema  (83%)
    2 confirmed via validate()
    1 inferred from dry-run
    2 observed from traffic
```

If no server is running, `status` falls back to `.apicache.json` and shows cache-only data.

---

## `npx nodox snapshot`

Saves the current OpenAPI spec from your running server as a baseline JSON file.

```bash
npx nodox snapshot                              # saves to nodox-snapshot.json
npx nodox snapshot --url http://localhost:4000  # non-default port
npx nodox snapshot --out snapshots/v1.json      # custom output path
```

---

## `npx nodox diff`

Compares a previously saved snapshot against a running server (or two snapshot files) and reports breaking changes. **Exits with code 1** if breaking changes are detected — suitable for CI pipelines.

```bash
npx nodox diff                                       # compares nodox-snapshot.json vs localhost:3000
npx nodox diff --url http://localhost:4000
npx nodox diff --snapshot snapshots/v1.json
npx nodox diff snapshots/v1.json snapshots/v2.json   # two-file mode, no server needed
```

Example output:

```
◆ nodox diff

  Breaking changes (2)
  ✗  Removed: DELETE /api/v1/users/:id
  ✗  POST /api/v1/users body: field 'email' type changed from 'string' to 'integer'

  Additions (1)
  +  Added: POST /api/v2/users
```

### What counts as breaking

| Change | Breaking? |
|---|---|
| Route removed | Yes |
| Required request field removed | Yes |
| Field type changed | Yes |
| Route deprecated | No (listed as change) |
| New route added | No (listed as addition) |
| Optional field added | No (listed as addition) |

---

## `npx nodox export`

Fetches the live OpenAPI spec from your running server and writes it to disk as JSON, YAML, or both.

```bash
npx nodox export                              # writes openapi.json + openapi.yaml
npx nodox export --format json               # JSON only
npx nodox export --format yaml               # YAML only
npx nodox export --out api/spec              # custom basename → api/spec.json + api/spec.yaml
npx nodox export --url http://localhost:4000 # non-default port
```

Example output:

```
◆ nodox export

  Server: http://localhost:3000

  ✓  openapi.json  (12 operations)
  ✓  openapi.yaml

  Paste either file into Swagger UI, Redocly, Scalar, or any OpenAPI viewer.
  SDK generators (Speakeasy, Fern) can consume them without extra configuration.
```

Both files are identical to the live endpoints at `/__nodox/openapi.json` and `/__nodox/openapi.yaml`. Use `export` when you need a static file to commit, upload, or hand to a generator.

---

## CI example

```yaml
# .github/workflows/api-compat.yml
- name: Start server
  run: node server.js &

- name: Check for breaking API changes
  run: npx nodox diff --snapshot snapshots/baseline.json
```
