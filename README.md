# fragments

Fragments back-end API — a REST microservice for storing and retrieving user-owned data fragments.

---

## Prerequisites

- Node.js 20+
- npm
- Git
- `curl` (on Windows PowerShell, use `curl.exe`, not `curl`)
- `jq` (optional, for JSON pretty-printing in the terminal)

---

## Frontend Integration

This API is designed to work with the [`fragments-ui`](https://github.com/lamritha/fragments-ui) React frontend.

The frontend:

- authenticates users with Amazon Cognito
- retrieves JWT tokens
- sends authenticated requests to this API

Configure the frontend with the API base URL (for example `http://localhost:8080` during local development).

---

## Authentication

All `/v1/*` routes require authentication. The health check at `/` is public.

The server selects **one** auth backend at startup based on environment variables. Cognito and HTTP Basic Auth cannot be configured at the same time.

### Amazon Cognito (production / frontend integration)

Used when both `AWS_COGNITO_POOL_ID` and `AWS_COGNITO_CLIENT_ID` are set.

Protected routes require a valid Cognito-issued **ID token** in the `Authorization` header:

```http
Authorization: Bearer <jwt-token>
```

JWTs are verified with [`aws-jwt-verify`](https://github.com/awslabs/aws-jwt-verify) via Passport's HTTP Bearer strategy. The authenticated user's email is hashed (SHA-256) and stored as `ownerId` on fragments.

### HTTP Basic Auth (local development and testing)

Used when `HTPASSWD_FILE` is set and `NODE_ENV` is not `production`.

Credentials are validated against an [Apache htpasswd](https://httpd.apache.org/docs/current/programs/htpasswd.html) file. Tests use `tests/.htpasswd` via the committed `env.jest` file.

Example request:

```bash
curl.exe -u user@example.com:password http://localhost:8080/v1/fragments
```

---

## API Routes

### Public

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check — returns service status, version, author, and timestamp |

### Protected (require authentication)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/fragments` | List the authenticated user's fragment IDs |
| `GET` | `/v1/fragments?expand=1` | List full fragment metadata objects |
| `POST` | `/v1/fragments` | Create a new fragment from the raw request body |
| `GET` | `/v1/fragments/:id` | Return the raw fragment data with its `Content-Type` |

Requests without valid credentials receive `401 Unauthorized`.

### Response format

Successful JSON responses use a standard envelope:

```json
{
  "status": "ok",
  "fragments": []
}
```

Errors use:

```json
{
  "status": "error",
  "error": {
    "code": 401,
    "message": "Unauthorized"
  }
}
```

### Supported fragment types

The `Content-Type` header on `POST /v1/fragments` must be one of:

| Category | MIME types |
|----------|------------|
| Text | `text/plain`, `text/markdown`, `text/html`, `text/csv` |
| Structured | `application/json`, `application/yaml` |
| Image | `image/png`, `image/jpeg`, `image/webp`, `image/avif`, `image/gif` |

Unsupported types return `415 Unsupported Media Type`. Request bodies are limited to **5 MB**.

### Create a fragment

```bash
curl.exe -i ^
  -H "Authorization: Bearer <jwt-token>" ^
  -H "Content-Type: text/plain" ^
  --data "Hello, fragment!" ^
  http://localhost:8080/v1/fragments
```

On success, the response is `201 Created` with:

- a `Location` header pointing to the new fragment URL
- a JSON body containing the fragment metadata (`id`, `ownerId`, `created`, `updated`, `type`, `size`)

### List fragments

```bash
curl.exe -H "Authorization: Bearer <jwt-token>" http://localhost:8080/v1/fragments
```

Add `?expand=1` to return full metadata objects instead of IDs only.

### Get fragment data

```bash
curl.exe -H "Authorization: Bearer <jwt-token>" http://localhost:8080/v1/fragments/<fragment-id>
```

Returns the raw bytes with the fragment's stored `Content-Type` header.

---

## Storage

Fragment **metadata** and **data** are stored separately behind a pluggable data layer (`src/model/data/`). The default backend is an in-memory store (`MemoryDB`) suitable for development and testing. Swap the export in `src/model/data/index.js` to plug in a persistent backend (for example S3 + DynamoDB) later.

---

## Project Structure

```
src/
  index.js          # Entry point — loads .env, handles fatal errors, starts server
  server.js         # HTTP server (stoppable for graceful shutdown)
  app.js            # Express app, middleware, routes, error handlers
  auth/             # Cognito JWT or HTTP Basic Auth (selected via env vars)
  model/
    fragment.js     # Fragment domain model
    data/           # Storage layer (in-memory by default)
  routes/
    index.js        # Health check + /v1 mount with auth
    api/            # GET/POST /fragments, GET /fragments/:id
tests/
  unit/             # Jest unit and integration tests
  .htpasswd         # Test credentials for Basic Auth
```

---

## Initial Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root (this file is gitignored):

**Cognito (matches `fragments-ui`):**

```env
PORT=8080
FRAGMENTS_LOG_LEVEL=debug
AWS_COGNITO_POOL_ID=your_pool_id
AWS_COGNITO_CLIENT_ID=your_client_id
```

**Or HTTP Basic Auth (local dev without Cognito):**

```env
PORT=8080
FRAGMENTS_LOG_LEVEL=debug
HTPASSWD_FILE=path/to/.htpasswd
```

A `.env.debug` template with placeholder Cognito values is included for reference.

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP port (default `8080`) |
| `FRAGMENTS_LOG_LEVEL` | No | Log level: `info`, `debug`, or `silent` (default `info`) |
| `AWS_COGNITO_POOL_ID` | Cognito auth | Amazon Cognito User Pool ID |
| `AWS_COGNITO_CLIENT_ID` | Cognito auth | Cognito app client ID |
| `HTPASSWD_FILE` | Basic auth | Path to an htpasswd file (non-production only) |
| `API_URL` | No | Base URL used in the `Location` header on fragment creation (defaults to request host) |

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the API in normal mode (`node src/index.js`) |
| `npm run dev` | Start with nodemon and debug logging — restarts on file changes |
| `npm run debug` | Same as `dev`, plus Node inspector on port `9229` for breakpoints |
| `npm test` | Run the Jest test suite (uses `env.jest` for auth config) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run coverage` | Run tests with coverage report (80% line threshold) |
| `npm run lint` | Run ESLint on `src/` and `tests/` |

---

## Verify the Server

Once started (`start`, `dev`, or `debug`), test the health check:

```bash
curl.exe localhost:8080
```

Expected: `200 OK` with JSON containing `status`, `version`, `author`, `githubUrl`, and `timestamp`.

### Test a protected route

```bash
curl.exe -i ^
  -H "Authorization: Bearer <jwt-token>" ^
  http://localhost:8080/v1/fragments
```

Expected:

- `200 OK` with a valid token
- `401 Unauthorized` without a token

### Pretty-print JSON

If `jq` is installed:

```bash
curl.exe -s localhost:8080/ | jq
```

### View headers

```bash
curl.exe -i localhost:8080/
```

Expected headers include:

- `Cache-Control: no-cache`
- CORS headers (cross-origin requests are allowed)

---

## Testing

Tests run with HTTP Basic Auth using credentials from `tests/.htpasswd`. Environment variables are loaded from the committed `env.jest` file before Jest starts.

```bash
npm test
```

Test users (defined in `tests/.htpasswd`):

- `test-user1@fragments-testing.com` / `test-password1`
- `test-user2@fragments-testing.com` / `test-password2`

---

## Useful Notes

- Logging uses [Pino](https://getpino.io/). When `FRAGMENTS_LOG_LEVEL=debug`, logs are formatted with `pino-pretty`.
- `.env` and `.env.*` files are gitignored — never commit secrets.
- Unknown routes return a JSON `404` response.
- The server uses [stoppable](https://www.npmjs.com/package/stoppable) for graceful shutdown (used in tests).
- Security middleware includes Helmet, CORS, and compression.
- User emails are never stored directly; a SHA-256 hash is used as `ownerId`.
