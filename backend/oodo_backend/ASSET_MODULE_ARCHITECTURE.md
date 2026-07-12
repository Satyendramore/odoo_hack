# Asset Module - Architecture Diagram

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REST API LAYER                                     │
│                     AssetController (/assets)                               │
└──────────────────────────┬──────────────────────┬──────────────────────────┘
                           │                      │
                    POST /  │                  PATCH /{id}/status
                   GET /    │                      │
                 GET /{id}  │                      │
                           │                      │
         ┌─────────────────▼──────────────────────▼──────────────────────┐
         │                   BUSINESS LOGIC LAYER                         │
         │            ┌─────────────────────────────────────┐            │
         │            │      AssetService                   │            │
         │            ├─────────────────────────────────────┤            │
         │            │ + registerAsset()                   │            │
         │            │ + searchAssets()                    │            │
         │            │ + getById()                         │            │
         │            │ + updateStatus()                    │            │
         │            │ - ALLOWED_TRANSITIONS (state map)   │            │
         │            │ - mapToResponse()                   │            │
         │            └─────────────────────────────────────┘            │
         │                       │                │                       │
         │            ┌──────────┴────────────────┴──────────────┐       │
         │            │      AssetTagGenerator                   │       │
         │            ├──────────────────────────────────────────┤       │
         │            │ + generateAssetTag()                     │       │
         │            │ - formatAssetTag()                       │       │
         │            └──────────────────────────────────────────┘       │
         │                       │                                        │
         │            ┌──────────▼─────────────────────────────┐        │
         │            │   AssetSpecifications                  │        │
         │            ├─────────────────────────────────────────┤        │
         │            │ + hasCategory()                        │        │
         │            │ + hasStatus()                          │        │
         │            │ + hasLocation()                        │        │
         │            │ + hasDepartment()                      │        │
         │            │ + tagOrSerialContains()                │        │
         │            └─────────────────────────────────────────┘        │
         └────────────────────┬─────────────────────┬───────────────────┘
                              │                     │
         ┌────────────────────▼─────────────────────▼───────────────────┐
         │                   DATA ACCESS LAYER                          │
         │                                                              │
         │  ┌──────────────────────────────────────────────────────┐  │
         │  │         AssetRepository                              │  │
         │  ├──────────────────────────────────────────────────────┤  │
         │  │ extends JpaRepository<Asset, UUID>                   │  │
         │  │ extends JpaSpecificationExecutor<Asset>              │  │
         │  │                                                      │  │
         │  │ + existsByAssetTag()                                │  │
         │  │ + findByAssetTag()                                  │  │
         │  │ + existsBySerialNumber()                            │  │
         │  │ + findAll(Specification<Asset>, Pageable)           │  │
         │  └──────────────────────────────────────────────────────┘  │
         │                              │                              │
         │           ┌──────────────────┴──────────────────┐          │
         │           ▼                                     ▼          │
         │  ┌──────────────────────┐    ┌──────────────────────────┐ │
         │  │ AssetCategoryRepo    │    │  DepartmentRepository    │ │
         │  │ (delegated to)       │    │  (delegated to)          │ │
         │  └──────────────────────┘    └──────────────────────────┘ │
         └─────────────────┬────────────────────┬────────────────────┘
                           │                    │
         ┌─────────────────▼────────────────────▼────────────────────┐
         │                   ENTITY LAYER                             │
         │                                                            │
         │     ┌──────────────────────────────────────────────┐    │
         │     │            Asset                            │    │
         │     ├──────────────────────────────────────────────┤    │
         │     │ - id: UUID                                   │    │
         │     │ - assetTag: String (unique)                 │    │
         │     │ - category: AssetCategory (ManyToOne)       │    │
         │     │ - serialNumber: String (unique, nullable)   │    │
         │     │ - acquisitionDate: LocalDate                │    │
         │     │ - acquisitionCost: BigDecimal               │    │
         │     │ - condition: String                         │    │
         │     │ - location: String                          │    │
         │     │ - department: Department (ManyToOne)        │    │
         │     │ - status: AssetStatus (enum)                │    │
         │     │ - isBookable: Boolean                       │    │
         │     │ - photoUrl: String                          │    │
         │     │ - createdAt: Instant                        │    │
         │     └──────────────────────────────────────────────┘    │
         │            │                       │                     │
         │      ┌─────▼──────────┐      ┌────▼──────────────┐    │
         │      │ AssetCategory   │      │ Department       │    │
         │      ├─────────────────┤      ├──────────────────┤    │
         │      │ - id: UUID      │      │ - id: UUID       │    │
         │      │ - name: String  │      │ - name: String   │    │
         │      │ - customFields  │      │ - head: User     │    │
         │      └─────────────────┘      │ - status: Status │    │
         │                               └──────────────────┘    │
         └────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────▼──────────────────────────────────────┐
         │              DATABASE LAYER (PostgreSQL)               │
         │                                                        │
         │  SEQUENCE: asset_tag_seq (atomic, starts at 1)        │
         │                                                        │
         │  TABLE: assets                                        │
         │  ├─ asset_tag (unique, indexed)                      │
         │  ├─ category_id (indexed, FK)                        │
         │  ├─ serial_number (unique, indexed)                  │
         │  ├─ status (enum, indexed)                           │
         │  ├─ location (indexed)                               │
         │  ├─ department_id (indexed, FK)                      │
         │  └─ [other fields...]                                │
         │                                                        │
         │  TABLES: asset_categories (existing)                 │
         │  TABLES: departments (existing)                      │
         └────────────────────────────────────────────────────────┘
```

## Data Flow - Asset Registration

```
1. Client Request
   ┌─────────────────────────────────────┐
   │ POST /assets                        │
   │ {                                   │
   │   "categoryId": "uuid",             │
   │   "location": "Warehouse",          │
   │   ...                               │
   │ }                                   │
   └────────────────┬────────────────────┘
                    │
2. Controller Validation
   ┌────────────────▼────────────────────┐
   │ AssetController.registerAsset()     │
   │ - @Valid annotation triggers        │
   │ - Bean Validation checks            │
   └────────────────┬────────────────────┘
                    │
3. Authorization Check
   ┌────────────────▼────────────────────┐
   │ @PreAuthorize("hasAnyRole(...)")    │
   │ - Validates ASSET_MANAGER/ADMIN     │
   │ - Throws AccessDeniedException      │
   └────────────────┬────────────────────┘
                    │
4. Service Logic
   ┌────────────────▼────────────────────────────────────┐
   │ AssetService.registerAsset()                        │
   │ - Load and validate category                        │
   │   (CategoryNotFoundException)                       │
   │ - Load and validate department if provided          │
   │   (DepartmentNotFoundException)                     │
   │ - Generate asset tag via AssetTagGenerator          │
   │ - Create Asset entity (status=AVAILABLE)            │
   └────────────────┬────────────────────────────────────┘
                    │
5. Tag Generation
   ┌────────────────▼────────────────────────────────────┐
   │ AssetTagGenerator.generateAssetTag()                │
   │ - Query PostgreSQL: SELECT nextval('asset_tag_seq') │
   │ - Receive value: e.g., 42                           │
   │ - Format: "AF-" + zero-padded(42) = "AF-0042"       │
   └────────────────┬────────────────────────────────────┘
                    │
6. Database Persistence
   ┌────────────────▼────────────────────────────────────┐
   │ AssetRepository.save(asset)                         │
   │ - JPA/Hibernate generates SQL INSERT                │
   │ - Database enforces:                                │
   │   * Unique constraint (asset_tag, serial_number)    │
   │   * Foreign key constraints                         │
   │   * NOT NULL constraints                            │
   │ - Transaction commits                               │
   └────────────────┬────────────────────────────────────┘
                    │
7. Response Mapping
   ┌────────────────▼────────────────────────────────────┐
   │ AssetService.mapToResponse()                        │
   │ - Extract category name from entity                 │
   │ - Extract department name if present                │
   │ - Create AssetResponse record                       │
   └────────────────┬────────────────────────────────────┘
                    │
8. HTTP Response
   ┌────────────────▼────────────────────┐
   │ HTTP 201 Created                    │
   │ {                                   │
   │   "id": "uuid",                     │
   │   "assetTag": "AF-0042",            │
   │   "categoryName": "...",            │
   │   "status": "AVAILABLE",            │
   │   ...                               │
   │ }                                   │
   └─────────────────────────────────────┘
```

## Data Flow - Asset Search

```
1. Client Request
   ┌──────────────────────────────────────────────┐
   │ GET /assets?status=AVAILABLE&page=0&size=20  │
   └────────────────┬─────────────────────────────┘
                    │
2. Controller Parameter Binding
   ┌────────────────▼─────────────────────────────┐
   │ AssetController.searchAssets()               │
   │ - Parse query params                         │
   │ - Convert to appropriate types               │
   │ - Create Pageable: PageRequest(0, 20)        │
   └────────────────┬─────────────────────────────┘
                    │
3. Authorization
   ┌────────────────▼─────────────────────────────┐
   │ @PreAuthorize("isAuthenticated()")           │
   │ - Any authenticated user allowed             │
   └────────────────┬─────────────────────────────┘
                    │
4. Build Specification
   ┌────────────────▼──────────────────────────────────┐
   │ AssetService.searchAssets()                       │
   │                                                   │
   │ Specification<Asset> spec =                      │
   │   Specification.where(                           │
   │     AssetSpecifications.hasCategory(null)       │
   │   )                                              │
   │   .and(AssetSpecifications.hasStatus(status))   │
   │   .and(AssetSpecifications.hasLocation(null))   │
   │   .and(AssetSpecifications.hasDepartment(null))  │
   │                                                   │
   │ Null-safe: ignored filters return null           │
   │ Result: Specification filtering on status only   │
   └────────────────┬──────────────────────────────────┘
                    │
5. Database Query
   ┌────────────────▼──────────────────────────────┐
   │ AssetRepository.findAll(spec, pageable)       │
   │                                               │
   │ Generated SQL (approx):                       │
   │ SELECT a.* FROM assets a                      │
   │ WHERE a.status = 'AVAILABLE'                  │
   │ LIMIT 20 OFFSET 0                             │
   │                                               │
   │ Index used: idx_asset_status                  │
   └────────────────┬──────────────────────────────┘
                    │
6. DTO Mapping
   ┌────────────────▼──────────────────────────────┐
   │ Page<Asset> → Page<AssetResponse>             │
   │ - Stream each asset through mapToResponse()   │
   │ - Flatten nested objects (category, dept)     │
   │ - Maintain pagination metadata                │
   └────────────────┬──────────────────────────────┘
                    │
7. HTTP Response
   ┌────────────────▼──────────────────────────────┐
   │ HTTP 200 OK                                   │
   │ {                                             │
   │   "content": [                                │
   │     {"id": "...", "assetTag": "AF-0001", ...},│
   │     {"id": "...", "assetTag": "AF-0042", ...} │
   │   ],                                          │
   │   "totalElements": 1000,                      │
   │   "totalPages": 50,                           │
   │   "currentPage": 0,                           │
   │   "size": 20                                  │
   │ }                                             │
   └──────────────────────────────────────────────┘
```

## Data Flow - Status Update with Validation

```
1. Client Request
   ┌────────────────────────────────────────┐
   │ PATCH /assets/{id}/status              │
   │ {                                       │
   │   "status": "ALLOCATED"                │
   │ }                                       │
   └────────────────┬───────────────────────┘
                    │
2. Controller & Authorization
   ┌────────────────▼───────────────────────┐
   │ AssetController.updateStatus()         │
   │ @PreAuthorize("hasAnyRole(...)")       │
   │ - Only ASSET_MANAGER/ADMIN             │
   └────────────────┬───────────────────────┘
                    │
3. Load Asset
   ┌────────────────▼────────────────────────────┐
   │ AssetService.updateStatus()                │
   │ - Load asset by ID                         │
   │ - Throw AssetNotFoundException if missing   │
   │ - Extract current status: "AVAILABLE"      │
   └────────────────┬────────────────────────────┘
                    │
4. Validate Transition
   ┌────────────────▼────────────────────────────┐
   │ isValidTransition(AVAILABLE, ALLOCATED)    │
   │                                             │
   │ ALLOWED_TRANSITIONS map:                   │
   │   AVAILABLE → {ALLOCATED, RESERVED, ...}  │
   │                                             │
   │ ✅ ALLOCATED in allowed set                │
   │ → Transition is VALID                      │
   └────────────────┬────────────────────────────┘
                    │
5. Update Entity
   ┌────────────────▼────────────────────────────┐
   │ asset.setStatus(ALLOCATED)                 │
   └────────────────┬────────────────────────────┘
                    │
6. Persist to Database
   ┌────────────────▼────────────────────────────┐
   │ AssetRepository.save(asset)                │
   │ - Dirty checking detects status changed    │
   │ - SQL UPDATE generated                     │
   │ - Transaction commits                      │
   └────────────────┬────────────────────────────┘
                    │
7. Response
   ┌────────────────▼────────────────────────────┐
   │ HTTP 200 OK                                │
   │ {                                          │
   │   "id": "uuid",                            │
   │   "status": "ALLOCATED",                   │
   │   ...                                      │
   │ }                                          │
   └────────────────────────────────────────────┘

ALTERNATIVE: Invalid Transition
   ┌────────────────────────────────────────────────────┐
   │ isValidTransition(DISPOSED, AVAILABLE)            │
   │                                                    │
   │ ALLOWED_TRANSITIONS map:                          │
   │   DISPOSED → {} (empty, terminal state)           │
   │                                                    │
   │ ❌ AVAILABLE NOT in allowed set                   │
   │ → Throw InvalidStatusTransitionException          │
   └────────────────┬─────────────────────────────────┘
                    │
   ┌────────────────▼─────────────────────────────────┐
   │ HTTP 400 Bad Request                            │
   │ {                                               │
   │   "message": "Cannot transition asset from       │
   │              DISPOSED to AVAILABLE"             │
   │ }                                               │
   └───────────────────────────────────────────────────┘
```

## Concurrency - Tag Generation Safety

```
Multiple Concurrent Requests
    │
    ├─ Thread-1 ─┐
    ├─ Thread-2 ─┤
    ├─ Thread-3 ─┼─→ AssetTagGenerator.generateAssetTag()
    ├─ Thread-4 ─┤
    ├─ Thread-5 ─┘
    │
    └─→ SELECT nextval('asset_tag_seq')
        
        PostgreSQL SEQUENCE (Atomic Operations)
        ┌─────────────────────────────────────┐
        │ nextval() is atomic at DB level      │
        │ Each call gets unique value         │
        │ No race conditions possible         │
        │ Serialization at database           │
        └─────────────────────────────────────┘
        
        ┌────────┬────────┬────────┬────────┬────────┐
        │  Seq   │  Seq   │  Seq   │  Seq   │  Seq   │
        │   1    │   2    │   3    │   4    │   5    │
        └────────┴────────┴────────┴────────┴────────┘
        
        Thread-1 → "AF-0001"
        Thread-2 → "AF-0002"
        Thread-3 → "AF-0003"
        Thread-4 → "AF-0004"
        Thread-5 → "AF-0005"
        
        ✅ All unique, no duplicates
        ✅ No application-level locking needed
        ✅ Scales to unlimited concurrent requests
```

## Exception Hierarchy

```
RuntimeException
├─ AssetNotFoundException
│  └─ HTTP 404 Not Found
│     Message: "Asset with ID {id} not found"
│
├─ InvalidStatusTransitionException
│  └─ HTTP 400 Bad Request
│     Message: "Cannot transition asset from {current} to {requested}"
│
├─ CategoryNotFoundException (existing)
│  └─ HTTP 404 Not Found
│
└─ DepartmentNotFoundException (existing)
   └─ HTTP 404 Not Found

All exceptions caught by GlobalExceptionHandler
and converted to ErrorResponse DTOs
```

## Authorization Matrix

```
Endpoint                    Public  Auth  EMPLOYEE  DEPT_HEAD  ASSET_MGR  ADMIN
────────────────────────────────────────────────────────────────────────────────
POST /assets                  ❌     ❌      ❌         ❌         ✅        ✅
GET /assets                   ❌     ✅      ✅         ✅         ✅        ✅
GET /assets/{id}              ❌     ✅      ✅         ✅         ✅        ✅
PATCH /assets/{id}/status     ❌     ❌      ❌         ❌         ✅        ✅
```

## Transaction Management

```
┌─────────────────────────────────────────────────────────────────┐
│ registerAsset()                                                 │
│ ├─ @Transactional (read-write)                                 │
│ ├─ Load category (read, within transaction)                    │
│ ├─ Load department (read, within transaction)                  │
│ ├─ Generate tag (read from sequence, within transaction)       │
│ ├─ Create entity                                               │
│ └─ Save to database (write, within transaction)                │
│    └─ Transaction commits → All-or-nothing atomicity           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ searchAssets()                                                  │
│ ├─ @Transactional(readOnly=true)                              │
│ ├─ Build specification (in-memory, no DB access)               │
│ ├─ Query database (read-only optimized)                        │
│ └─ Transaction commits → Read consistency maintained           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ updateStatus()                                                  │
│ ├─ @Transactional (read-write)                                 │
│ ├─ Load asset (read)                                           │
│ ├─ Validate transition (in-memory, no DB access)               │
│ ├─ Update status                                               │
│ └─ Save to database (write)                                    │
│    └─ Transaction commits → Atomic update                      │
└─────────────────────────────────────────────────────────────────┘
```

## Summary

This architecture ensures:
- ✅ **Separation of Concerns**: Clear layering from API to database
- ✅ **Concurrency Safety**: Database sequence ensures unique tags under load
- ✅ **Flexibility**: Specification pattern supports any filter combination
- ✅ **Consistency**: Transaction management ensures atomicity
- ✅ **Security**: Role-based access control at controller level
- ✅ **Performance**: Proper indexing and query optimization
- ✅ **Maintainability**: Clear patterns and consistent conventions
