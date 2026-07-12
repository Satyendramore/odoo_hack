# Asset Registration & Lifecycle Module

This document describes the Asset Registration & Lifecycle module added to the AssetFlow Spring Boot application.

## Overview

The Asset module provides comprehensive asset management capabilities including:
- Asset registration with unique tag generation
- Asset search and filtering by multiple criteria
- Asset lifecycle management with status transitions
- Concurrent-safe tag generation using database sequences
- Flexible filtering using JPA Specifications

## Components

### 1. **Enums**

#### AssetStatus
Defines the complete lifecycle states for an asset:
- `AVAILABLE` - Asset is ready for use
- `ALLOCATED` - Asset is assigned to a user/department
- `RESERVED` - Asset is reserved for future use
- `UNDER_MAINTENANCE` - Asset is being serviced
- `LOST` - Asset is reported lost
- `RETIRED` - Asset is retired from service
- `DISPOSED` - Asset has been disposed of (terminal state)

**Location**: `com.assetflow.enums.AssetStatus`

### 2. **Entities**

#### Asset
Represents a physical or digital asset within the organization.

**Fields**:
- `id` (UUID) - Primary key, auto-generated
- `assetTag` (String) - Unique identifier (format: AF-0001, AF-0042, etc.)
- `category` (ManyToOne AssetCategory) - Asset category/type
- `serialNumber` (String, nullable) - Unique serial number if present
- `acquisitionDate` (LocalDate, nullable) - Purchase date
- `acquisitionCost` (BigDecimal, nullable) - Purchase cost (for reporting only)
- `condition` (String) - Current condition (e.g., "New", "Good", "Fair", "Poor")
- `location` (String) - Current location/warehouse
- `department` (ManyToOne Department, nullable) - Responsible department
- `status` (AssetStatus) - Current lifecycle state (default: AVAILABLE)
- `isBookable` (Boolean) - Whether asset can be booked/reserved by users
- `photoUrl` (String, nullable) - URL to asset photo
- `createdAt` (Instant) - Creation timestamp

**Database Table**: `assets`
- Unique constraints: `asset_tag`, `serial_number`
- Indexes: category, department, status, location, asset_tag
- Foreign keys: category_id (asset_categories), department_id (departments)

**Location**: `com.assetflow.entity.Asset`

### 3. **DTOs**

#### AssetRegistrationRequest
Request body for asset registration.

```json
{
  "categoryId": "uuid",           // required
  "serialNumber": "string",       // optional
  "acquisitionDate": "2024-01-15", // optional, ISO-8601 format
  "acquisitionCost": "5000.00",   // optional, must be >= 0
  "condition": "Good",            // optional
  "location": "Warehouse A",      // required
  "departmentId": "uuid",         // optional
  "isBookable": true,             // optional, default: false
  "photoUrl": "https://..."       // optional
}
```

**Validation**:
- `categoryId`: @NotNull
- `location`: @NotBlank
- `acquisitionCost`: @DecimalMin("0")

**Location**: `com.assetflow.dto.AssetRegistrationRequest`

#### AssetResponse
Response body for asset queries.

```json
{
  "id": "uuid",
  "assetTag": "AF-0042",
  "categoryName": "Laptop",
  "categoryId": "uuid",
  "serialNumber": "SN123456",
  "acquisitionDate": "2024-01-15",
  "acquisitionCost": "5000.00",
  "condition": "Good",
  "location": "Warehouse A",
  "departmentName": "IT",
  "departmentId": "uuid",
  "status": "AVAILABLE",
  "isBookable": true,
  "photoUrl": "https://...",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Location**: `com.assetflow.dto.AssetResponse`

#### AssetStatusUpdateRequest
Request body for status transitions.

```json
{
  "status": "ALLOCATED"  // required, must be a valid AssetStatus
}
```

**Validation**:
- `status`: @NotNull

**Location**: `com.assetflow.dto.AssetStatusUpdateRequest`

### 4. **Repositories**

#### AssetRepository
Spring Data JPA repository with Specification support.

```java
public interface AssetRepository extends JpaRepository<Asset, UUID>, 
                                         JpaSpecificationExecutor<Asset>
```

**Methods**:
- `findAll(Specification<Asset>, Pageable)` - Inherited from JpaSpecificationExecutor
- `existsByAssetTag(String)` - Check if asset tag exists
- `findByAssetTag(String)` - Find asset by tag
- `existsBySerialNumber(String)` - Check if serial number exists

**Location**: `com.assetflow.repository.AssetRepository`

### 5. **Services**

#### AssetService
Core business logic for asset management.

**Methods**:

##### registerAsset(AssetRegistrationRequest)
Registers a new asset with the following workflow:
1. Validates and resolves the category (throws `CategoryNotFoundException` if missing)
2. Resolves the department if provided (throws `DepartmentNotFoundException` if missing)
3. Generates a unique asset tag using `AssetTagGenerator`
4. Creates asset entity with default status = AVAILABLE
5. Persists to database
6. Returns `AssetResponse`

**Authorization**: ASSET_MANAGER or ADMIN

**Transactions**: @Transactional (read-write)

##### searchAssets(UUID categoryId, AssetStatus status, String location, UUID departmentId, int page, int size)
Searches for assets using flexible filtering.

**Parameters** (all optional):
- `categoryId` - Filter by asset category
- `status` - Filter by lifecycle status
- `location` - Partial location match (case-insensitive)
- `departmentId` - Filter by responsible department
- `page` - Page number (0-indexed, default 0)
- `size` - Page size (default 20)

**Returns**: `Page<AssetResponse>` with pagination metadata

**Implementation**: Uses Spring Data JPA Specifications to avoid combinatorial query explosion

**Authorization**: Authenticated users

**Transactions**: @Transactional(readOnly=true)

##### getById(UUID id)
Retrieves a single asset by ID.

**Parameters**:
- `id` - Asset UUID

**Returns**: `AssetResponse`

**Throws**: `AssetNotFoundException` if not found

**Authorization**: Authenticated users

**Transactions**: @Transactional(readOnly=true)

##### updateStatus(UUID id, AssetStatusUpdateRequest request)
Updates asset status with strict state machine validation.

**Workflow**:
1. Loads asset (throws `AssetNotFoundException` if missing)
2. Validates transition using `ALLOWED_TRANSITIONS` map
3. Updates status
4. Persists to database
5. Returns `AssetResponse`

**Allowed Transitions**:
```
AVAILABLE       → ALLOCATED, RESERVED, UNDER_MAINTENANCE, LOST, RETIRED
ALLOCATED       → AVAILABLE, LOST
RESERVED        → AVAILABLE, ALLOCATED
UNDER_MAINTENANCE → AVAILABLE, RETIRED
LOST            → AVAILABLE, RETIRED
RETIRED         → DISPOSED
DISPOSED        → (terminal, no transitions)
```

**Authorization**: ASSET_MANAGER or ADMIN

**Throws**: `InvalidStatusTransitionException` if transition not allowed

**Transactions**: @Transactional (read-write)

**Location**: `com.assetflow.service.AssetService`

#### AssetTagGenerator
Generates unique asset tags using database sequence.

**Methods**:

##### generateAssetTag()
Generates next asset tag in format AF-XXXX.

**Workflow**:
1. Queries PostgreSQL sequence `asset_tag_seq` using `nextval()`
2. Formats result: 1-9999 → "AF-0001" to "AF-9999", ≥10000 → "AF-10000" etc.
3. Returns formatted string

**Concurrency Safety**: Uses PostgreSQL SEQUENCE nextval() which is atomic at database level

**Transactions**: @Transactional

**Implementation Details**:
- Uses EntityManager to execute native query (JDBC would be alternative)
- Database sequence prevents duplicate generation under concurrent load
- No application-level locking needed

**Location**: `com.assetflow.service.AssetTagGenerator`

### 6. **Specifications**

#### AssetSpecifications
Utility class providing reusable JPA Specifications for flexible asset filtering.

**Static Methods**:

##### hasCategory(UUID categoryId)
Matches assets with given category ID (null-safe).

##### hasStatus(AssetStatus status)
Matches assets with given status (null-safe).

##### hasLocation(String location)
Partial case-insensitive location match (null-safe).

##### hasDepartment(UUID departmentId)
Matches assets with given department ID (null-safe).

##### tagOrSerialContains(String searchTerm)
Matches assets where asset_tag or serial_number contains search term.

**Usage Pattern**:
```java
Specification<Asset> spec = Specification.where(AssetSpecifications.hasCategory(categoryId))
    .and(AssetSpecifications.hasStatus(status))
    .and(AssetSpecifications.hasLocation(location));
Page<Asset> results = assetRepository.findAll(spec, pageable);
```

**Benefits**:
- Null-safe: each spec returns null if filter not provided
- Composable: easily combine multiple filters with .and()
- Type-safe: compile-time verification
- Eliminates query method explosion (no need for `findByCategoryAndStatusAndLocation`, etc.)

**Location**: `com.assetflow.specification.AssetSpecifications`

### 7. **Controllers**

#### AssetController
REST API endpoints for asset management.

**Base Path**: `/assets`

**Endpoints**:

##### POST /
Register a new asset.

```
POST /assets
Authorization: Bearer {token}
Content-Type: application/json

{
  "categoryId": "uuid",
  "location": "Warehouse A",
  "isBookable": true,
  ...
}

Response (HTTP 201):
{
  "id": "uuid",
  "assetTag": "AF-0001",
  ...
}
```

**Authorization**: ASSET_MANAGER or ADMIN

**Validation**: Request body validation via @Valid

**Responses**:
- 201 Created: Asset successfully created
- 400 Bad Request: Validation error or invalid category/department
- 401 Unauthorized: Missing/invalid token
- 404 Not Found: Category or department not found
- 409 Conflict: Serial number already exists

##### GET /
Search assets with optional filters.

```
GET /assets?categoryId=uuid&status=AVAILABLE&location=Warehouse&departmentId=uuid&page=0&size=20
Authorization: Bearer {token}

Response (HTTP 200):
{
  "content": [
    { "id": "uuid", "assetTag": "AF-0001", ... },
    ...
  ],
  "totalElements": 42,
  "totalPages": 3,
  "currentPage": 0,
  "size": 20
}
```

**Authorization**: Any authenticated user

**Query Parameters** (all optional):
- `categoryId` - UUID
- `status` - AssetStatus enum value
- `location` - String (partial match, case-insensitive)
- `departmentId` - UUID
- `page` - Integer (default 0)
- `size` - Integer (default 20)

**Responses**:
- 200 OK: Returns paginated results
- 400 Bad Request: Invalid query parameters
- 401 Unauthorized: Missing/invalid token

##### GET /{id}
Retrieve asset by ID.

```
GET /assets/{id}
Authorization: Bearer {token}

Response (HTTP 200):
{
  "id": "uuid",
  "assetTag": "AF-0042",
  ...
}
```

**Authorization**: Any authenticated user

**Path Parameters**:
- `id` - Asset UUID

**Responses**:
- 200 OK: Asset found
- 401 Unauthorized: Missing/invalid token
- 404 Not Found: Asset not found

##### PATCH /{id}/status
Update asset status.

```
PATCH /assets/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "ALLOCATED"
}

Response (HTTP 200):
{
  "id": "uuid",
  "assetTag": "AF-0042",
  "status": "ALLOCATED",
  ...
}
```

**Authorization**: ASSET_MANAGER or ADMIN

**Path Parameters**:
- `id` - Asset UUID

**Request Body**:
- `status` - Target AssetStatus (must be valid transition)

**Validation**: Status must be valid enum value and valid transition

**Responses**:
- 200 OK: Status updated
- 400 Bad Request: Invalid transition or validation error
- 401 Unauthorized: Missing/invalid token
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Asset not found

**Location**: `com.assetflow.controller.AssetController`

### 8. **Exceptions**

#### AssetNotFoundException
Thrown when asset not found by ID.

- HTTP Status: 404 Not Found
- Message: "Asset with ID {id} not found"

**Location**: `com.assetflow.exception.AssetNotFoundException`

#### InvalidStatusTransitionException
Thrown when attempted status transition is not allowed.

- HTTP Status: 400 Bad Request
- Message: "Cannot transition asset from {current} to {requested}"

**Location**: `com.assetflow.exception.InvalidStatusTransitionException`

Both exceptions are handled in `GlobalExceptionHandler` and return standardized `ErrorResponse` DTOs.

### 9. **Database Schema**

**Sequence**:
```sql
CREATE SEQUENCE asset_tag_seq START WITH 1 INCREMENT BY 1 NO CACHE;
```

**Table: assets**
```sql
CREATE TABLE assets (
    id UUID PRIMARY KEY,
    asset_tag VARCHAR(20) NOT NULL UNIQUE,
    category_id UUID NOT NULL REFERENCES asset_categories(id),
    serial_number VARCHAR(255) UNIQUE,
    acquisition_date DATE,
    acquisition_cost NUMERIC(19, 2),
    condition VARCHAR(255),
    location VARCHAR(500) NOT NULL,
    department_id UUID REFERENCES departments(id),
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    is_bookable BOOLEAN NOT NULL DEFAULT FALSE,
    photo_url VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_asset_category` on (category_id)
- `idx_asset_department` on (department_id)
- `idx_asset_status` on (status)
- `idx_asset_location` on (location)
- `idx_asset_tag` on (asset_tag)

**Migration**: Flyway migration file `V002__create_asset_sequence_and_tables.sql`

## API Examples

### Example 1: Register Asset
```bash
curl -X POST http://localhost:8080/assets \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "550e8400-e29b-41d4-a716-446655440000",
    "serialNumber": "LAPTOP-SN-2024-001",
    "acquisitionDate": "2024-01-15",
    "acquisitionCost": 1500.00,
    "condition": "New",
    "location": "IT Warehouse",
    "departmentId": "660e8400-e29b-41d4-a716-446655440001",
    "isBookable": true,
    "photoUrl": "https://example.com/photo.jpg"
  }'
```

Response:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "assetTag": "AF-0001",
  "categoryName": "Laptop",
  "categoryId": "550e8400-e29b-41d4-a716-446655440000",
  "serialNumber": "LAPTOP-SN-2024-001",
  "acquisitionDate": "2024-01-15",
  "acquisitionCost": 1500.00,
  "condition": "New",
  "location": "IT Warehouse",
  "departmentName": "IT",
  "departmentId": "660e8400-e29b-41d4-a716-446655440001",
  "status": "AVAILABLE",
  "isBookable": true,
  "photoUrl": "https://example.com/photo.jpg",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Example 2: Search Assets
```bash
curl "http://localhost:8080/assets?status=AVAILABLE&location=Warehouse&page=0&size=10" \
  -H "Authorization: Bearer {token}"
```

### Example 3: Update Status
```bash
curl -X PATCH http://localhost:8080/assets/770e8400-e29b-41d4-a716-446655440002/status \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ALLOCATED"
  }'
```

## Testing Concurrency

To verify concurrent asset registration is safe:

```bash
#!/bin/bash
# Simulate 10 concurrent registrations
for i in {1..10}; do
  curl -X POST http://localhost:8080/assets \
    -H "Authorization: Bearer {token}" \
    -H "Content-Type: application/json" \
    -d '{"categoryId":"...","location":"Test","isBookable":false}' &
done
wait
# All should get unique asset tags (AF-0001 through AF-0010)
```

The database sequence ensures no duplicates even under concurrent load.

## Configuration

No additional configuration needed beyond existing Spring Boot setup. The module uses:
- Existing JPA/Hibernate configuration
- Existing PostgreSQL database connection
- Existing Spring Security (JWT-based)
- Existing exception handling infrastructure

**Required**: Database must have Flyway migrations enabled for automatic schema creation.

## Integration with Existing Modules

### Dependency on AssetCategory
- Asset.category is ManyToOne to AssetCategory
- Throws CategoryNotFoundException if category_id invalid
- Uses existing `AssetCategoryRepository` and `AssetCategoryService`

### Dependency on Department
- Asset.department is nullable ManyToOne to Department
- Throws DepartmentNotFoundException if department_id invalid
- Uses existing `DepartmentRepository` and `DepartmentService`

### Security Integration
- Uses existing JWT authentication via JwtAuthFilter
- Requires ASSET_MANAGER or ADMIN roles for write operations
- Any authenticated user can read assets
- Integrates with existing User/Role/Status entities

### Exception Handling
- New exceptions handled by existing GlobalExceptionHandler
- Returns standardized ErrorResponse DTOs
- HTTP status codes consistent with REST conventions

## Performance Considerations

1. **Asset Tag Generation**: O(1) via database sequence (atomic operation)
2. **Asset Search**: O(n) with pagination (indexes on filtered columns)
3. **Status Updates**: O(1) validation + O(1) update (validation is in-memory map)
4. **Concurrency**: Safe for unlimited concurrent registrations (database locking on sequence)

### Index Strategy
Indexes created on:
- `category_id` - For filtering by category
- `department_id` - For filtering by department  
- `status` - For filtering by lifecycle state
- `location` - For LIKE queries on location
- `asset_tag` - For unique lookups

Composite indexes not created (would increase write overhead) - rely on individual column indexes for most queries.

## Future Enhancements

Possible future additions:
1. **Audit Trail**: Track status transitions and who changed them
2. **Asset History**: Previous owners/departments
3. **Maintenance Log**: Record of maintenance activities
4. **Asset Depreciation**: Track value over time
5. **Bulk Operations**: Register/update multiple assets at once
6. **Asset Transfer**: Transfer between departments with approval workflow
7. **Export**: Generate reports (CSV, PDF) of assets
8. **Search**: Full-text search on asset properties
