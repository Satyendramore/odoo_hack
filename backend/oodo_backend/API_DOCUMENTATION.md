# AssetFlow API Documentation

Base URL: `http://localhost:8080/api`

## Authentication Endpoints

### 1. Sign Up

Create a new user account. New users are automatically assigned the `EMPLOYEE` role.

**Endpoint:** `POST /auth/signup`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "string (required, not blank)",
  "email": "string (required, valid email format)",
  "password": "string (required, minimum 8 characters)"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice.johnson@company.com",
    "password": "SecurePassword123"
  }'
```

**Success Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGljZS5qb2huc29uQGNvbXBhbnkuY29tIiwiaWF0IjoxNjg5MTAxNzAwLCJleHAiOjE2ODkxODgxMDB9.signature",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Alice Johnson",
  "email": "alice.johnson@company.com",
  "role": "EMPLOYEE"
}
```

**Error Responses:**

**400 Bad Request** - Validation failed:
```json
{
  "timestamp": "2026-07-12T10:30:00",
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "email": "Email should be valid",
    "password": "Password should be at least 8 characters"
  }
}
```

**409 Conflict** - Email already registered:
```json
{
  "timestamp": "2026-07-12T10:30:00",
  "status": 409,
  "message": "Email already registered: alice.johnson@company.com"
}
```

**Validation Rules:**
- `name`: Cannot be blank
- `email`: Must be a valid email address and unique
- `password`: Minimum 8 characters, must not be blank

---

### 2. Login

Authenticate with email and password to get a JWT token.

**Endpoint:** `POST /auth/login`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "string (required, valid email format)",
  "password": "string (required)"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.johnson@company.com",
    "password": "SecurePassword123"
  }'
```

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGljZS5qb2huc29uQGNvbXBhbnkuY29tIiwiaWF0IjoxNjg5MTAxNzAwLCJleHAiOjE2ODkxODgxMDB9.signature",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Alice Johnson",
  "email": "alice.johnson@company.com",
  "role": "EMPLOYEE"
}
```

**Error Responses:**

**400 Bad Request** - Validation failed:
```json
{
  "timestamp": "2026-07-12T10:30:00",
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "email": "Email should be valid"
  }
}
```

**401 Unauthorized** - Invalid credentials:
```json
{
  "timestamp": "2026-07-12T10:30:00",
  "status": 401,
  "message": "Invalid email or password"
}
```

---

## JWT Token Usage

Once authenticated, include the JWT token in the Authorization header for all protected endpoints:

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Example:**
```bash
curl -X GET http://localhost:8080/api/protected-endpoint \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json"
```

**Token Information:**
- **Format:** JWT (JSON Web Token)
- **Algorithm:** HS256 (HMAC SHA-256)
- **Expiration:** 24 hours from issuance
- **Claims:** 
  - `sub`: User email (username)
  - `iat`: Issued at (timestamp)
  - `exp`: Expiration time (timestamp)

**Token Lifespan:**
```
Issued:    2026-07-12 10:00:00 UTC
Expires:   2026-07-13 10:00:00 UTC
Duration:  24 hours
```

---

## Error Response Format

All error responses follow a standardized format:

**Validation Error (400):**
```json
{
  "timestamp": "2026-07-12T10:30:00",
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "fieldName": "Field validation error message"
  }
}
```

**Authentication Error (401):**
```json
{
  "timestamp": "2026-07-12T10:30:00",
  "status": 401,
  "message": "Invalid email or password"
}
```

**Conflict Error (409):**
```json
{
  "timestamp": "2026-07-12T10:30:00",
  "status": 409,
  "message": "Email already registered: user@example.com"
}
```

**Server Error (500):**
```json
{
  "timestamp": "2026-07-12T10:30:00",
  "status": 500,
  "message": "An unexpected error occurred"
}
```

---

## HTTP Status Codes

| Code | Description | When Used |
|------|-------------|-----------|
| **200** | OK | Successful login |
| **201** | Created | User successfully created |
| **400** | Bad Request | Invalid input/validation failed |
| **401** | Unauthorized | Invalid credentials or missing token |
| **403** | Forbidden | Insufficient permissions (when implemented) |
| **409** | Conflict | Email already exists |
| **500** | Internal Server Error | Unexpected server error |

---

## Response Headers

All responses include:
```
Content-Type: application/json
```

Authenticated responses include:
```
Authorization: Bearer <token>
```

---

## Request/Response Examples

### Complete Flow: Sign Up → Login → Access Protected Resource

**Step 1: Sign Up**
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Smith",
    "email": "bob.smith@company.com",
    "password": "MySecurePass2024"
  }'

# Response:
# {
#   "token": "eyJhbGciOiJIUzI1NiJ9...",
#   "userId": "123e4567-e89b-12d3-a456-426614174000",
#   "name": "Bob Smith",
#   "email": "bob.smith@company.com",
#   "role": "EMPLOYEE"
# }
```

**Step 2: Login (Get Fresh Token)**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob.smith@company.com",
    "password": "MySecurePass2024"
  }'

# Response:
# {
#   "token": "eyJhbGciOiJIUzI1NiJ9...",
#   "userId": "123e4567-e89b-12d3-a456-426614174000",
#   "name": "Bob Smith",
#   "email": "bob.smith@company.com",
#   "role": "EMPLOYEE"
# }
```

**Step 3: Use Token for Protected Resources**
```bash
curl -X GET http://localhost:8080/api/protected-endpoint \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json"

# Response: (Depends on protected endpoint)
```

---

## User Roles

| Role | Description | Default | Permissions |
|------|-------------|---------|------------|
| **EMPLOYEE** | Regular employee | Yes (on signup) | View own profile, basic access |
| **DEPARTMENT_HEAD** | Department lead | No (Admin only) | Manage department resources |
| **ASSET_MANAGER** | Asset administrator | No (Admin only) | Manage all assets |
| **ADMIN** | System administrator | No (Admin only) | Full system access |

**Note:** Self-elevation is architecturally impossible. Users are always created as EMPLOYEE. Role promotion must be done through a separate admin-only endpoint (not part of this module).

---

## Security Notes

1. **Token Storage:** Store tokens securely (HTTP-only cookies preferred over localStorage in web apps)
2. **Token Refresh:** Implement token refresh logic in frontend (currently fixed 24h expiration)
3. **Password Requirements:** Minimum 8 characters; enforce stronger requirements in production
4. **SSL/TLS:** Always use HTTPS in production
5. **CORS:** Configure CORS appropriately for your frontend domain
6. **Rate Limiting:** Consider implementing rate limiting on auth endpoints

---

## Rate Limiting (Future Implementation)

Recommended limits:
- Sign Up: 5 requests per 15 minutes per IP
- Login: 10 requests per 15 minutes per IP
- Protected Resources: 100 requests per minute per user

---

## API Version

Current Version: **1.0.0**

Base URL Pattern: `/api/v1/` (future support)

---

## Support & Troubleshooting

### Common Issues

**Q: "Invalid token" error**
A: Token may have expired. Get a new token by logging in again.

**Q: "User not found" after login**
A: Verify email matches exactly (case-sensitive in email validation). Check database connectivity.

**Q: CORS errors**
A: Configure CORS in SecurityConfig for your frontend domain (not needed for same-domain requests).

**Q: Token not being recognized**
A: Ensure Authorization header format is: `Bearer <token>` (with space).

---

## OpenAPI/Swagger (Future)

Swagger UI will be available at: `http://localhost:8080/api/swagger-ui.html` (when implemented)

---

## Changelog

### Version 1.0.0 (Initial Release)
- User signup with email validation
- User login with JWT authentication
- Role-based user structure
- Global exception handling
- JWT token generation and validation

---

Generated: 2026-07-12  
Last Updated: 2026-07-12  
Status: ✅ Active
