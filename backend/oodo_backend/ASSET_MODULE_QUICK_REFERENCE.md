# Asset Module - Quick Reference

## Files Added

### Entities
- `src/main/java/com/assetflow/entity/Asset.java` - Main asset entity

### Enums
- `src/main/java/com/assetflow/enums/AssetStatus.java` - Lifecycle states

### DTOs
- `src/main/java/com/assetflow/dto/AssetRegistrationRequest.java`
- `src/main/java/com/assetflow/dto/AssetResponse.java`
- `src/main/java/com/assetflow/dto/AssetStatusUpdateRequest.java`

### Services
- `src/main/java/com/assetflow/service/AssetService.java` - Business logic
- `src/main/java/com/assetflow/service/AssetTagGenerator.java` - Tag generation

### Repositories
- `src/main/java/com/assetflow/repository/AssetRepository.java`

### Specifications
- `src/main/java/com/assetflow/specification/AssetSpecifications.java`

### Controllers
- `src/main/java/com/assetflow/controller/AssetController.java`

### Exceptions
- `src/main/java/com/assetflow/exception/AssetNotFoundException.java`
- `src/main/java/com/assetflow/exception/InvalidStatusTransitionException.java`

### Database
- `src/main/resources/db/migration/V002__create_asset_sequence_and_tables.sql`

### Documentation
- `ASSET_MODULE_DOCUMENTATION.md` - Comprehensive guide
- `ASSET_MODULE_QUICK_REFERENCE.md` - This file

## Modified Files

### GlobalExceptionHandler
Added handlers for:
- `AssetNotFoundException` (404)
- `InvalidStatusTransitionException` (400)

## Core Features at a Glance

### Asset Registration
```
POST /assets
→ Generates unique tag (AF-0001)
→ Validates category & department
→ Returns AssetResponse
```

### Asset Search
```
GET /assets?status=AVAILABLE&location=Warehouse
→ Flexible filtering via Specifications
→ Paginated results
```

### Status Transitions
```
PATCH /assets/{id}/status
→ Validates transition rules
→ Enforces state machine
```

### Allowed Status Transitions
```
AVAILABLE       → ALLOCATED, RESERVED, UNDER_MAINTENANCE, LOST, RETIRED
ALLOCATED       → AVAILABLE, LOST
RESERVED        → AVAILABLE, ALLOCATED
UNDER_MAINTENANCE → AVAILABLE, RETIRED
LOST            → AVAILABLE, RETIRED
RETIRED         → DISPOSED
DISPOSED        → (terminal)
```

## Role-Based Access

### Write Operations (POST, PATCH)
- Requires: `ASSET_MANAGER` or `ADMIN` role

### Read Operations (GET)
- Requires: Any authenticated user

## Asset Tag Format

- **Generated via**: PostgreSQL SEQUENCE `asset_tag_seq`
- **Format**: AF-XXXX where XXXX is zero-padded
- **Examples**: AF-0001, AF-0042, AF-9999, AF-10000, AF-99999
- **Concurrency**: Safe via database-level atomic sequence

## Database Details

**Sequence**:
```sql
CREATE SEQUENCE asset_tag_seq START WITH 1;
```

**Table**: `assets`
- Primary Key: `id` (UUID)
- Unique Constraints: `asset_tag`, `serial_number`
- Foreign Keys: `category_id`, `department_id`
- Default Status: `AVAILABLE`
- Default Bookable: `false`

**Indexes**: category, department, status, location, asset_tag

## Validation Rules

### AssetRegistrationRequest
- `categoryId`: @NotNull (required)
- `location`: @NotBlank (required)
- `acquisitionCost`: @DecimalMin("0") (optional but must be positive)
- `serialNumber`: unique if provided

### AssetStatusUpdateRequest
- `status`: @NotNull (required), must be valid AssetStatus enum

## Testing the Module

### 1. Register an Asset
```bash
curl -X POST http://localhost:8080/assets \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "{existing_category_uuid}",
    "location": "Warehouse A",
    "isBookable": true
  }'
```

### 2. Search Assets
```bash
curl http://localhost:8080/assets?status=AVAILABLE \
  -H "Authorization: Bearer {token}"
```

### 3. Update Status
```bash
curl -X PATCH http://localhost:8080/assets/{asset_uuid}/status \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"status": "ALLOCATED"}'
```

### 4. Test Concurrent Registrations
```bash
for i in {1..5}; do
  curl -X POST http://localhost:8080/assets \
    -H "Authorization: Bearer {token}" \
    -H "Content-Type: application/json" \
    -d '{"categoryId":"{uuid}","location":"Test"}' &
done
wait
```
All should get unique tags (AF-0001 through AF-0005).

## Common Errors

### 400 Bad Request - Invalid Transition
```json
{
  "message": "Cannot transition asset from RETIRED to ALLOCATED"
}
```
**Solution**: Review `ALLOWED_TRANSITIONS` map in AssetService.

### 404 Not Found - Category
```json
{
  "message": "Asset category with ID ... not found"
}
```
**Solution**: Create category first, then reference its UUID.

### 404 Not Found - Department
```json
{
  "message": "Department with ID ... not found"
}
```
**Solution**: Department optional; if provided, must exist.

### 409 Conflict - Serial Number
```json
{
  "message": "...serial number already exists..."
}
```
**Solution**: Serial numbers must be unique; omit if not needed.

## Integration Points

### With AssetCategory
- `Asset.category` (ManyToOne, required)
- Resolves in `AssetService.registerAsset()`

### With Department
- `Asset.department` (ManyToOne, optional)
- Resolves in `AssetService.registerAsset()`

### With User/Security
- All endpoints require authentication
- Write endpoints require ASSET_MANAGER or ADMIN role
- Integrates with existing JwtAuthFilter

### With Exception Handling
- Custom exceptions mapped in GlobalExceptionHandler
- Returns ErrorResponse DTOs with proper HTTP status codes

## Key Patterns Used

1. **Specifications Pattern**: JpaSpecificationExecutor for flexible filtering
2. **Builder Pattern**: Asset entity uses @Builder (Lombok)
3. **Record Pattern**: All DTOs as Java records
4. **Service Pattern**: Business logic in service layer
5. **Repository Pattern**: Data access via Spring Data JPA
6. **Annotation-based Security**: @PreAuthorize for role checks
7. **Global Exception Handling**: @RestControllerAdvice pattern
8. **Database Sequence**: Atomic concurrent-safe tag generation

## Performance Characteristics

| Operation | Time Complexity | Notes |
|-----------|-----------------|-------|
| Register Asset | O(1) | Sequence lookup + insert |
| Search Assets | O(n) | Paginated, indexed queries |
| Get Asset by ID | O(1) | Primary key lookup |
| Update Status | O(1) | In-memory validation + update |
| Tag Generation | O(1) | Database sequence (atomic) |

## Concurrency Safety

✅ Asset tag generation: Database sequence ensures uniqueness
✅ Serial number uniqueness: Database unique constraint
✅ Status transitions: Validated at service layer (read-safe)
✅ Status updates: Database-level consistency
✅ Pagination: Safe for concurrent reads

## No Known Limitations

The implementation is production-ready with no identified limitations for a hackathon context.
