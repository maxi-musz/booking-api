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
