# AssetFlow Setup Guide

## Step 1: Prerequisites Installation

### macOS (using Homebrew)

```bash
# Install Java 17
brew install java@17

# Install Maven
brew install maven

# Install PostgreSQL (optional, if not using Docker)
brew install postgresql

# Install Docker (optional, for docker-compose)
brew install --cask docker
```

### Verify Installations

```bash
java -version           # Should show Java 17+
mvn -version           # Should show Maven 3.8+
docker-compose --version  # If using Docker
```

## Step 2: Set Up Database

### Option A: Using Docker Compose (Recommended)

```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Verify PostgreSQL is running
docker ps  # Should show postgres:16 container

# Check database connection
docker exec assetflow-db psql -U assetflow -d assetflow -c "SELECT 1;"
```

### Option B: Local PostgreSQL Installation

```bash
# Start PostgreSQL service
brew services start postgresql

# Create database and user
psql -U postgres << EOF
CREATE DATABASE assetflow;
CREATE USER assetflow WITH ENCRYPTED PASSWORD 'assetflow';
ALTER ROLE assetflow SET client_encoding TO 'utf8';
ALTER ROLE assetflow SET default_transaction_isolation TO 'read committed';
ALTER ROLE assetflow SET default_transaction_deferrable TO on;
ALTER ROLE assetflow SET default_transaction_read_only TO off;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO assetflow;
GRANT ALL PRIVILEGES ON DATABASE assetflow TO assetflow;
EOF

# Verify connection
psql -U assetflow -d assetflow -c "SELECT 1;"
```

## Step 3: Clone or Download Project

```bash
# Navigate to project directory
cd /Users/satyendramore/Downloads/oodo_backend
```

## Step 4: Build Project

```bash
# Clean and build
mvn clean install

# Or skip tests for faster build
mvn clean install -DskipTests
```

## Step 5: Run Application

```bash
# Using Maven
mvn spring-boot:run

# Or build JAR and run
mvn clean package -DskipTests
java -jar target/assetflow-1.0.0.jar
```

The application will start on: `http://localhost:8080/api`

## Step 6: Test the API

### Test Sign Up

```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

Expected Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "EMPLOYEE"
}
```

### Test Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Test Protected Endpoint (once implemented)

```bash
# Replace TOKEN with the JWT token from signup/login response
curl -X GET http://localhost:8080/api/some-protected-endpoint \
  -H "Authorization: Bearer TOKEN"
```

## Common Issues & Solutions

### Issue: "Cannot connect to database"

**Solution:**
1. Verify PostgreSQL is running: `docker ps` or `brew services list`
2. Check credentials in `application.yml`
3. Ensure database exists: `createdb assetflow`
4. Test connection: `psql -U assetflow -d assetflow -c "SELECT 1;"`

### Issue: "Port 5432 already in use"

**Solution:**
```bash
# Find and kill process using port 5432
lsof -i :5432
kill -9 <PID>

# Or change database port in docker-compose.yml
```

### Issue: "Port 8080 already in use"

**Solution:**
```bash
# Change port in application.yml
server:
  port: 8081

# Or kill existing process
lsof -i :8080
kill -9 <PID>
```

### Issue: "Java compilation error: class not found"

**Solution:**
```bash
# Clean Maven cache and rebuild
mvn clean install -U
```

### Issue: "Module not found" error during build

**Solution:**
```bash
# Verify internet connection and Maven settings
mvn help:active-profiles
mvn dependency:resolve
mvn clean install
```

## Configuration for Different Environments

### Development (default)

No changes needed. Uses local PostgreSQL on localhost:5432

### Production

Edit `src/main/resources/application-prod.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://<PROD_DB_HOST>:5432/assetflow
    username: <DB_USER>
    password: <DB_PASSWORD>
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false

jwt:
  secret: <YOUR_SECURE_SECRET_KEY_MIN_32_CHARS>
  expiration-ms: 86400000

logging:
  level:
    root: WARN
    com.assetflow: INFO

server:
  port: 8080
  compression:
    enabled: true
```

Run with: `java -jar target/assetflow-1.0.0.jar --spring.profiles.active=prod`

## IDE Setup

### IntelliJ IDEA

1. Open project: `File > Open > Select project folder`
2. Wait for Maven to index
3. Configure SDK: `Project Structure > SDKs > + > Select Java 17`
4. Run Application: `Right-click AssetFlowApplication > Run`

### VS Code

1. Install extensions:
   - Extension Pack for Java
   - Spring Boot Extension Pack
   - Maven for Java

2. Open project in VS Code
3. Run: `Ctrl+Shift+D` > Select "Spring Boot App"

### Eclipse

1. `File > Import > Existing Maven Projects`
2. Select project root
3. Right-click project > `Run As > Spring Boot App`

## Testing

### Run All Tests

```bash
mvn test
```

### Run Specific Test Class

```bash
mvn test -Dtest=AssetFlowApplicationTests
```

### Run with Coverage

```bash
mvn clean test jacoco:report
# Coverage report: target/site/jacoco/index.html
```

## Database Management

### View Database Schema

```bash
psql -U assetflow -d assetflow -c "\dt"
```

### Reset Database

```bash
# Option 1: Through application (stops app first)
# Delete data and recreate schema

# Option 2: Manual reset
psql -U postgres << EOF
DROP DATABASE assetflow;
CREATE DATABASE assetflow;
GRANT ALL PRIVILEGES ON DATABASE assetflow TO assetflow;
EOF
```

### Backup Database

```bash
pg_dump -U assetflow -d assetflow > assetflow_backup.sql
```

### Restore Database

```bash
psql -U assetflow -d assetflow < assetflow_backup.sql
```

## Generate JWT Secret (for Production)

```bash
# Generate 32+ character random string
openssl rand -base64 32

# Or using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Next Steps

1. ✅ Database setup
2. ✅ Build and run application
3. ✅ Test auth endpoints
4. ⏭️ Create additional DTOs for assets/resources
5. ⏭️ Implement asset management endpoints
6. ⏭️ Add role-based authorization checks
7. ⏭️ Set up CI/CD pipeline

## Quick Reference Commands

```bash
# Build
mvn clean install -DskipTests

# Run
mvn spring-boot:run

# Test
mvn test

# Package JAR
mvn clean package -DskipTests

# View dependencies
mvn dependency:tree

# Format code
mvn spotless:apply

# Stop Docker services
docker-compose down

# Logs
# Real-time: tail -f logs/application.log
# In Docker: docker-compose logs -f postgres
```

## Getting Help

- Check logs: `target/logs/` or console output
- Database issues: `docker logs assetflow-db`
- Port conflicts: `lsof -i :<port>`
- Maven issues: Run with `-X` flag for debug output

---

**Setup Complete! 🎉**

Your AssetFlow application is ready for development. Start building! 🚀
