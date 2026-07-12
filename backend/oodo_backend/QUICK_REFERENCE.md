# AssetFlow - Quick Reference Card

**Keep this handy while developing!**

---

## 🚀 Essential Commands

```bash
# Setup (First Time)
docker-compose up -d              # Start PostgreSQL
mvn clean install                 # Build project

# Development
mvn spring-boot:run               # Run application
mvn test                          # Run tests
mvn clean compile                 # Compile only

# Build for Production
mvn clean package -DskipTests     # Create JAR
java -jar target/assetflow-1.0.0.jar  # Run JAR

# Docker
docker-compose down               # Stop services
docker-compose logs -f            # View logs
docker ps                         # Check running services
```

---

## 📍 Base URLs & Ports

| Service | URL | Port |
|---------|-----|------|
| API | `http://localhost:8080/api` | 8080 |
| Database | `localhost:5432/assetflow` | 5432 |
| App Context | `/api` | - |

---

## 🔑 Database Credentials

```
Host: localhost
Port: 5432
Database: assetflow
Username: assetflow
Password: assetflow
```

---

## 📡 API Endpoints (Auth Module)

### Signup
```http
POST /auth/signup
Content-Type: application/json

{
  "name": "string",
  "email": "user@example.com",
  "password": "min8chars"
}
```
Response: `201 Created` with AuthResponse

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```
Response: `200 OK` with AuthResponse

### Protected Resources
```http
GET /api/protected-endpoint
Authorization: Bearer <token>
```

---

## 🏗️ Project Structure

```
com.assetflow.
├── entity/        → Database models
├── repository/    → Data access
├── service/       → Business logic
├── controller/    → REST endpoints
├── dto/           → Request/Response objects
├── security/      → JWT & authentication
├── exception/     → Error handling
├── config/        → Spring configuration
└── enum/          → Constants
```

---

## 🔐 User Roles

| Role | Permission |
|------|-----------|
| EMPLOYEE | Default role on signup |
| DEPARTMENT_HEAD | Manage department |
| ASSET_MANAGER | Manage assets |
| ADMIN | Full system access |

---

## 📝 Common DTO Examples

### SignupRequest
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "SecurePassword123"
}
```
**Note:** Never send `role` in signup request

### LoginRequest
```json
{
  "email": "john@company.com",
  "password": "SecurePassword123"
}
```

### AuthResponse
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@company.com",
  "role": "EMPLOYEE"
}
```

---

## 🛠️ Adding New Features

### Step 1: Create Entity
```java
@Entity
@Data
public class Asset {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    // ... fields
}
```

### Step 2: Create Repository
```java
@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID> {
    // Custom queries
}
```

### Step 3: Create DTO
```java
public record CreateAssetRequest(
    @NotBlank String name,
    @NotBlank String description
) {}
```

### Step 4: Create Service
```java
@Service
@RequiredArgsConstructor
public class AssetService {
    private final AssetRepository repository;
    
    public Asset create(CreateAssetRequest request) {
        // Business logic
        return repository.save(asset);
    }
}
```

### Step 5: Create Controller
```java
@RestController
@RequestMapping("/assets")
@RequiredArgsConstructor
public class AssetController {
    private final AssetService service;
    
    @PostMapping
    public ResponseEntity<Asset> create(@Valid @RequestBody CreateAssetRequest req) {
        return ResponseEntity.status(201).body(service.create(req));
    }
}
```

### Step 6: Update SecurityConfig
```java
// In SecurityConfig.java
.authorizeHttpRequests(authorize -> authorize
    .requestMatchers("/auth/**").permitAll()
    .requestMatchers("/assets/**").authenticated()  // Add this
    .anyRequest().authenticated()
)
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process on port
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Database Connection Failed
```bash
# Verify container running
docker ps | grep postgres

# Check logs
docker-compose logs postgres

# Restart
docker-compose restart
```

### JWT Secret Too Short
```bash
# Generate secure secret (32+ chars)
openssl rand -base64 32
```

### Clean Maven Cache
```bash
mvn clean
rm -rf ~/.m2/repository/com/assetflow/
mvn clean install
```

---

## 📚 Documentation Quick Links

| Need | Document |
|------|----------|
| Getting Started | README.md |
| Installation | SETUP_GUIDE.md |
| API Details | API_DOCUMENTATION.md |
| Architecture | PROJECT_STRUCTURE.md |
| Build Info | BUILD_SUMMARY.md |
| All Files | DELIVERABLES.md |
| File Guide | INDEX.md |

---

## ⚡ Performance Tips

- Use `@Transactional(readOnly=true)` for read-only operations
- Lazy load relationships with `@ManyToOne(fetch = FetchType.LAZY)`
- Index frequently searched columns
- Use batch operations for bulk inserts
- Configure connection pooling in application.yml

---

## 🔒 Security Checklist

Before each commit:
- [ ] No hardcoded secrets
- [ ] Input validation on all DTOs
- [ ] Error messages don't leak info
- [ ] Proper exception handling
- [ ] Database connection closed properly
- [ ] No SQL injection vulnerabilities

Before production:
- [ ] JWT secret changed (32+ chars)
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Security headers set

---

## 🧪 Testing Quick Commands

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=AuthServiceTest

# Run specific test method
mvn test -Dtest=AuthServiceTest#testSignup

# Generate coverage report
mvn clean test jacoco:report

# View coverage
open target/site/jacoco/index.html
```

---

## 🔄 Common Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes, then:
git add .
git commit -m "[Feature] Add new feature"

# Test before pushing
mvn test

# Push to origin
git push origin feature/new-feature

# Create pull request on GitHub
```

---

## 💾 Configuration Reference

### Main Config (application.yml)
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/assetflow
    username: assetflow
    password: assetflow

jwt:
  secret: your-secret-key
  expiration-ms: 86400000  # 24 hours

server:
  port: 8080
```

### Test Config (application-test.yml)
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
```

---

## 📊 File Locations Reference

| What | Where |
|------|-------|
| Source Code | `src/main/java/com/assetflow/` |
| Configuration | `src/main/resources/` |
| Test Code | `src/test/java/com/assetflow/` |
| Test Config | `src/test/resources/` |
| Build Output | `target/` |
| Documentation | Project root (*.md) |
| Maven Config | `pom.xml` |
| Docker Config | `docker-compose.yml` |

---

## 🔗 Import Statements (Common)

```java
// Spring Framework
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.userdetails.*;

// Spring Data
import org.springframework.data.jpa.repository.*;

// JPA
import jakarta.persistence.*;

// Validation
import jakarta.validation.constraints.*;

// Lombok
import lombok.*;

// Java
import java.util.UUID;
import java.time.LocalDateTime;
```

---

## 🚀 Deployment Checklist

- [ ] Update pom.xml version
- [ ] Update JWT secret
- [ ] Update database URL
- [ ] Update database password
- [ ] Configure CORS origins
- [ ] Enable compression
- [ ] Set log levels
- [ ] Build JAR: `mvn clean package`
- [ ] Test JAR locally
- [ ] Upload to server
- [ ] Run: `java -jar assetflow-1.0.0.jar`

---

## 📞 One-Liners for Development

```bash
# Build and run
mvn clean install && mvn spring-boot:run

# Build, test, package
mvn clean install -DskipTests && mvn package

# Test specific class
mvn test -Dtest=ClassName

# Format and compile
mvn clean compile

# Check dependencies
mvn dependency:tree

# Update dependencies
mvn dependency:update-snapshots

# Skip tests but keep them
mvn clean install -DskipTests -DskipITs

# Start fresh
mvn clean && rm -rf ~/.m2/repository/com/assetflow && mvn install
```

---

## 📋 Branch Naming Convention

```
feature/description         → New features
bugfix/description         → Bug fixes
hotfix/description         → Critical fixes
refactor/description       → Code improvements
test/description           → Test additions
docs/description           → Documentation
```

---

## 🎯 Key Files to Know

- `pom.xml` - Dependencies and build config
- `application.yml` - Main app configuration
- `SecurityConfig.java` - Security setup
- `AuthController.java` - API endpoints
- `AuthService.java` - Business logic
- `User.java` - Main entity
- `UserRepository.java` - Database access
- `JwtUtil.java` - JWT handling

---

## ✨ Pro Tips

1. Always run tests before committing
2. Use meaningful branch names
3. Keep commits small and focused
4. Update documentation with features
5. Review code before merging
6. Use .gitignore for IDE files
7. Keep passwords in environment variables
8. Test error scenarios
9. Log important events
10. Comment complex logic

---

## 📚 Further Reading

- Spring Boot Docs: https://spring.io/projects/spring-boot
- Spring Security: https://spring.io/projects/spring-security
- JJWT Documentation: https://github.com/jwtk/jjwt
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

**Last Updated:** July 12, 2026  
**Version:** 1.0.0  

Print this for your desk! 🖨️
