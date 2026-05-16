# fragments

Fragments back-end API.

---

### Prerequisites

- Node.js 20+
- npm
- Git
- `curl` (on Windows PowerShell, use `curl.exe`, not `curl`)
- `jq` for JSON pretty-printing in terminal

---

### Frontend Integration

This API is designed to work with the `fragments-ui` React frontend application.

The frontend:

- authenticates users with Amazon Cognito
- retrieves JWT tokens
- sends authenticated requests to the API

---

### Authentication

This API uses Amazon Cognito and JWT Bearer token authentication.

Protected routes require a valid Cognito-issued JWT in the Authorization header:

```http
Authorization: Bearer <jwt-token>
```

JWTs are verified using Passport JWT middleware.

---

## Protected Routes

The following routes require authentication:

```bash
GET /v1/fragments
```

Requests without a valid JWT will receive:

```http
401 Unauthorized
```

### Example Authenticated Request

Using curl:

```bash
curl.exe -H "Authorization: Bearer <jwt-token>" ^
http://localhost:8080/v1/fragments
```

---

### Initial Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local debug environment file in the project root:

```env
# .env.debug
PORT=8080
FRAGMENTS_LOG_LEVEL=debug
```

### Script Checklist

#### `npm run lint`

Runs ESLint on all JavaScript files in `src`.
Use this before commits to catch style and code-quality issues.

#### `npm start`

Starts the API in normal mode (no file watching).

- Uses `src/server.js`
- Defaults to port `8080` if `PORT` is not set
- Best for production-like local runs

#### `npm run dev`

Starts the API in development mode with automatic restarts on file changes.

- Loads environment variables from `.env.debug`
- Uses `node --watch`, so server restarts on file changes
- Best for everyday development

#### `npm run debug`

Starts the API in debug mode with Node inspector enabled.

- Loads environment variables from `.env.debug`
- Enables debugger on port `9229`
- Supports breakpoints and step debugging in VS Code
- Recommended for debugging API routes

### Verify the Server is Running

Once started (`start`, `dev`, or `debug`), test:

```bash
curl.exe localhost:8080
```

#### Test Protected Route

Example:

```bash
curl.exe -i ^
-H "Authorization: Bearer <jwt-token>" ^
http://localhost:8080/v1/fragments
```

Expected:

- `200 OK` with valid token
- `401 Unauthorized` without token

### Pretty-print JSON

If `jq` is installed:

```bash
curl -s localhost:8080/ | jq
```

### View headers

```bash
curl.exe -i localhost:8080/
```

Expected headers:

- `Cache-Control: no-cache`
- `Access-Control-Allow-Origin: *`

### Useful Notes

- Logging level is controlled by `FRAGMENTS_LOG_LEVEL`
- When set to `debug`, logs are formatted using `pino-pretty`
- `.env.debug` is ignored by Git and should not be committed
- If `PORT` changes, update your requests accordingly
- Health route is `/`
- Unknown routes return JSON 404 responses
- Authentication is handled using Passport JWT strategy
- JWTs are validated against Amazon Cognito
- CORS is enabled for frontend integration
- Protected routes require Bearer authentication
