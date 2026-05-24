# Contributing to nodox-cli

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Running Tests](#running-tests)
- [Building](#building)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)

---

## Getting Started

1. Fork the repository and clone your fork:
   ```bash
   git clone https://github.com/<your-username>/nodox-cli.git
   cd nodox-cli
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Verify everything works:
   ```bash
   npm test
   ```

**Requirements:** Node.js >= 18.0.0

---

## Project Structure

```
nodox-cli/
├── src/
│   ├── index.js              # Main middleware entry point
│   ├── cli/                  # CLI (nodox binary)
│   ├── extractor/            # Route extraction from Express app
│   ├── middleware/           # Core request/response middleware
│   ├── schema/               # 5-layer schema detection pipeline
│   ├── layer4/               # Test suite recording (apicache)
│   ├── ui-server/            # Serves the docs UI at /__nodox
│   └── websocket/            # WebSocket for live schema updates
├── ui/
│   └── src/                  # React UI (Playground + Chain Builder)
├── tests/                    # Jest test suite
├── dist/                     # CJS build output (generated)
└── scripts/                  # Build scripts
```

The schema detection pipeline (`src/schema/`) is the core of nodox-cli. Changes there should be carefully tested across all 5 layers.

---

## Development Workflow

### Working on the middleware / backend

Edit files under `src/` directly — no build step needed. The package exports from `src/` in ESM mode.

### Working on the UI

Start the Vite dev server:
```bash
npm run build:ui -- --watch
```

Or run a full development build:
```bash
npm run build
```

The UI lives in `ui/src/`. The built assets go to `ui/dist/` and are served by the middleware at `/__nodox`.

---

## Running Tests

```bash
# Run the full test suite
npm test

# Run a specific test file
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/schema-detector.test.js

# Run tests matching a pattern
node --experimental-vm-modules node_modules/jest/bin/jest.js -t "Layer 2"
```

Tests are written with Jest and use `supertest` for HTTP integration tests. Add tests for any new behavior — especially for the schema detection pipeline, where layer interactions can be subtle.

---

## Building

```bash
# Build everything (UI + CJS bundle)
npm run build

# Build only the UI
npm run build:ui

# Build only the CJS bundle
npm run build:cjs
```

The `prepublishOnly` script runs `build` and `test` automatically before any npm publish.

---

## Submitting Changes

1. Create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes and add tests.

3. Ensure the test suite passes:
   ```bash
   npm test
   ```

4. Commit with a clear message:
   ```
   feat: detect express-validator isDate constraints in Layer 2
   fix: dry-runner crashing when handler has no params
   ```

5. Push and open a pull request against `main`.

**For bug reports**, open an issue at https://github.com/dhruv-bhalodia/nodox/issues and include a minimal reproduction.

---

## Code Style

- ES modules (`.js` with `import`/`export`) throughout `src/`.
- No TypeScript in source — types live in `index.d.ts` and `jest-setup.d.ts`.
- Keep comments minimal — only when the *why* isn't obvious from the code.
- Don't add error handling for scenarios that can't happen; trust Express and Node.js guarantees.

---

## License

By contributing, you agree that your changes will be licensed under the [MIT License](LICENSE).
