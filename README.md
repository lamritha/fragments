# fragments

Fragments back-end API — a REST microservice for storing and retrieving user-owned data fragments.

---

## Prerequisites

- Node.js 20+
- npm
- Git
- Docker (for containerized builds and deployment)
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

| Method | Path | Description                                                           |
| ------ | ---- | --------------------------------------------------------------------- |
| `GET`  | `/`  | Health check — returns service status, version, author, and timestamp |

### Protected (require authentication)

| Method   | Path                     | Description                                                                                                    |
| -------- | ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/v1/fragments`          | List the authenticated user's fragment IDs                                                                     |
| `GET`    | `/v1/fragments?expand=1` | List full fragment metadata objects                                                                            |
| `POST`   | `/v1/fragments`          | Create a new fragment from the raw request body                                                                |
| `GET`    | `/v1/fragments/:id`      | Return the raw fragment data with its `Content-Type`                                                           |
| `GET`    | `/v1/fragments/:id.ext`  | Return fragment data converted to the type indicated by the extension (e.g. `.html` converts Markdown to HTML) |
| `GET`    | `/v1/fragments/:id/info` | Return fragment metadata only (no data)                                                                        |
| `DELETE` | `/v1/fragments/:id`      | Delete a fragment and its data                                                                                 |

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

| Category   | MIME types                                                         |
| ---------- | ------------------------------------------------------------------ |
| Text       | `text/plain`, `text/markdown`, `text/html`, `text/csv`             |
| Structured | `application/json`, `application/yaml`                             |
| Image      | `image/png`, `image/jpeg`, `image/webp`, `image/avif`, `image/gif` |

Unsupported types return `415 Unsupported Media Type`. Request bodies are limited to **5 MB**.

### Fragment type conversions

Fragments can be retrieved in a different format by appending an extension to the fragment ID:

| Stored Type        | Supported Conversion Extensions          |
| ------------------ | ---------------------------------------- |
| `text/plain`       | `.txt`                                   |
| `text/markdown`    | `.md`, `.html`, `.txt`                   |
| `text/html`        | `.html`, `.txt`                          |
| `text/csv`         | `.csv`, `.txt`, `.json`                  |
| `application/json` | `.json`, `.yaml`, `.yml`, `.txt`         |
| `application/yaml` | `.yaml`, `.txt`                          |
| `image/png`        | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |
| `image/jpeg`       | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |
| `image/webp`       | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |
| `image/avif`       | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |
| `image/gif`        | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |

Unsupported conversions return `415 Unsupported Media Type`.

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

### Get fragment metadata

```bash
curl.exe -H "Authorization: Bearer <jwt-token>" http://localhost:8080/v1/fragments/<fragment-id>/info
```

Returns the fragment metadata object without fetching the underlying data.

### Convert fragment format

```bash
curl.exe -H "Authorization: Bearer <jwt-token>" http://localhost:8080/v1/fragments/<fragment-id>.html
```

Returns the fragment data converted to the requested type. For example, a Markdown fragment returned as `.html` will be rendered to HTML using [markdown-it](https://github.com/markdown-it/markdown-it).

---

## Storage

Fragment **metadata** and **data** are stored separately behind a pluggable data layer (`src/model/data/`). The default backend is an in-memory store (`MemoryDB`) suitable for development and testing. Swap the export in `src/model/data/index.js` to plug in a persistent backend (for example S3 + DynamoDB) later.

---

## Docker

The service is containerized using a multi-stage Docker build that produces a minimal Alpine-based production image.

### Build the image

```bash
docker build -t fragments:latest .
```

### Run the container

```bash
docker run --rm --name fragments \
  --env-file .env \
  -p 8080:8080 \
  fragments:latest
```

### Docker Hub

The image is published to Docker Hub and automatically rebuilt on every commit to `main` via GitHub Actions CI:

```bash
docker pull lamritha/fragments:latest
```

### Amazon ECR

Versioned images are also pushed to Amazon ECR via the CD workflow whenever a new git tag is created:

```bash
docker pull 529745007887.dkr.ecr.us-east-2.amazonaws.com/fragments:latest
```

---

## CI/CD

### Continuous Integration (`.github/workflows/ci.yml`)

Runs on every push to `main`:

1. **ESLint** — checks code style and quality
2. **Dockerfile Lint** — lints the Dockerfile using [Hadolint](https://github.com/hadolint/hadolint)
3. **Unit Tests** — runs the full Jest test suite
4. **Build and Push to Docker Hub** — builds and pushes the image tagged with the commit SHA, `main`, and `latest`

### Continuous Delivery (`.github/workflows/cd.yml`)

Runs whenever a new git tag starting with `v` is pushed:

1. Configures AWS credentials from GitHub Secrets
2. Logs into Amazon ECR
3. Builds and pushes the image tagged with the version tag and `latest`

To create a new release:

```bash
npm version 0.8.0 -m "Release v0.8.0"
git push origin main --tags
```

---

## Project Structure

```
src/
  index.js              # Entry point — loads .env, handles fatal errors, starts server
  server.js             # HTTP server (stoppable for graceful shutdown)
  app.js                # Express app, middleware, routes, error handlers
  hash.js               # SHA-256 email hashing utility
  logger.js             # Pino logger configuration
  response.js           # Standard success/error response helpers
  auth/
    index.js            # Selects Cognito or Basic Auth based on env vars
    cognito.js          # Cognito JWT Bearer strategy
    basic-auth.js       # HTTP Basic Auth strategy
    auth-middleware.js  # Custom Passport callback — hashes email, attaches to req.user
  model/
    fragment.js         # Fragment domain model
    data/
      index.js          # Re-exports the active storage backend
      memory/
        index.js        # In-memory metadata and data store
        memory-db.js    # Generic two-level key-value in-memory database
  routes/
    index.js            # Health check + /v1 mount with auth middleware
    api/
      index.js          # API router with raw body parser
      get.js            # GET /v1/fragments
      post.js           # POST /v1/fragments
      get-by-id.js      # GET /v1/fragments/:id and GET /v1/fragments/:id.ext
      get-by-id-info.js # GET /v1/fragments/:id/info
tests/
  unit/                 # Jest unit and integration tests
  .htpasswd             # Test credentials for Basic Auth
Dockerfile              # Multi-stage Alpine production build
.dockerignore           # Files excluded from the Docker build context
.github/
  workflows/
    ci.yml              # CI: lint, test, build and push to Docker Hub
    cd.yml              # CD: build and push to Amazon ECR on git tag
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
API_URL=http://localhost:8080
```

**Or HTTP Basic Auth (local dev without Cognito):**

```env
PORT=8080
FRAGMENTS_LOG_LEVEL=debug
HTPASSWD_FILE=path/to/.htpasswd
```

### Environment variables

| Variable                | Required     | Description                                                                            |
| ----------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `PORT`                  | No           | HTTP port (default `8080`)                                                             |
| `FRAGMENTS_LOG_LEVEL`   | No           | Log level: `info`, `debug`, or `silent` (default `info`)                               |
| `AWS_COGNITO_POOL_ID`   | Cognito auth | Amazon Cognito User Pool ID                                                            |
| `AWS_COGNITO_CLIENT_ID` | Cognito auth | Cognito app client ID                                                                  |
| `HTPASSWD_FILE`         | Basic auth   | Path to an htpasswd file (non-production only)                                         |
| `API_URL`               | No           | Base URL used in the `Location` header on fragment creation (defaults to request host) |

---

## Scripts

| Script               | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| `npm start`          | Start the API in normal mode (`node src/index.js`)                |
| `npm run dev`        | Start with nodemon and debug logging — restarts on file changes   |
| `npm run debug`      | Same as `dev`, plus Node inspector on port `9229` for breakpoints |
| `npm test`           | Run the Jest test suite (uses `env.jest` for auth config)         |
| `npm run test:watch` | Run tests in watch mode                                           |
| `npm run coverage`   | Run tests with coverage report (80% line threshold)               |
| `npm run lint`       | Run ESLint on `src/` and `tests/`                                 |

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
- The in-memory database does not persist across restarts — AWS DynamoDB and S3 integration is planned for a future release.
