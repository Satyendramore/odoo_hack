# AssetFlow - Enterprise Asset & Resource Management System

A Spring Boot 3.3 (Java 17) application for managing enterprise assets and resources with JWT-based authentication and role-based access control.

## Project Setup

### Prerequisites

- **Java 17** or later
- **Maven 3.8+**
- **PostgreSQL 16**
- **Docker** (optional, for PostgreSQL via docker-compose)

### Tech Stack

- **Spring Boot 3.3.0**
- **Spring Data JPA** with Hibernate
- **Spring Security 6** with JWT (JJWT 0.12.5)
- **PostgreSQL 16**
- **Lombok**
- **Maven**

## Quick Start

### 1. Start PostgreSQL Database

Using Docker Compose:

```bash
docker-compose up -d
```

Or if you have PostgreSQL installed locally:

```bash
# Create database
createdb assetflow

# Create user
psql -U postgres -c "CREATE USER assetflow WITH PASSWORD 'assetflow';"
psql -U postgres -c "ALTER USER assetflow CREATEDB;"
psql -U assetflow -d assetflow -c "GRANT ALL PRIVILEGES ON DATABASE assetflow TO assetflow;"
```

### 2. Build the Project

```bash
mvn clean install
```

### 3. Run the Application

```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080/api`

### 4. Run Tests

```bash
mvn test
```

## Configuration

Edit `src/main/resources/application.yml` to configure:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/assetflow
    username: assetflow
    password: assetflow

jwt:
  secret: your-secret-key-change-this-in-production
  expiration-ms: 86400000  # 24 hours
```

**Important**: Change the JWT secret in production to a secure random string (minimum 32 characters).

## API Endpoints

### Authentication

#### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

Response: `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "EMPLOYEE"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

Response: `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "EMPLOYEE"
}
```

### Using the JWT Token

Include the token in the Authorization header for protected endpoints:

```http
GET /api/some-protected-endpoint
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

## Project Structure

```
src/main/java/com/assetflow/
├── entity/              # JPA entities
│   ├── User.java       # User entity (implements UserDetails)
│   └── Department.java # Department entity
├── enums/              # Enumerations
│   ├── Role.java       # User roles: ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE
│   └── Status.java     # Status: ACTIVE, INACTIVE
├── repository/         # Spring Data JPA repositories
│   ├── UserRepository.java
│   └── DepartmentRepository.java
├── dto/                # Data Transfer Objects
│   ├── SignupRequest.java
│   ├── LoginRequest.java
│   ├── AuthResponse.java
│   └── ErrorResponse.java
├── service/            # Business logic
│   └── AuthService.java
├── controller/         # REST controllers
│   └── AuthController.java
├── security/           # Security configuration & JWT handling
│   ├── JwtUtil.java
│   ├── JwtAuthFilter.java
│   └── UserDetailsServiceImpl.java
├── exception/          # Custom exceptions & global handler
│   ├── EmailAlreadyExistsException.java
│   ├── InvalidCredentialsException.java
│   └── GlobalExceptionHandler.java
├── config/             # Spring configuration
│   └── SecurityConfig.java
└── AssetFlowApplication.java
```

## Key Features

### Setup + Auth Module

- **User Registration**: Create new accounts with email validation
- **User Login**: Authenticate with email and password
- **JWT Authentication**: Stateless token-based authentication
- **Role-Based Access Control**: Four user roles (ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE)
- **Password Security**: BCrypt hashing with strength 12
- **Validation**: Input validation with detailed error messages
- **Exception Handling**: Comprehensive global exception handler

### Security Features

- Stateless session policy
- CSRF protection disabled for API (stateless)
- BCryptPasswordEncoder with strength 12
- JWT tokens with 24-hour expiration
- Automatic role assignment on signup (always EMPLOYEE)
- Only authorized admins can promote users to higher roles

## User Roles

| Role | Description |
|------|-------------|
| **ADMIN** | System administrator with full access |
| **ASSET_MANAGER** | Manages company assets and inventory |
| **DEPARTMENT_HEAD** | Manages department-specific resources |
| **EMPLOYEE** | Regular employee (default on signup) |

## Error Handling

The API returns standardized error responses:

### Validation Error (400)
```json
{
  "timestamp": "2026-07-12T09:00:00",
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "email": "Email should be valid",
    "password": "Password should be at least 8 characters"
  }
}
```

### Email Already Exists (409)
```json
{
  "timestamp": "2026-07-12T09:00:00",
  "status": 409,
  "message": "Email already registered: john@example.com"
}
```

### Invalid Credentials (401)
```json
{
  "timestamp": "2026-07-12T09:00:00",
  "status": 401,
  "message": "Invalid email or password"
}
```

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `name` (String, not null)
- `email` (String, unique, not null)
- `password` (String, hashed, not null)
- `role` (Enum: ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE, not null)
- `department_id` (UUID, Foreign Key to Departments, nullable)
- `status` (Enum: ACTIVE, INACTIVE, not null)
- `created_at` (Timestamp, auto-generated)
- `updated_at` (Timestamp, auto-updated)

### Departments Table
- `id` (UUID, Primary Key)
- `name` (String, not null)
- `head_id` (UUID, Foreign Key to Users, nullable)
- `parent_department_id` (UUID, Self-referencing Foreign Key, nullable)
- `status` (Enum: ACTIVE, INACTIVE, not null)
- `created_at` (Timestamp, auto-generated)
- `updated_at` (Timestamp, auto-updated)

## Testing

Tests use an in-memory H2 database configured in `application-test.yml`.

Run all tests:
```bash
mvn test
```

Run a specific test class:
```bash
mvn test -Dtest=AssetFlowApplicationTests
```

## Build & Deployment

### Build JAR
```bash
mvn clean package -DskipTests
```

### Run JAR
```bash
java -jar target/assetflow-1.0.0.jar
```

### Run with Custom Properties
```bash
java -jar target/assetflow-1.0.0.jar \
  --spring.datasource.url=jdbc:postgresql://prod-db:5432/assetflow \
  --spring.datasource.username=assetflow \
  --spring.datasource.password=prod-password \
  --jwt.secret=your-production-secret-key
```

## Environment Variables

For production, use environment variables instead of hardcoding values:

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://prod-db:5432/assetflow
export SPRING_DATASOURCE_USERNAME=assetflow
export SPRING_DATASOURCE_PASSWORD=prod-password
export JWT_SECRET=your-production-secret-key
export JWT_EXPIRATION_MS=86400000
```

## Development Notes

### Adding New Endpoints

1. Create a DTO in `com.assetflow.dto`
2. Implement business logic in a Service class (`com.assetflow.service`)
3. Create a Controller method (`com.assetflow.controller`)
4. Add appropriate validation and exception handling
5. Update routes in SecurityConfig if needed

### Database Migrations

Using Hibernate with `ddl-auto: update` for development. For production, consider using Flyway or Liquibase for versioned migrations.

### Logging

Configure logging in `application.yml`:

```yaml
logging:
  level:
    root: INFO
    com.assetflow: DEBUG
```

## Future Modules

- Asset Management (CRUD operations)
- Department Management
- Resource Allocation
- Audit Logging
- Notification System
- Advanced Reporting

## License

This project is part of the AssetFlow Enterprise Management System.

## Support

For issues or questions, contact the development team.
