# AssetFlow Project Structure

## Directory Layout

```
assetflow/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/assetflow/
│   │   │       ├── entity/                 # JPA Entities
│   │   │       │   ├── User.java
│   │   │       │   └── Department.java
│   │   │       ├── enums/                  # Enumerations
│   │   │       │   ├── Role.java
│   │   │       │   └── Status.java
│   │   │       ├── repository/             # Spring Data Repositories
│   │   │       │   ├── UserRepository.java
│   │   │       │   └── DepartmentRepository.java
│   │   │       ├── dto/                    # Data Transfer Objects
│   │   │       │   ├── SignupRequest.java
│   │   │       │   ├── LoginRequest.java
│   │   │       │   ├── AuthResponse.java
│   │   │       │   └── ErrorResponse.java
│   │   │       ├── service/                # Business Logic Services
│   │   │       │   └── AuthService.java
│   │   │       ├── controller/             # REST Controllers
│   │   │       │   └── AuthController.java
│   │   │       ├── security/               # Security & JWT Handling
│   │   │       │   ├── JwtUtil.java
│   │   │       │   ├── JwtAuthFilter.java
│   │   │       │   └── UserDetailsServiceImpl.java
│   │   │       ├── exception/              # Exception Handling
│   │   │       │   ├── EmailAlreadyExistsException.java
│   │   │       │   ├── InvalidCredentialsException.java
│   │   │       │   └── GlobalExceptionHandler.java
│   │   │       ├── config/                 # Spring Configuration
│   │   │       │   └── SecurityConfig.java
│   │   │       └── AssetFlowApplication.java  # Main Application Class
│   │   └── resources/
│   │       ├── application.yml             # Main configuration
│   │       ├── application-test.yml        # Test configuration
│   │       ├── static/                     # Static resources
│   │       └── templates/                  # Thymeleaf templates
│   │
│   └── test/
│       ├── java/
│       │   └── com/assetflow/
│       │       └── AssetFlowApplicationTests.java
│       └── resources/
│           └── application-test.yml        # Test DB configuration
│
├── target/                                 # Build output
├── .mvn/                                   # Maven wrapper
├── pom.xml                                 # Maven configuration
├── docker-compose.yml                      # Docker services
├── README.md                               # Project overview
├── SETUP_GUIDE.md                          # Setup instructions
├── API_DOCUMENTATION.md                    # API reference
├── PROJECT_STRUCTURE.md                    # This file
├── mvnw                                    # Maven wrapper (Unix)
├── mvnw.cmd                                # Maven wrapper (Windows)
├── .gitignore                              # Git ignore rules
└── HELP.md                                 # Spring Boot help
```

---

## Layer Architecture

### 1. **Presentation Layer** (Controller)
   - Handles HTTP requests and responses
   - Validates request input
   - Routes to appropriate services
   
   **Location:** `com.assetflow.controller`
   
   **Classes:**
   - `AuthController.java` - Handles /auth endpoints

### 2. **Business Logic Layer** (Service)
   - Implements business rules
   - Coordinates between repositories and external services
   - Handles transactions
   
   **Location:** `com.assetflow.service`
   
   **Classes:**
   - `AuthService.java` - Authentication/authorization logic

### 3. **Persistence Layer** (Repository)
   - Database operations
   - Extends JpaRepository for CRUD operations
   - Custom query methods
   
   **Location:** `com.assetflow.repository`
   
   **Classes:**
   - `UserRepository.java` - User CRUD operations
   - `DepartmentRepository.java` - Department CRUD operations

### 4. **Entity Layer** (Model)
   - JPA Entity classes
   - Database table mapping
   - Business entity logic
   
   **Location:** `com.assetflow.entity`
   
   **Classes:**
   - `User.java` - User entity (implements UserDetails)
   - `Department.java` - Department entity

### 5. **Security Layer**
   - JWT token generation and validation
   - Authentication filtering
   - User details loading
   
   **Location:** `com.assetflow.security`
   
   **Classes:**
   - `JwtUtil.java` - JWT operations
   - `JwtAuthFilter.java` - Filter for JWT validation
   - `UserDetailsServiceImpl.java` - Loads user details

### 6. **Configuration Layer**
   - Spring configuration
   - Security configuration
   - Bean definitions
   
   **Location:** `com.assetflow.config`
   
   **Classes:**
   - `SecurityConfig.java` - Security configuration

### 7. **Exception Handling Layer**
   - Custom exceptions
   - Global exception handler
   - Error responses
   
   **Location:** `com.assetflow.exception`
   
   **Classes:**
   - `EmailAlreadyExistsException.java` - Custom exception
   - `InvalidCredentialsException.java` - Custom exception
   - `GlobalExceptionHandler.java` - Global exception handler

### 8. **DTO Layer** (Data Transfer Objects)
   - Request/response objects
   - Input validation
   
   **Location:** `com.assetflow.dto`
   
   **Classes:**
   - `SignupRequest.java` - Signup request
   - `LoginRequest.java` - Login request
   - `AuthResponse.java` - Authentication response
   - `ErrorResponse.java` - Error response

### 9. **Enum Layer**
   - Enumerated types
   - Type-safe constants
   
   **Location:** `com.assetflow.enums`
   
   **Classes:**
   - `Role.java` - User roles
   - `Status.java` - Entity status

---

## Key Components Explained

### Entity: User

```
User
├── id (UUID, Primary Key)
├── name (String)
├── email (String, unique)
├── password (String, hashed)
├── role (Enum: ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE)
├── department (ManyToOne → Department, nullable)
├── status (Enum: ACTIVE, INACTIVE)
├── createdAt (Timestamp)
├── updatedAt (Timestamp)
└── UserDetails Methods (Spring Security)
    ├── getAuthorities() - returns ROLE_<ROLE_NAME>
    ├── getPassword()
    ├── getUsername() - returns email
    ├── isEnabled() - returns status == ACTIVE
    └── isAccountNonExpired/Locked/CredentialsNonExpired() - all true
```

**Implements:** `org.springframework.security.core.userdetails.UserDetails`

### Entity: Department

```
Department
├── id (UUID, Primary Key)
├── name (String)
├── head (ManyToOne → User, nullable)
├── parentDepartment (ManyToOne → Department (self), nullable)
├── status (Enum: ACTIVE, INACTIVE)
├── createdAt (Timestamp)
└── updatedAt (Timestamp)
```

### Repository Methods

**UserRepository:**
- `findByEmail(String)` - Find user by email (custom)
- `existsByEmail(String)` - Check if email exists (custom)
- Inherited from JpaRepository:
  - `save()`, `delete()`, `findById()`, `findAll()`, etc.

**DepartmentRepository:**
- Currently a stub, ready for expansion
- Inherited from JpaRepository

### Service: AuthService

```
AuthService
├── signup(SignupRequest)
│   ├── Validate email doesn't exist
│   ├── Hash password with BCrypt
│   ├── Create User with EMPLOYEE role
│   ├── Save to database
│   └── Return AuthResponse with JWT
│
└── login(LoginRequest)
    ├── Authenticate via AuthenticationManager
    ├── Load UserDetails
    ├── Generate JWT token
    └── Return AuthResponse
```

### Security Flow

```
HTTP Request
    ↓
JwtAuthFilter
├── Extract Bearer token from Authorization header
├── Validate token using JwtUtil
├── Load UserDetails via UserDetailsServiceImpl
└── Set SecurityContext
    ↓
SecurityConfig (authorize requests)
├── /auth/** → permitAll()
└── Other endpoints → requiresAuthentication()
    ↓
Controller
├── Process authenticated request
└── Return response
```

---

## File Naming Conventions

### Entity Classes
- Prefix: None
- Suffix: None
- Example: `User.java`, `Department.java`
- **Rule:** Singular noun, PascalCase

### Repository Classes
- Prefix: None
- Suffix: `Repository`
- Example: `UserRepository.java`, `DepartmentRepository.java`
- **Rule:** Entity name + Repository suffix

### Service Classes
- Prefix: None
- Suffix: `Service`
- Example: `AuthService.java`, `AssetService.java` (future)
- **Rule:** Domain name + Service suffix

### Controller Classes
- Prefix: None
- Suffix: `Controller`
- Example: `AuthController.java`, `AssetController.java` (future)
- **Rule:** Domain name + Controller suffix

### DTO Classes
- Prefix: None
- Suffix: `Request`, `Response`, or `DTO`
- Example: `SignupRequest.java`, `AuthResponse.java`, `UserDTO.java`
- **Rule:** Purpose + Type suffix

### Exception Classes
- Prefix: None
- Suffix: `Exception`
- Example: `EmailAlreadyExistsException.java`
- **Rule:** Description + Exception suffix

### Enum Classes
- Prefix: None
- Suffix: None
- Example: `Role.java`, `Status.java`
- **Rule:** Singular noun, PascalCase

### Configuration Classes
- Prefix: None
- Suffix: `Config`
- Example: `SecurityConfig.java`, `DatabaseConfig.java` (future)
- **Rule:** Domain + Config suffix

### Utility/Helper Classes
- Prefix: None
- Suffix: `Util` or `Helper`
- Example: `JwtUtil.java`
- **Rule:** Purpose + Util/Helper suffix

### Filter Classes
- Prefix: None
- Suffix: `Filter`
- Example: `JwtAuthFilter.java`
- **Rule:** Purpose + Filter suffix

---

## Package Naming Conventions

```
com.assetflow.<layer>
├── com.assetflow.entity
├── com.assetflow.enums
├── com.assetflow.repository
├── com.assetflow.service
├── com.assetflow.controller
├── com.assetflow.dto
├── com.assetflow.security
├── com.assetflow.exception
├── com.assetflow.config
└── com.assetflow.util (future)
```

---

## Import Guidelines

### Avoid Wildcard Imports
❌ `import com.assetflow.entity.*;`  
✅ `import com.assetflow.entity.User;`

### Organization Order
1. Java standard library imports
2. Third-party imports (Spring, JPA, etc.)
3. Internal project imports

### Example:
```java
// Java standard
import java.util.*;
import java.time.*;

// Third-party
import org.springframework.stereotype.Service;
import jakarta.persistence.*;

// Internal
import com.assetflow.entity.User;
import com.assetflow.repository.UserRepository;
```

---

## Configuration Files

### Main Configuration: `application.yml`
- Database connection
- JWT settings
- Server port
- Logging levels
- JPA/Hibernate settings

### Test Configuration: `application-test.yml`
- H2 in-memory database
- Test-specific settings
- Disable external services

### Future Configurations
- `application-prod.yml` - Production settings
- `application-dev.yml` - Development settings

---

## Testing Strategy

### Test Structure
```
src/test/java/com/assetflow/
├── controller/          # Controller tests
├── service/             # Service tests
├── repository/          # Repository tests (integration)
├── security/            # Security tests
└── AssetFlowApplicationTests.java  # Context loading test
```

### Test Naming
- Unit Tests: `*Test.java`
- Integration Tests: `*IntegrationTest.java`
- Controller Tests: `*ControllerTest.java`

### Example:
```java
@SpringBootTest
@ActiveProfiles("test")
class AuthServiceTest {
    
    @Test
    void testSignup() { ... }
    
    @Test
    void testLogin() { ... }
}
```

---

## Build & Dependency Management

### Maven Plugins
```xml
<!-- Spring Boot Maven Plugin -->
<spring-boot-maven-plugin>

<!-- Compiler Plugin -->
<maven-compiler-plugin>

<!-- Surefire Plugin (Tests) -->
<maven-surefire-plugin>
```

### Dependencies Categories
1. **Spring Boot Starters**
   - spring-boot-starter-web
   - spring-boot-starter-data-jpa
   - spring-boot-starter-security

2. **Data Access**
   - postgresql
   - spring-data-jpa
   - hibernate

3. **Security**
   - spring-security
   - jjwt-api/impl/jackson

4. **Utilities**
   - lombok

5. **Testing**
   - spring-boot-starter-test
   - spring-security-test
   - h2database

---

## Development Workflow

### Adding a New Feature

```
1. Create Entity (entity/)
   ↓
2. Create Repository (repository/)
   ↓
3. Create DTO (dto/)
   ↓
4. Create Service (service/)
   ↓
5. Create Controller (controller/)
   ↓
6. Update Config/Security (config/)
   ↓
7. Add Tests (test/)
   ↓
8. Update Documentation
```

### Example: Adding Asset Management

```
1. Asset.java (entity)
2. AssetRepository.java (repository)
3. CreateAssetRequest.java, AssetResponse.java (dto)
4. AssetService.java (service)
5. AssetController.java (controller)
6. Update SecurityConfig for authorization
7. AssetControllerTest.java, AssetServiceTest.java (tests)
8. Update API_DOCUMENTATION.md
```

---

## Database Schema Relationship Diagram

```
Users
├── id (PK)
├── name
├── email (unique)
├── password
├── role
├── department_id (FK to Departments.id)
├── status
├── created_at
└── updated_at

Departments
├── id (PK)
├── name
├── head_id (FK to Users.id, nullable)
├── parent_department_id (FK to Departments.id, nullable)
├── status
├── created_at
└── updated_at

Relationships:
Users.department_id → Departments.id (Many-to-One)
Users.id ← Departments.head_id (One-to-Many)
Departments.id ← Departments.parent_department_id (Self-referencing)
```

---

## Performance Considerations

### Lazy Loading
- `User.department` → Lazy loaded (avoid N+1 queries)
- `Department.head` → Lazy loaded

### Indexes (Recommended)
```sql
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_status ON users(status);
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_department_status ON departments(status);
```

### Batch Operations
- Configured in application.yml: `batch_size: 20`
- Fetch size: 100

---

## Documentation Standards

### JavaDoc
```java
/**
 * Brief description in one line.
 * 
 * More detailed explanation if needed.
 * 
 * @param paramName Description of parameter
 * @return Description of return value
 * @throws ExceptionType When this exception is thrown
 */
```

### Commit Messages
```
[Feature] Add user authentication
[Fix] Correct JWT token validation
[Refactor] Simplify authentication flow
[Test] Add unit tests for AuthService
[Docs] Update API documentation
```

---

## Security Checklist

- ✅ Password hashing with BCrypt (strength 12)
- ✅ JWT token with 24-hour expiration
- ✅ Stateless session policy
- ✅ CSRF disabled for stateless API
- ✅ Input validation on DTOs
- ✅ Email uniqueness constraint
- ✅ Role-based authorization (structure in place)
- ✅ Global exception handling
- ⏭️ Rate limiting (future)
- ⏭️ CORS configuration (future)
- ⏭️ Audit logging (future)

---

Generated: 2026-07-12  
Version: 1.0.0  
Status: ✅ Complete
