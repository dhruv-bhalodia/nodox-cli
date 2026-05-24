import type { RequestHandler, Application, Request, Response, NextFunction } from 'express'

// ── Options ───────────────────────────────────────────────────────────────────

export interface NodoxInfoOptions {
  /** API title shown in the OpenAPI spec and any external viewer. */
  title?: string
  /** Semantic version of the API. */
  version?: string
  /** Short description of the API. */
  description?: string
  /** Contact info for the API (name, url, email). */
  contact?: { name?: string; url?: string; email?: string }
  /** License information (name, url). */
  license?: { name: string; url?: string }
  /** URL to the terms of service. */
  termsOfService?: string
}

export interface NodoxOptions {
  /**
   * URL prefix for the documentation UI and WebSocket.
   * @default '/__nodox'
   */
  uiPath?: string

  /**
   * Log startup info (route count, UI URL) to the console.
   * @default true
   */
  log?: boolean

  /**
   * Enable automatic schema detection (Zod / Joi / yup / express-validator).
   * @default true
   */
  schema?: boolean

  /**
   * Enable live request/response interception to observe shapes from real traffic.
   * @default true
   */
  intercept?: boolean

  /**
   * Allow nodox to run when NODE_ENV=production.
   * By default nodox is a no-op in production to prevent accidental exposure.
   * Only set this to true if the UI is protected behind authentication.
   * @default false
   */
  force?: boolean

  /**
   * OpenAPI info block overrides — sets the title, version, and description shown
   * in the spec and in external viewers (Scalar, Redocly, Swagger UI, etc.).
   */
  info?: NodoxInfoOptions
}

// ── validate() ────────────────────────────────────────────────────────────────

export interface ValidateOptions {
  /**
   * Reject fields not declared in the schema (Zod: strict mode, Joi: allowUnknown=false).
   * @default false
   */
  strict?: boolean

  /**
   * Schema describing the response body. Used for documentation only — nodox
   * displays it in the UI but does not validate outgoing responses.
   * Accepts a Zod schema, Joi schema, or plain JSON Schema object.
   */
  response?: object

  /**
   * Map of HTTP status codes to response schemas. Used for documentation only.
   * When present, overrides `response` in the UI and in the OpenAPI export.
   * Each value accepts a Zod schema, Joi schema, or plain JSON Schema object.
   *
   * @example
   * validate(CreateUserSchema, {
   *   responses: {
   *     201: UserSchema,
   *     400: ErrorSchema,
   *   }
   * })
   */
  responses?: Record<string | number, object>

  /**
   * Tags for grouping this route in the nodox UI and the OpenAPI export.
   * Routes sharing a tag are collapsed under that tag in the sidebar.
   *
   * @example
   * validate(CreateUserSchema, { tags: ['Users'] })
   */
  tags?: string[]

  /**
   * Human-readable metadata shown in the nodox UI and included in the OpenAPI export.
   */
  meta?: {
    /** One-line summary shown beneath the route path in the detail panel. */
    summary?: string
    /** Longer description rendered below the summary. */
    description?: string
    /**
     * Mark this route as deprecated. Shown with a visual badge in the UI and
     * emitted as `deprecated: true` in the OpenAPI export.
     */
    deprecated?: boolean
    /**
     * Example values shown in the Schema tab and used to pre-fill the Playground.
     * `body` fills the request body, `response` fills the single-status response,
     * `responses` is a map of status code → example value.
     */
    examples?: {
      body?: object
      response?: object
      responses?: Record<string | number, object>
    }
  }

  /**
   * Authentication scheme for this route. Shown in the nodox UI and included
   * in the OpenAPI export as a security scheme + operation security requirement.
   */
  auth?:
    | { type: 'bearer'; description?: string }
    | { type: 'basic'; description?: string }
    | { type: 'apiKey'; name?: string; in?: 'header' | 'query' | 'cookie'; description?: string }
    | { type: 'oauth2'; scopes?: string[]; description?: string }

  /**
   * External documentation link for this route. Shown in the nodox UI and
   * emitted as `externalDocs` in the OpenAPI export.
   */
  externalDocs?: {
    /** URL to the external documentation page. Must be http or https. */
    url: string
    /** Short description shown as the link text. */
    description?: string
  }

  /**
   * Return RFC 7807 Problem Details format on validation errors instead of the
   * default nodox error shape. Sets Content-Type: application/problem+json.
   *
   * Default shape: `{ error, details: [{ path, message, code }] }`
   * Problem Details: `{ type, title, status, detail, errors: [{ pointer, detail }] }`
   *
   * @default false
   */
  problemDetails?: boolean
}

/**
 * Minimal interface for schemas that have a `safeParse` method (Zod-like).
 * Used to infer the output type of `validate()`.
 */
export interface SafeParseable<T> {
  safeParse(data: unknown): { success: true; data: T } | { success: false; error: unknown }
  _output?: T
}

/**
 * Minimal interface for Valibot schemas (functional safeParse API).
 * nodox detects these at runtime — no direct Valibot import needed.
 */
export interface ValibotSchema<T = unknown> {
  readonly '~standard': { readonly vendor: 'valibot'; readonly version: number }
  readonly _run: (dataset: unknown, config: unknown) => unknown
  readonly _types?: { readonly output: T }
}

/**
 * Minimal interface for TypeBox schemas (already-JSON-Schema objects tagged with Kind symbol).
 * nodox detects these at runtime — no direct TypeBox import needed.
 */
export interface TypeBoxSchema<T = unknown> {
  readonly [Symbol.for('TypeBox.Kind')]: string
  readonly type?: string
  readonly properties?: Record<string, unknown>
  static?: T
}

/**
 * Create a validation middleware that also registers the schema with nodox.
 *
 * This is the recommended way to get complete, reliable schema documentation.
 * The middleware validates `req.body` and returns 400 with structured error
 * details on failure, or calls `next()` with `req.body` replaced by the
 * parsed/coerced value on success.
 *
 * When passed a Zod schema, `req.body` is typed as the schema's output type
 * in the next handler.
 *
 * @param schema  A Zod schema, Joi schema, yup schema, or plain JSON Schema object.
 * @param options Optional settings.
 *
 * @example
 * import { validate } from 'nodox-cli'
 * import { z } from 'zod'
 *
 * const CreateUser = z.object({ name: z.string(), email: z.string().email() })
 *
 * app.post('/users', validate(CreateUser), (req, res) => {
 *   // req.body is typed as { name: string; email: string }
 *   res.status(201).json(req.body)
 * })
 */
export function validate<TBody = unknown>(
  schema: SafeParseable<TBody> | ValibotSchema<TBody> | TypeBoxSchema<TBody> | object,
  options?: ValidateOptions
): RequestHandler<Record<string, string>, unknown, TBody>

// ── nodox() ───────────────────────────────────────────────────────────────────

/**
 * nodox Express middleware.
 *
 * Mounts an interactive API documentation UI at `/__nodox` (configurable).
 * Automatically discovers routes, detects Zod/Joi/yup/express-validator schemas,
 * and provides a live playground — zero annotations, zero config.
 *
 * @example
 * import express from 'express'
 * import nodox from 'nodox-cli'
 *
 * const app = express()
 * app.use(express.json())
 * app.use(nodox(app))       // pass app for best results
 *
 * app.get('/users', handler)
 * app.listen(3000)
 * // → http://localhost:3000/__nodox
 */
declare function nodox(options?: NodoxOptions): RequestHandler
declare function nodox(app: Application, options?: NodoxOptions): RequestHandler

export default nodox
