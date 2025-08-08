# Booking & Property Management API

A robust RESTful API for managing property listings and bookings, built with NestJS and Prisma ORM. This project demonstrates best practices in backend development, including validation, error handling, date management, and comprehensive API documentation with Swagger.

## Features

- **Property Management:** Create, update, delete, and list properties with availability ranges.
- **Booking System:** Book properties for specific date ranges, with validation against availability and overlapping bookings.
- **Availability Endpoint:** View a property’s available date range and all booked dates.
- **Date Handling:** Supports `DD-MM-YYYY` and `YYYY-MM-DD` formats, with strict validation and formatting in responses.
- **Timestamps:** All entities include `createdAt` and `updatedAt` fields.
- **Consistent API Responses:** All endpoints return structured responses with metadata (`success`, `message`, `data`, `length`, `timestamp`).
- **Error Handling:** Clear error messages for invalid input, unavailable dates, and overlapping bookings.
- **Swagger Documentation:** All endpoints, request/response formats, and error structures are documented and visible in the OpenAPI spec.

## Technology Stack

- **NestJS:** Modular, scalable Node.js framework.
- **Prisma ORM:** Type-safe database access.
- **PostgreSQL:** Relational database (configurable).
- **Swagger (OpenAPI):** Auto-generated API documentation.
- **Jest:** Unit and integration testing.

### Setup Instructions
See the **Getting Started** section below for installation, environment setup, and running the application.

### How to Test the Endpoints
- Use Swagger UI at `http://localhost:3000/api/v1/docs` for interactive API testing and documentation.
- Alternatively, use Postman or curl:
  - **Postman:** Import the Swagger/OpenAPI spec or manually create requests using the endpoint descriptions.
  - **curl Example:**
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

### Assumptions & Notes
- All date fields accept `YYYY-MM-DD` format; `DD-MM-YYYY` is also supported for input.
- Bookings are soft-deleted (status set to `cancelled`).
- Properties are soft-deleted (status set to `inactive`).
- Pagination and filtering are available for both bookings and properties.
- All responses are consistently formatted with metadata.
- The API is documented and testable via Swagger UI.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- PostgreSQL database

### Installation

```bash
git clone <your-repo-url>
cd booking-api
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env` and configure your database connection string.
2. Run Prisma migrations to set up the database schema:

```bash
npx prisma migrate dev --name init
```

### Running the Application

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`.

### API Documentation

Swagger UI is available at:

```
http://localhost:3000/api/v1/docs
```

## Usage

### Property Endpoints

- `GET /properties`: List all properties (paginated).
- `GET /properties/:id`: Get property details, including availability and booked dates.
- `POST /properties`: Create a new property.
- `PATCH /properties/:id`: Update property details.
- `DELETE /properties/:id`: Remove a property.

### Booking Endpoints

- `POST /bookings`: Create a booking for a property.
- `GET /bookings`: List all bookings.
- `GET /bookings/:id`: Get booking details.

### Availability

- Property details include:
  - `availableFrom`, `availableTo`: Date range the property can be booked.
  - `bookedDates`: Array of booked date ranges.

### Response Format

All responses follow this structure:

```json
{
  "success": true,
  "message": "Descriptive message",
  "data": { ... },
  "length": 1,
  "timestamp": "2025-08-08T12:00:00.000Z"
}
```

## Validation & Error Handling

- Dates are validated for format and logical range.
- Bookings are checked for overlap and property availability.
- All errors return clear messages and appropriate HTTP status codes.

## Testing

Run unit and integration tests:

```bash
npm run test
```

## Project Structure

- `src/`: Main source code
  - `properties/`: Property controllers, services, DTOs
  - `bookings/`: Booking controllers, services, DTOs
  - `common/`: Utilities and validators
  - `shared/`: Response helpers
  - `config/`: Configuration files
  - `prisma/`: Prisma service integration
- `prisma/`: Prisma schema and migrations
- `test/`: End-to-end tests

## Contributing

Pull requests and issues are welcome. Please follow conventional commit messages and ensure all tests pass.

## License

MIT

## API Endpoints

### Bookings

#### `GET /bookings`
Retrieve a paginated list of bookings, with optional filtering by status.
- **Query Parameters:**
  - `page` (number, optional): Page number (default: 1).
  - `limit` (number, optional): Items per page (default: 10, max: 100).
  - `status` (string, optional): Filter by booking status (`confirmed`, `cancelled`, `pending`, etc.).
- **Response:**
  Returns a paginated list of bookings, including metadata (`currentPage`, `pageSize`, `totalItems`, `totalPages`, `hasMore`, `length`) and booking details.

#### `GET /bookings/:id`
Retrieve details for a specific booking by its ID.
- **Path Parameter:**
  - `id` (string): Booking ID.
- **Response:**
  Returns the booking details, including associated property information. Returns a formatted error if the booking is not found.

#### `POST /bookings`
Create a new booking for a property.
- **Body:**
  - `propertyId` (string): ID of the property to book.
  - `userName` (string): Name of the user making the booking.
  - `startDate` (string, date): Booking start date (YYYY-MM-DD).
  - `endDate` (string, date): Booking end date (YYYY-MM-DD).
- **Validations:**
  - Dates must be within the property's availability range.
  - Dates must not overlap with existing bookings.
  - `startDate` must be before `endDate`.
  - `startDate` must be in the future.
- **Response:**
  Returns the created booking details, or a formatted error if validation fails.

#### `PUT /bookings/:id`
Update an existing booking.
- **Path Parameter:**
  - `id` (string): Booking ID.
- **Body:**
  - Any updatable booking fields (`propertyId`, `userName`, `startDate`, `endDate`).
- **Validations:**
  - Same as booking creation, with additional checks for property availability and date overlaps (excluding the current booking).
- **Response:**
  Returns the updated booking details, or a formatted error if validation fails.

#### `DELETE /bookings/:id`
Cancel (soft delete) a booking.
- **Path Parameter:**
  - `id` (string): Booking ID.
- **Response:**
  Sets the booking status to `cancelled` and returns the updated booking details. Returns a formatted error if the booking is not found.

---

### Properties

#### `GET /properties`
Retrieve a paginated list of properties, with advanced filtering options.
- **Query Parameters:**
  - `page` (number, optional): Page number (default: 1).
  - `limit` (number, optional): Items per page (default: 10, max: 100).
  - `status` (string, optional): Filter by property status (`active`, `inactive`, etc.).
  - `availableFrom` / `availableTo` (date, optional): Filter properties available within a specific date range.
  - Additional filters (e.g., price range) as supported.
- **Response:**
  Returns a paginated list of properties, including metadata and property details.

#### `GET /properties/:id`
Retrieve details for a specific property by its ID.
- **Path Parameter:**
  - `id` (string): Property ID.
- **Response:**
  Returns the property details, including availability and status.

#### `GET /properties/:id/availability`
Check the availability of a property for a given date range.
- **Path Parameter:**
  - `id` (string): Property ID.
- **Query Parameters:**
  - `startDate` (date, optional): Desired start date.
  - `endDate` (date, optional): Desired end date.
- **Response:**
  Returns availability information for the property, including any overlapping bookings.

#### `POST /properties`
Create a new property.
- **Body:**
  - Property details (title, description, price, availability dates, etc.).
- **Response:**
  Returns the created property details.

#### `PUT /properties/:id`
Update an existing property.
- **Path Parameter:**
  - `id` (string): Property ID.
- **Body:**
  - Any updatable property fields.
- **Response:**
  Returns the updated property details.

#### `DELETE /properties/:id`
Soft delete a property (if supported).
- **Path Parameter:**
  - `id` (string): Property ID.
- **Response:**
  Sets the property status to `inactive` or similar, and returns the updated property details.

---
