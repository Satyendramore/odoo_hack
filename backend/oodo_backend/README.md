# AssetFlow Backend

A Spring Boot 3.3 asset management system with allocation, booking, and maintenance workflows.

## Features

- **Asset Lifecycle Management**: Register, track, and maintain assets with auto-generated tags (AF-0001, AF-0002, etc.)
- **Allocation & Transfer Workflow**: Safely allocate assets to users with conflict detection and transfer request workflow
- **Resource Booking**: Time-slot based booking with overlap detection (allows back-to-back bookings)
- **Maintenance Workflow**: Request, approve, and track asset maintenance with asset status integration
- **Dashboard KPI**: Real-time metrics across all modules
- **Role-Based Access Control**: ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE roles
- **Concurrency Safety**: Pessimistic database locking prevents race conditions

## Tech Stack

- **Framework**: Spring Boot 3.3
- **Language**: Java 17+
- **Database**: MySQL 8.0+
- **ORM**: Hibernate/JPA
- **Security**: Spring Security with JWT
- **Build**: Maven

## Prerequisites

- Java 17+
- Maven 3.6+
- MySQL 8.0+ (or Docker with Docker Compose)
- Git

## Quick Start

### 1. Database Setup

Start MySQL with Docker Compose:

```bash
docker-compose up -d
```

Or use an existing MySQL instance and update `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/odoobackend
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
```

### 2. Build & Run

```bash
mvn clean install
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`

### 3. Authentication

All endpoints except `/auth/signup` and `/auth/login` require authentication.

First, sign up:

```bash
curl -X POST http://localhost:8080/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "email": "john@example.com",
    "password": "password123"
  }'
```

Then login:

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "password123"
  }'
```

Use the returned JWT token for subsequent requests:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8080/assets
```

## API Endpoints

### Assets
- `POST /assets` - Create asset
- `GET /assets` - List assets (with filters)
- `GET /assets/{id}` - Get asset details
- `PATCH /assets/{id}/status` - Update asset status

### Allocations
- `POST /allocations` - Allocate asset (conflict detection)
- `POST /allocations/{id}/return` - Return asset
- `GET /allocations/{id}` - Get allocation
- `GET /allocations/asset/{id}/history` - Get allocation history
- `GET /allocations/overdue` - Get overdue allocations

### Transfer Requests
- `POST /transfer-requests` - Create transfer request
- `PATCH /transfer-requests/{id}/approve` - Approve transfer
- `PATCH /transfer-requests/{id}/reject` - Reject transfer
- `GET /transfer-requests` - List requests
- `GET /transfer-requests/{id}` - Get request details

### Bookings
- `POST /bookings` - Create booking (overlap detection)
- `GET /bookings/asset/{assetId}` - Get calendar (all bookings for asset)
- `GET /bookings/{id}` - Get booking
- `GET /bookings/my/upcoming` - Get my upcoming bookings
- `PATCH /bookings/{id}/cancel` - Cancel booking
- `PATCH /bookings/{id}/reschedule` - Reschedule booking

### Maintenance
- `POST /maintenance` - Raise maintenance request
- `PATCH /maintenance/{id}/approve` - Approve request
- `PATCH /maintenance/{id}/reject` - Reject request
- `PATCH /maintenance/{id}/resolve` - Resolve maintenance
- `GET /maintenance/asset/{assetId}` - Get maintenance history

### Dashboard
- `GET /dashboard/summary` - Get KPI metrics

## Architecture

### Concurrency Safety

**Pessimistic Write Locking** prevents race conditions:
- Allocation: Only one allocation per asset allowed
- Booking: Only one booking per time slot allowed

**Atomic Transactions** ensure consistency:
- Transfer workflow: Cancel old + create new (atomic)
- Booking reschedule: Cancel + create new (atomic)
- Maintenance resolve: Mark resolved + update asset (atomic)

### State Machines

Each module uses a defined state machine to prevent invalid transitions:
- **Asset**: AVAILABLE ↔ ALLOCATED, UNDER_MAINTENANCE, RESERVED, LOST, RETIRED, DISPOSED
- **Allocation**: ACTIVE → RETURNED
- **Booking**: UPCOMING → ONGOING, COMPLETED, CANCELLED
- **Maintenance**: PENDING → APPROVED/REJECTED → IN_PROGRESS → RESOLVED

### Schema

Hibernate/JPA manages the schema via `@Entity` classes. Schema is auto-generated on startup (`spring.jpa.hibernate.ddl-auto=update`).

## Authorization

- **ADMIN**: Full access to all operations
- **ASSET_MANAGER**: Approve/reject allocations and maintenance, manage transfers
- **DEPARTMENT_HEAD**: Limited to their department's assets
- **EMPLOYEE**: Can book resources, report maintenance issues

Authorization is enforced at two levels:
1. **Controller**: `@PreAuthorize` annotations on endpoints
2. **Service**: Role and ownership checks inside business logic

## Error Handling

Standard HTTP status codes:
- `200 OK` - Successful operation
- `201 Created` - Resource created
- `400 Bad Request` - Validation or state error
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Resource not found
- `409 Conflict` - Concurrent conflict (allocation/booking)

Error responses include structured data:

```json
{
  "timestamp": "2025-07-12T14:30:00",
  "status": 409,
  "message": "Asset is currently held by John Smith",
  "currentHolder": "John Smith",
  "suggestedAction": "TRANSFER_REQUEST"
}
```

## Project Structure

```
src/main/java/com/assetflow/
├── entity/              # JPA entities
├── dto/                 # Request/response DTOs
├── service/             # Business logic
├── controller/          # REST endpoints
├── repository/          # JPA repositories
├── exception/           # Custom exceptions
├── enums/               # Enums (Status, Role, etc.)
└── config/              # Spring configuration
```

## Development

### Logging

Comprehensive logging at INFO level:

```bash
tail -f target/application.log
```

### Testing

Run tests with:

```bash
mvn test
```

### Building for Production

Create a production JAR:

```bash
mvn clean package -DskipTests
java -jar target/assetflow-*.jar
```

## Docker

Build and run in Docker:

```bash
docker build -t assetflow .
docker run -p 8080:8080 assetflow
```

## Database Schema

Auto-generated on startup from `@Entity` classes:

- `users` - User accounts
- `assets` - Asset inventory
- `allocations` - Asset ownership tracking
- `transfer_requests` - Transfer workflow
- `bookings` - Time-slot bookings
- `maintenance_requests` - Maintenance requests

## Troubleshooting

### Application won't start

1. Check MySQL is running: `docker-compose ps`
2. Verify database credentials in `application.properties`
3. Check logs for exceptions

### 409 Conflict on allocation

This is expected behavior - it means the asset is already allocated to another user. Create a transfer request instead.

### 409 Conflict on booking

The requested time slot overlaps with an existing booking. The response includes the conflicting times.

## Support

For issues or questions, review the source code in `src/main/java/com/assetflow/` or check the service layer documentation in the code.

## License

Internal use only.
