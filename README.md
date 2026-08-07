# fragments

Fragments back-end API — a REST microservice for storing and retrieving user-owned data fragments.

---

## Prerequisites

- Node.js 20+
- npm
- Git
- Docker (for containerized builds, local AWS emulation, and deployment)
- [Hurl](https://hurl.dev/) (for integration tests; also installed as an npm devDependency)
- `curl` (on Windows PowerShell, use `curl.exe`, not `curl`)
- `jq` (optional, for JSON pretty-printing in the terminal)
- AWS CLI (optional, for `scripts/local-aws-setup.sh` against MiniStack / DynamoDB Local)

---

## Frontend Integration

This API is designed to work with the [`fragments-ui`](https://github.com/lamritha/fragments-ui) React frontend.

The frontend:

- authenticates users with Amazon Cognito
- retrieves JWT tokens
- sends authenticated requests to this API

Configure the frontend with the API base URL. For local development use `http://localhost:8080`. In production the API is available at:

```
https://fragments.alingeswaran1.mystudentproject.ca
```

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

| Method | Path | Description                                                                         |
| ------ | ---- | ----------------------------------------------------------------------------------- |
| `GET`  | `/`  | Health check — returns service status, version, author, hostname, and timestamp     |

### Protected (require authentication)

| Method   | Path                     | Description                                                                                                    |
| -------- | ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/v1/fragments`          | List the authenticated user's fragment IDs                                                                     |
| `GET`    | `/v1/fragments?expand=1` | List full fragment metadata objects                                                                            |
| `POST`   | `/v1/fragments`          | Create a new fragment from the raw request body                                                                |
| `GET`    | `/v1/fragments/:id`      | Return the raw fragment data with its `Content-Type`                                                           |
| `GET`    | `/v1/fragments/:id.ext`  | Return fragment data converted to the type indicated by the extension (e.g. `.html` converts Markdown to HTML) |
| `GET`    | `/v1/fragments/:id/info` | Return fragment metadata only (no data)                                                                        |
| `PUT`    | `/v1/fragments/:id`      | Update an existing fragment's data (Content-Type must match the original type)                                 |
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

The `Content-Type` header on `POST /v1/fragments` (and `PUT /v1/fragments/:id`) must be one of:

| Category   | MIME types                                                         |
| ---------- | ------------------------------------------------------------------ |
| Text       | `text/plain`, `text/markdown`, `text/html`, `text/csv`, `text/yaml` |
| Structured | `application/json`                                                 |
| Image      | `image/png`, `image/jpeg`, `image/webp`, `image/avif`, `image/gif` |

Unsupported types return `415 Unsupported Media Type`. Request bodies are limited to **5 MB**.

### Fragment type conversions

Fragments can be retrieved in a different format by appending an extension to the fragment ID (`GET /v1/fragments/:id.ext`):

| Stored Type        | Supported Conversion Extensions          | Notes                                      |
| ------------------ | ---------------------------------------- | ------------------------------------------ |
| `text/plain`       | `.txt`                                   | Same-type / passthrough                    |
| `text/markdown`    | `.md`, `.html`, `.txt`                   | `.html` rendered with [markdown-it](https://github.com/markdown-it/markdown-it) |
| `text/html`        | `.html`, `.txt`                          | Passthrough                                |
| `text/csv`         | `.csv`, `.txt`, `.json`                  | `.json` parsed into an array of objects    |
| `application/json` | `.json`, `.yaml`, `.yml`, `.txt`         | `.yaml` / `.yml` via [js-yaml](https://github.com/nodeca/js-yaml) (`text/yaml`) |
| `text/yaml`        | `.yaml`, `.txt`                          | Passthrough                                |
| `image/png`        | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` | Image transforms via [sharp](https://sharp.pixelplumbing.com/) |
| `image/jpeg`       | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` | Image transforms via sharp                 |
| `image/webp`       | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` | Image transforms via sharp                 |
| `image/avif`       | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` | Image transforms via sharp                 |
| `image/gif`        | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` | Image transforms via sharp                 |

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

### Update a fragment

```bash
curl.exe -i -X PUT ^
  -H "Authorization: Bearer <jwt-token>" ^
  -H "Content-Type: text/plain" ^
  --data "Updated content" ^
  http://localhost:8080/v1/fragments/<fragment-id>
```

The `Content-Type` must match the fragment's existing MIME type (changing type returns `400`). On success, returns `200` with the updated fragment metadata.

### Delete a fragment

```bash
curl.exe -i -X DELETE ^
  -H "Authorization: Bearer <jwt-token>" ^
  http://localhost:8080/v1/fragments/<fragment-id>
```

On success, returns `200` with `{ "status": "ok" }`. Subsequent `GET` requests for that ID return `404`.

---

## Storage

Fragment **metadata** and **data** are stored separately behind a pluggable data layer (`src/model/data/`). The active backend is selected automatically:

| Condition              | Backend                         | Metadata              | Data |
| ---------------------- | ------------------------------- | --------------------- | ---- |
| `AWS_REGION` is unset  | In-memory (`MemoryDB`)          | Memory                | Memory |
| `AWS_REGION` is set    | AWS (`src/model/data/aws/`)     | Amazon DynamoDB       | Amazon S3 |

### In-memory (default for unit tests)

Used when `AWS_REGION` is not set. Suitable for Jest tests and quick local runs without AWS. Data does not persist across process restarts.

### Amazon DynamoDB + S3 (local Docker Compose and production)

When `AWS_REGION` is set, the AWS backend is used:

- **Metadata** — stored in DynamoDB (`AWS_DYNAMODB_TABLE_NAME`, default `fragments`). Partition key `ownerId`, sort key `id`.
- **Data** — stored in S3 (`AWS_S3_BUCKET_NAME`) with object key `{ownerId}/{id}`.

Locally, Docker Compose runs [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) and [MiniStack](https://ministack.org/) (S3-compatible) with endpoint overrides via `AWS_DYNAMODB_ENDPOINT_URL` and `AWS_S3_ENDPOINT_URL`.

In production (ECS), the service uses real AWS DynamoDB and S3 in `us-east-2`.

---

## Local Development with Docker Compose

`docker-compose.yml` starts three services:

| Service          | Role                                      | Port  |
| ---------------- | ----------------------------------------- | ----- |
| `fragments`      | API server (built from local `Dockerfile`) | 8080 |
| `dynamodb-local` | DynamoDB Local (in-memory)                | 8000  |
| `ministack`      | Local S3-compatible store                 | 4566  |

The `fragments` service is configured with Basic Auth (`tests/.htpasswd`), `AWS_REGION=us-east-1`, and endpoints pointing at MiniStack and DynamoDB Local.

### Start the stack

```bash
docker compose up -d
```

### Create local AWS resources

After the containers are healthy, create the S3 bucket and DynamoDB table:

```bash
./scripts/local-aws-setup.sh
```

This script waits for MiniStack, creates the `fragments` bucket, and creates the `fragments` DynamoDB table (keys `ownerId` + `id`).

### Stop the stack

```bash
docker compose down
```

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

The image is published to Docker Hub as **`lamritha/fragments`** and automatically rebuilt on every push to `main` via GitHub Actions CI (tags: commit SHA, `main`, and `latest`):

```bash
docker pull lamritha/fragments:latest
```

### Amazon ECR

Versioned images are pushed to Amazon ECR via the CD workflow whenever a new git tag matching `v**` is created:

```bash
docker pull 529745007887.dkr.ecr.us-east-2.amazonaws.com/fragments:latest
```

---

## CI/CD

### Continuous Integration (`.github/workflows/ci.yml`)

Runs on pull requests to `main` and on every push to `main`:

1. **ESLint** — checks code style and quality
2. **Dockerfile Lint** — lints the Dockerfile using [Hadolint](https://github.com/hadolint/hadolint)
3. **Unit Tests** — runs the full Jest test suite (`npm install-ci-test`)
4. **Integration Tests** — starts Docker Compose, runs `scripts/local-aws-setup.sh`, then executes Hurl tests (`npm run test:integration`)
5. **Build and Push to Docker Hub** — builds and pushes `lamritha/fragments` tagged with the commit SHA, `main`, and `latest` (runs only after the jobs above succeed)

### Continuous Delivery (`.github/workflows/cd.yml`)

Runs whenever a new git tag matching `v**` is pushed:

1. Configures AWS credentials from GitHub Secrets
2. Logs into Amazon ECR
3. Builds and pushes the image tagged with the version tag and `latest`
4. Renders an updated ECS task definition from `fragments-definition.json` (new image + env)
5. Deploys the task definition to Amazon ECS and waits for service stability

To create a new release:

```bash
npm version 0.9.4 -m "Release v0.9.4"
git push origin main --tags
```

---

## ECS Deployment

Production runs on Amazon ECS (Fargate) in `us-east-2`.

| Resource            | Value                                                         |
| ------------------- | ------------------------------------------------------------- |
| Cluster             | `fragments-cluster`                                           |
| Service             | `fragments-task-service-c4cksduc`                             |
| Task definition     | `fragments-definition.json` (`fragments-task` family)         |
| Container name      | `fragments-container`                                         |
| Load balancer       | `fragments-lb`                                                |
| Custom domain       | `https://fragments.alingeswaran1.mystudentproject.ca`         |
| Region              | `us-east-2`                                                   |

The CD workflow updates the task definition image to the newly pushed ECR tag, sets `API_URL` to the custom domain, and deploys to the ECS service. The task definition also configures Cognito, `AWS_REGION`, S3 bucket, DynamoDB table name, and CloudWatch Logs.

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
      index.js          # Chooses memory vs AWS backend based on AWS_REGION
      memory/
        index.js        # In-memory metadata and data store
        memory-db.js    # Generic two-level key-value in-memory database
      aws/
        index.js        # DynamoDB metadata + S3 data backend
        s3Client.js     # Configured S3 client (supports local endpoints)
        ddbDocClient.js # DynamoDB Document client (supports local endpoints)
  routes/
    index.js            # Health check + /v1 mount with auth middleware
    api/
      index.js          # API router with raw body parser
      get.js            # GET /v1/fragments
      post.js           # POST /v1/fragments
      get-by-id.js      # GET /v1/fragments/:id and GET /v1/fragments/:id.ext
      get-by-id-info.js # GET /v1/fragments/:id/info
      put.js            # PUT /v1/fragments/:id
      delete.js         # DELETE /v1/fragments/:id
tests/
  unit/                 # Jest unit / route tests (Supertest)
  integration/          # Hurl end-to-end HTTP tests
  .htpasswd             # Test credentials for Basic Auth
scripts/
  local-aws-setup.sh    # Create MiniStack bucket + DynamoDB Local table
fragments-definition.json  # ECS task definition used by CD
docker-compose.yml      # Local API + DynamoDB Local + MiniStack
Dockerfile              # Multi-stage Alpine production build
.dockerignore           # Files excluded from the Docker build context
.github/
  workflows/
    ci.yml              # CI: lint, unit + Hurl tests, push to Docker Hub
    cd.yml              # CD: push to ECR and deploy to ECS on git tag
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

**With local AWS storage (Docker Compose):** set Cognito vars empty / use Basic Auth as in `docker-compose.yml`, plus:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_ENDPOINT_URL=http://localhost:4566
AWS_DYNAMODB_ENDPOINT_URL=http://localhost:8000
AWS_S3_BUCKET_NAME=fragments
AWS_DYNAMODB_TABLE_NAME=fragments
HTPASSWD_FILE=tests/.htpasswd
```

### Environment variables

| Variable                     | Required     | Description                                                                 |
| ---------------------------- | ------------ | --------------------------------------------------------------------------- |
| `PORT`                       | No           | HTTP port (default `8080`)                                                  |
| `FRAGMENTS_LOG_LEVEL`        | No           | Log level: `info`, `debug`, or `silent` (default `info`)                    |
| `NODE_ENV`                   | No           | When `production`, HTTP Basic Auth is disabled                              |
| `AWS_COGNITO_POOL_ID`        | Cognito auth | Amazon Cognito User Pool ID                                                 |
| `AWS_COGNITO_CLIENT_ID`      | Cognito auth | Cognito app client ID                                                       |
| `HTPASSWD_FILE`              | Basic auth   | Path to an htpasswd file (non-production only)                              |
| `API_URL`                    | No           | Base URL used in the `Location` header on fragment creation                 |
| `AWS_REGION`                 | AWS storage  | When set, enables DynamoDB + S3 backend                                     |
| `AWS_ACCESS_KEY_ID`          | Local AWS    | Access key (use `test` with MiniStack / DynamoDB Local)                     |
| `AWS_SECRET_ACCESS_KEY`       | Local AWS    | Secret key (use `test` with MiniStack / DynamoDB Local)                     |
| `AWS_S3_BUCKET_NAME`          | AWS storage  | S3 bucket for fragment data                                                 |
| `AWS_S3_ENDPOINT_URL`         | Local AWS    | Alternate S3 endpoint (e.g. MiniStack `http://localhost:4566`)              |
| `AWS_DYNAMODB_TABLE_NAME`     | AWS storage  | DynamoDB table for fragment metadata                                        |
| `AWS_DYNAMODB_ENDPOINT_URL`   | Local AWS    | Alternate DynamoDB endpoint (e.g. `http://localhost:8000`)                  |

---

## Scripts

| Script                    | Description                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `npm start`               | Start the API in normal mode (`node src/index.js`)                |
| `npm run dev`             | Start with nodemon and debug logging — restarts on file changes   |
| `npm run debug`           | Same as `dev`, plus Node inspector on port `9229` for breakpoints |
| `npm test`                | Run the Jest test suite (uses `env.jest` for auth config)         |
| `npm run test:watch`      | Run tests in watch mode                                           |
| `npm run test:integration`| Run Hurl integration tests against `http://localhost:8080`        |
| `npm run coverage`        | Run tests with coverage report (80% line threshold)               |
| `npm run lint`            | Run ESLint on `src/` and `tests/`                                 |

---

## Verify the Server

Once started (`start`, `dev`, or `debug`), test the health check:

```bash
curl.exe localhost:8080
```

Expected: `200 OK` with JSON containing `status`, `version`, `author`, `githubUrl`, `hostname`, and `timestamp`.

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

### Unit tests (Jest)

Tests run with HTTP Basic Auth using credentials from `tests/.htpasswd`. Environment variables are loaded from the committed `env.jest` file before Jest starts.

```bash
npm test
```

Test users (defined in `tests/.htpasswd`):

- `test-user1@fragments-testing.com` / `test-password1`
- `test-user2@fragments-testing.com` / `test-password2`

### Integration tests (Hurl)

End-to-end HTTP tests live in `tests/integration/*.hurl`. They expect the API at `http://localhost:8080` (typically via Docker Compose + `local-aws-setup.sh`).

```bash
docker compose up -d
./scripts/local-aws-setup.sh
npm run test:integration
```

Coverage includes health check, 404 handling, authenticated POST (plain text, charset, JSON), unsupported type / unauthenticated errors, PUT, DELETE, and Lab 9/10 S3 + DynamoDB flows.

---

## Useful Notes

- Logging uses [Pino](https://getpino.io/). When `FRAGMENTS_LOG_LEVEL=debug`, logs are formatted with `pino-pretty`.
- `.env` and `.env.*` files are gitignored — never commit secrets.
- Unknown routes return a JSON `404` response.
- The server uses [stoppable](https://www.npmjs.com/package/stoppable) for graceful shutdown (used in tests).
- Security middleware includes Helmet, CORS, and compression.
- User emails are never stored directly; a SHA-256 hash is used as `ownerId`.
- Storage backend is selected by `AWS_REGION`: unset → in-memory; set → DynamoDB metadata + S3 data.
- Production traffic reaches ECS through the `fragments-lb` load balancer and the custom domain `https://fragments.alingeswaran1.mystudentproject.ca`.
