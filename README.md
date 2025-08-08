<div align="center">

# Booking & Property Management API

A production-ready REST API for managing properties and bookings, built with NestJS and Prisma. It showcases pragmatic architecture, robust validation, clean error handling, and clear documentation.

</div>

## Branches (important for reviewers)

- main: Implements the assignment scope (booking and properties) with clear validation, standardized responses, and Swagger.
- feature/auth: Adds full authentication (JWT), role-based access control (admin/user), guarded routes, and standardized error formatting. Use this branch to evaluate security and RBAC.

## Highlights

- **Properties**: CRUD with availability windows and pagination.
- **Bookings**: Create, list, get, update, cancel; prevents overlaps and enforces availability windows.
- **Date handling**: Accepts `YYYY-MM-DD` and `DD-MM-YYYY` inputs, returns ISO-formatted dates.
- **Consistent responses**: Unified response shape via `ResponseHelper`.
- **Documentation**: Interactive Swagger UI.
- **Testing**: Unit tests for services and controllers.

## Tech Stack

- NestJS 11, TypeScript 5
- Prisma ORM, PostgreSQL
- Jest, ts-jest
- Swagger (OpenAPI)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL

### Setup

```bash
git clone <your-repo-url>
cd booking-api
npm install
```

Create `.env` (example):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/booking_api?schema=public"
PORT=3000
NODE_ENV=development
```

Run database migrations:

```bash
npx prisma migrate dev --name init
```

Start the API:

```bash
npm run start:dev
```

- Base URL: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api`

### Example request

```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "<property-id>",
    "userName": "John Doe",
    "startDate": "2025-08-10",
    "endDate": "2025-08-12"
  }'
```

## API Overview

All endpoints are prefixed with `/api/v1`.

### Properties

- `GET /properties` — List (pagination + optional `status`)
- `GET /properties/:id` — Details with booked date ranges
- `GET /properties/:id/availability` — Availability summary
- `POST /properties` — Create
- `PUT /properties/:id` — Update
- `DELETE /properties/:id` — Delete

### Bookings

- `GET /bookings` — List (pagination + optional `status`)
- `GET /bookings/:id` — Details
- `POST /bookings` — Create (validates availability, prevents overlap)
- `PUT /bookings/:id` — Update (re-validates availability)
- `DELETE /bookings/:id` — Cancel (sets `status` to `cancelled`)

### Response format

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "length": 1,
  "timestamp": "2025-08-08T12:00:00.000Z"
}
```

## Authentication & Authorization

JWT-based auth with roles is implemented.

- Endpoints
  - POST `/api/v1/auth/register` — Registers a new user
  - POST `/api/v1/auth/login` — Returns `{ accessToken }` and user details

- Roles
  - `admin`: Can create/update/delete properties
  - `user`: Can create/update/delete bookings (where applicable)

- Protected routes
  - Properties (write): `POST/PUT/DELETE /api/v1/properties/*` require `admin` + Bearer token
  - Bookings (write): `POST/PUT/DELETE /api/v1/bookings/*` require valid Bearer token

- Error responses
  - Errors are standardized via `ResponseHelper` and a global exception filter
  - Example forbidden response when role is insufficient:
    ```json
    {
      "success": false,
      "message": "Only admins can perform this action",
      "timestamp": "2025-08-08T12:00:00.000Z",
      "path": "/api/v1/properties",
      "method": "POST"
    }
    ```

### Test users (for reviewer/employer)

- Admin user (role: admin)
  ```json
  {
    "success": true,
    "message": "Authenticated",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlODAwODZkOS0zOTMzLTRiMzEtYWNiZC04ZjRmYmVjMzQzNjIiLCJlbWFpbCI6ImJlcm5hcmRtYXlvd2FhQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDY1NTA4MiwiZXhwIjoxNzU0NjU1OTgyfQ.udF5QvOiKuezGiSuxmwvnHPuc_cF7_UMkEqOcQmJHHE",
      "user": {
        "id": "e80086d9-3933-4b31-acbd-8f4fbec34362",
        "email": "bernardmayowaa@gmail.com",
        "firstName": "Damilola",
        "lastName": "Toyosi",
        "phoneNumber": "+2348146694787",
        "role": "admin",
        "createdAt": "August 8, 2025",
        "updatedAt": "August 8, 2025"
      }
    },
    "timestamp": "2025-08-08T12:11:22.877Z"
  }
  ```

- Regular user (role: user)
  ```json
  {
    "success": true,
    "message": "Authenticated",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNWE1MzUwMy00N2ZlLTRhNGEtOGRlZC1mYTBiZWM4MzI1ZDciLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc1NDY1NTE4NywiZXhwIjoxNzU0NjU2MDg3fQ.qIGzYRgUY9TWupm0KjrR7dkP6WM0nkROErGCbMnWOSk",
      "user": {
        "id": "d5a53503-47fe-4a4a-8ded-fa0bec8325d7",
        "email": "user@example.com",
        "firstName": "Mayowa",
        "lastName": "Bernard",
        "phoneNumber": "+15551234567",
        "role": "user",
        "createdAt": "August 8, 2025",
        "updatedAt": "August 8, 2025"
      }
    },
    "timestamp": "2025-08-08T12:13:07.311Z"
  }
  ```

Note: Tokens expire; if expired, re-login to obtain a fresh token.

### Postman helper (save JWT)

Add this to the Tests tab of your login (or register) request to store the token as a collection variable `{{accessToken}}`:

```javascript
try {
  const json = pm.response.json();
  const token = json?.data?.accessToken;
  if (token) {
    pm.collectionVariables.set('accessToken', token);
  }
} catch (e) {}
```

Then set Authorization header in subsequent requests to:
- Key: `Authorization`
- Value: `Bearer {{accessToken}}`

## Validation & Error Handling

- Request DTOs are validated using class-validator via `ValidationPipe`.
- Dates are parsed and validated, including range checks.
- Bookings are validated against property windows and existing bookings.
- Errors use appropriate HTTP codes and descriptive messages.

## Testing

```bash
npm run test
```

What’s covered:
- Service and controller unit tests for both properties and bookings
- Overlap detection and validation paths

## Project Structure

- `src/`
  - `properties/` — controller, service, DTOs
  - `bookings/` — controller, service, DTOs
  - `common/` — utilities and validators (date parsing, input sanitation)
  - `shared/` — `ResponseHelper` for consistent API responses
  - `prisma/` — Prisma service integration
- `prisma/` — Prisma schema and migrations
- `generated/` — Prisma client typings
- `test/` — e2e tests

## Authentication: Why it’s currently omitted and how I would add it

### Why authentication is not included

Authentication was explicitly out of scope for the assignment to keep the focus on core domain capabilities (properties, bookings, validation, and documentation). This allowed tighter iteration on business logic, data validation, and API design under time constraints.

### How I would add authentication (production-ready plan)

1. Domain & schema
   - Add `User` model (Prisma): id, email, passwordHash, role (e.g., `admin`, `user`), timestamps
   - Optional: `RefreshToken` model if using rotating refresh tokens

2. Security & transport
   - Use JWT Bearer tokens (short-lived access tokens, optional refresh tokens)
   - Hash passwords with bcrypt (12–14 salt rounds)
   - Enforce HTTPS in production and secure cookie options if cookies are used

3. NestJS modules & guards
   - `AuthModule` with `LocalStrategy` (login) and `JwtStrategy` (protect routes)
   - `AuthService` for token issuance/verification
   - Route guards: `JwtAuthGuard` for protected routes; `RolesGuard` using a `@Roles(...)` decorator for RBAC

4. Endpoints
   - `POST /auth/register` — Create user, hash password
   - `POST /auth/login` — Issue access (and optional refresh) tokens
   - `POST /auth/refresh` — Rotate tokens (if implemented)
   - `POST /auth/logout` — Invalidate refresh token (if persisted)

5. Access control
   - Public: `GET /properties`, `GET /properties/:id`, `GET /properties/:id/availability`
   - Authenticated: `POST/PUT/DELETE /properties` (admin role)
   - Authenticated: `POST/PUT/DELETE /bookings` (user role), reads can be public or authenticated depending on product needs

6. Documentation & DX
   - Add `.addBearerAuth()` (already present) and secure Swagger UI via bearer auth
   - Provide Postman collection, seed admin credentials, and example bearer flows

7. Testing
   - Unit tests for `AuthService`, strategies, and guards
   - e2e tests covering login, protected routes, and RBAC

8. Operations
   - Store secrets in environment variables or a secret manager
   - Token TTLs: 15m access, 7d refresh (example)
   - Rate limiting and basic IP throttling on auth endpoints

If desired, I can implement a minimal, clean version of this in a separate branch to demonstrate competence without changing the core assignment scope.

### Should authentication be included to improve hiring chances?

- If the spec said “no auth,” keep the default branch without auth to respect requirements.
- To showcase broader capability, add a separate branch (e.g., `feature/auth`) implementing the plan above with tests and docs. This demonstrates practical security knowledge without deviating from the brief.
- A small, polished auth slice (users, login, JWT guard, role-based admin for property mutations) typically improves hiring outcomes—provided it’s well-tested and documented.

## Scripts

- `npm run start:dev` — Start in watch mode
- `npm run build` — Compile TypeScript
- `npm run test` — Run unit tests
- `npm run test:e2e` — Run e2e tests
- `npm run lint` — Lint and fix

## License

MIT

