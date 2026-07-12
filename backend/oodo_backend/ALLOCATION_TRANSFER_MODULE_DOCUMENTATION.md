# Asset Allocation & Transfer Module - Comprehensive Documentation

## Overview

The **Asset Allocation & Transfer** module is the core conflict-handling feature of AssetFlow. It manages the complete lifecycle of asset allocation to employees and provides a robust transfer mechanism for handling conflicts when multiple users need the same asset.

**Key Characteristics**:
- **Conflict Detection**: Prevents multiple allocations of the same asset simultaneously
- **Concurrency Safe**: Uses database-level pessimistic locking to prevent race conditions
- **Atomic Transfers**: Transfer approvals are transactional, maintaining data consistency
- **State Machine**: Enforces valid allocation lifecycle states
- **Extensible**: Built on existing Asset, User, and Department modules

## Components

### 1. Enums

#### AllocationStatus
Lifecycle states for an allocation:
- `ACTIVE` - Asset is currently allocated to a holder
- `RETURNED` - Asset has been returned and is no longer allocated

#### TransferRequestStatus
Lifecycle states for a transfer request:
- `REQUESTED` - Transfer request created, awaiting approval
- `APPROVED` - Transfer request approved and allocation transferred
- `REJECTED` - Transfer request declined

**File Locations**:
- `com.assetflow.enums.AllocationStatus`
- `com.assetflow.enums.TransferRequestStatus`

### 2. Entities

#### Allocation Entity
Represents the allocation of an asset to a user.

**Fields**:
- `id` (UUID) - Primary key, auto-generated
- `asset` (ManyToOne Asset, required) - The allocated asset
- `holder` (ManyToOne User, required) - The employee holding the asset
- `department` (ManyToOne Department, nullable) - Optional department association
- `allocatedDate` (LocalDate) - Date of allocation, auto-set to today on creation
- `expectedReturnDate` (LocalDate, nullable) - Expected return date
- `returnedDate` (LocalDate, nullable) - Actual return date, set when asset is returned
- `conditionAtReturn` (String, nullable) - Condition notes filled on return
- `status` (AllocationStatus) - Current allocation status (default ACTIVE)
- `allocatedBy` (ManyToOne User, required) - User who performed the allocation (Asset Manager)
- `createdAt` (Instant) - Auto-set on creation

**Database Table**: `allocations`
- Indexes: (asset_id, status), (holder_id, status), asset_id, expected_return_date
- Foreign keys: asset_id, holder_id, department_id, allocated_by_id

**Location**: `com.assetflow.entity.Allocation`

#### TransferRequest Entity
Represents a request to transfer an asset from one holder to another.

**Fields**:
- `id` (UUID) - Primary key, auto-generated
- `allocation` (ManyToOne Allocation, required) - The active allocation being contested
- `requestedBy` (ManyToOne User, required) - User requesting the transfer
- `requestedTo` (ManyToOne User, required) - Target user to receive the asset
- `approvedBy` (ManyToOne User, nullable) - User who approved/rejected (set on resolution)
- `status` (TransferRequestStatus) - Current request status (default REQUESTED)
- `createdAt` (Instant) - Auto-set on creation
- `resolvedAt` (Instant, nullable) - Set when request is approved or rejected

**Database Table**: `transfer_requests`
- Indexes: status, allocation_id
- Foreign keys: allocation_id, requested_by_id, requested_to_id, approved_by_id

**Location**: `com.assetflow.entity.TransferRequest`

### 3. DTOs (Java Records, Validated)

#### AllocationRequest
Request body for asset allocation.

```json
{
  "assetId": "uuid",           // required (@NotNull)
  "holderId": "uuid",          // required (@NotNull)
  "expectedReturnDate": "2024-12-31"  // optional
}
```

#### AllocationResponse
Response body for allocation queries.

```json
{
  "id": "uuid",
  "assetId": "uuid",
  "assetTag": "AF-0001",
  "holderId": "uuid",
  "holderName": "John Doe",
  "allocatedDate": "2024-01-15",
  "expectedReturnDate": "2024-12-31",
  "returnedDate": null,
  "status": "ACTIVE",
  "allocatedByName": "Alice Manager"
}
```

#### ReturnRequest
Request body for asset return with optional condition notes.

```json
{
  "conditionAtReturn": "Minor scratch on screen"  // optional
}
```

#### TransferRequestCreateRequest
Request body for creating a transfer request.

```json
{
  "requestedToId": "uuid"  // required (@NotNull) - target holder
}
```

#### TransferRequestResponse
Response body for transfer request queries.

```json
{
  "id": "uuid",
  "allocationId": "uuid",
  "assetTag": "AF-0001",
  "requestedByName": "John Doe",
  "requestedToName": "Jane Smith",
  "status": "REQUESTED",
  "createdAt": "2024-01-15T10:30:00Z",
  "resolvedAt": null
}
```

**File Locations**:
- `com.assetflow.dto.AllocationRequest`
- `com.assetflow.dto.AllocationResponse`
- `com.assetflow.dto.ReturnRequest`
- `com.assetflow.dto.TransferRequestCreateRequest`
- `com.assetflow.dto.TransferRequestResponse`
- `com.assetflow.dto.ErrorResponseWithMetadata` (for AssetAlreadyAllocatedException)

### 4. Repositories

#### AllocationRepository
Spring Data JPA repository for Allocation entities.

**Methods**:
- `findByAssetIdAndStatus(UUID assetId, AllocationStatus status) → Optional<Allocation>`
  - Returns the active allocation for an asset with pessimistic write lock
  - **Concurrency Safety**: Uses `@Lock(LockModeType.PESSIMISTIC_WRITE)` to prevent concurrent allocation attempts
  - Queries using: `SELECT ... FOR UPDATE` at database level

- `findByHolderIdAndStatus(UUID holderId, AllocationStatus status) → List<Allocation>`
  - Find all allocations for a holder with given status

- `findByAssetId(UUID assetId) → List<Allocation>`
  - Find all allocations (active and returned) for an asset, ordered by date descending (for history)

- `findByStatus(AllocationStatus status) → List<Allocation>`
  - Find all allocations with given status

**Location**: `com.assetflow.repository.AllocationRepository`

#### TransferRequestRepository
Spring Data JPA repository for TransferRequest entities.

**Methods**:
- `findByStatus(TransferRequestStatus status) → List<TransferRequest>`
  - Find all transfer requests with given status

- `findByAllocationId(UUID allocationId) → List<TransferRequest>`
  - Find all transfer requests for an allocation

**Location**: `com.assetflow.repository.TransferRequestRepository`

### 5. Services

#### AllocationService
Core business logic for asset allocation.

**Methods**:

##### allocate(AllocationRequest, User currentUser)
Allocates an asset to a holder.

**Workflow**:
1. Load asset from database (throw `AssetNotFoundException` if missing)
2. Check for existing active allocation using `findByAssetIdAndStatus()` with pessimistic lock
   - **Concurrency Safety**: This lock is held for the transaction duration, preventing concurrent allocations
   - If active allocation exists, throw `AssetAlreadyAllocatedException` with holder name and suggested action
3. Verify asset status is AVAILABLE or RESERVED (not already allocated, lost, etc.)
   - Throw `InvalidAllocationStateException` if invalid status
4. Load holder user (throw `UserNotFoundException` if missing)
5. Create Allocation record with default status = ACTIVE
6. Save allocation
7. Update asset status to ALLOCATED via existing `AssetService.updateStatus()` method
8. Return `AllocationResponse`

**Concurrency Characteristics**:
- Uses `@Transactional(isolation = Isolation.SERIALIZABLE)`
- Pessimistic lock on active allocation lookup prevents race conditions
- Atomic transaction ensures asset status update happens or entire operation rolls back

**Authorization**: ASSET_MANAGER, DEPARTMENT_HEAD, ADMIN

**Transactions**: @Transactional(isolation = Isolation.SERIALIZABLE)

##### returnAsset(UUID allocationId, ReturnRequest, User currentUser)
Return an asset from allocation.

**Workflow**:
1. Load allocation (throw `AllocationNotFoundException` if missing)
2. Verify allocation status is ACTIVE (throw `InvalidAllocationStateException` if already returned)
3. Set returnedDate = today, conditionAtReturn, status = RETURNED
4. Save updated allocation
5. Update asset status to AVAILABLE via `AssetService.updateStatus()`
6. Return `AllocationResponse`

**Authorization**: ASSET_MANAGER, DEPARTMENT_HEAD, ADMIN

**Transactions**: @Transactional

##### getAllocationHistory(UUID assetId)
Get complete allocation history for an asset.

**Returns**:
- List of all allocations (active and returned) for the asset, ordered by most recent first
- Each as `AllocationResponse`

**Authorization**: Any authenticated user

**Transactions**: @Transactional(readOnly=true)

##### getOverdueAllocations()
Get all active allocations past their expected return date.

**Returns**:
- List of overdue allocations as `AllocationResponse`
- Used for dashboard/reporting to identify overdue assets

**Authorization**: ASSET_MANAGER, ADMIN

**Transactions**: @Transactional(readOnly=true)

**Location**: `com.assetflow.service.AllocationService`

#### TransferRequestService
Business logic for transfer requests and conflict resolution.

**Methods**:

##### requestTransfer(UUID allocationId, TransferRequestCreateRequest, User currentUser)
Create a transfer request for an active allocation.

**Workflow**:
1. Load allocation (throw `AllocationNotFoundException` if missing)
2. Verify allocation status is ACTIVE (throw `InvalidAllocationStateException` if not)
3. Load requestedTo user (throw `UserNotFoundException` if missing)
4. Create TransferRequest with status = REQUESTED
5. Save transfer request
6. Return `TransferRequestResponse`

**Authorization**: Any authenticated user (typically the current holder or their manager)

**Transactions**: @Transactional

##### approve(UUID transferRequestId, User approver)
Approve a transfer request.

**Workflow** (All executed atomically within single transaction):
1. Load transfer request (throw `TransferRequestNotFoundException` if missing)
2. Verify status is REQUESTED (throw `InvalidAllocationStateException` if not)
3. Mark transfer request as APPROVED, set approvedBy, set resolvedAt
4. Mark old allocation as RETURNED with returnedDate = today (no condition check-in)
5. Create NEW allocation record:
   - asset: same asset
   - holder: requestedTo user (new holder)
   - department: same as old allocation (if any)
   - expectedReturnDate: same as old allocation
   - status: ACTIVE
   - allocatedBy: the approver
6. Asset status remains ALLOCATED throughout (no flickering to AVAILABLE)
7. Return updated `TransferRequestResponse`

**Critical Concurrency Feature**:
- **Atomic Transfer**: All steps 3-6 happen within a single transaction
- If any step fails, entire operation rolls back
- Asset status stays ALLOCATED during transfer (no window where asset is unallocated)
- Prevents race conditions where two managers might try to approve same transfer or allocate same asset

**Authorization**: ASSET_MANAGER, DEPARTMENT_HEAD, ADMIN

**Transactions**: @Transactional

##### reject(UUID transferRequestId, User approver)
Reject a transfer request.

**Workflow**:
1. Load transfer request (throw `TransferRequestNotFoundException` if missing)
2. Verify status is REQUESTED (throw `InvalidAllocationStateException` if not)
3. Mark as REJECTED, set approvedBy, set resolvedAt
4. Save transfer request
5. Return updated `TransferRequestResponse`

**Note**: No changes to allocation; asset stays with current holder

**Authorization**: ASSET_MANAGER, DEPARTMENT_HEAD, ADMIN

**Transactions**: @Transactional

##### listByStatus(TransferRequestStatus status)
List transfer requests, optionally filtered by status.

**Parameters**:
- status (optional) - Filter to this status (REQUESTED, APPROVED, REJECTED)

**Returns**:
- List of transfer requests as `TransferRequestResponse`
- Used for approval queue view in admin dashboard

**Authorization**: ASSET_MANAGER, ADMIN

**Transactions**: @Transactional(readOnly=true)

**Location**: `com.assetflow.service.TransferRequestService`

### 6. Controllers

#### AllocationController
REST API for allocation management.

**Base Path**: `/allocations`

**Endpoints**:

##### POST /
Allocate an asset to a holder.

```
POST /allocations
Authorization: Bearer {token}
Content-Type: application/json

{
  "assetId": "uuid",
  "holderId": "uuid",
  "expectedReturnDate": "2024-12-31"
}

Response (HTTP 201):
{
  "id": "uuid",
  "assetTag": "AF-0001",
  "holderName": "John Doe",
  "status": "ACTIVE",
  ...
}

Error (HTTP 409 Conflict):
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 409,
  "message": "Asset AF-0001 is currently held by Priya Sharma",
  "currentHolder": "Priya Sharma",
  "suggestedAction": "TRANSFER_REQUEST"
}
```

**Authorization**: ASSET_MANAGER, DEPARTMENT_HEAD, ADMIN

##### POST /{id}/return
Return an asset from allocation.

```
POST /allocations/{id}/return
Authorization: Bearer {token}
Content-Type: application/json

{
  "conditionAtReturn": "Minor scratch"
}

Response (HTTP 200):
{
  "id": "uuid",
  "status": "RETURNED",
  "returnedDate": "2024-01-20",
  ...
}
```

**Authorization**: ASSET_MANAGER, DEPARTMENT_HEAD, ADMIN

##### POST /{id}/transfer-request
Create a transfer request (delegates to TransferRequestController).

**Authorization**: Authenticated user

##### GET /asset/{assetId}/history
Get allocation history for an asset.

```
GET /allocations/asset/{assetId}/history
Authorization: Bearer {token}

Response (HTTP 200):
[
  {
    "id": "uuid",
    "holderName": "Current Holder",
    "status": "ACTIVE",
    "allocatedDate": "2024-01-15"
  },
  {
    "id": "uuid",
    "holderName": "Previous Holder",
    "status": "RETURNED",
    "allocatedDate": "2023-12-01",
    "returnedDate": "2024-01-14"
  }
]
```

**Authorization**: Any authenticated user

##### GET /{id}
Get a specific allocation.

**Authorization**: Any authenticated user

##### GET /overdue
Get all overdue allocations.

**Authorization**: ASSET_MANAGER, ADMIN

**Location**: `com.assetflow.controller.AllocationController`

#### TransferRequestController
REST API for transfer request management.

**Base Path**: `/transfer-requests`

**Endpoints**:

##### POST /
Create a transfer request.

```
POST /transfer-requests?allocationId={id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "requestedToId": "uuid"
}

Response (HTTP 201):
{
  "id": "uuid",
  "allocationId": "uuid",
  "assetTag": "AF-0001",
  "requestedByName": "John Doe",
  "requestedToName": "Jane Smith",
  "status": "REQUESTED",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Authorization**: Any authenticated user

##### PATCH /{id}/approve
Approve a transfer request.

```
PATCH /transfer-requests/{id}/approve
Authorization: Bearer {token}

Response (HTTP 200):
{
  "id": "uuid",
  "status": "APPROVED",
  "resolvedAt": "2024-01-15T11:00:00Z"
}
```

**Behavior**:
- Atomically marks old allocation as RETURNED
- Creates new allocation for requestedTo user
- Asset status remains ALLOCATED (no flicker)

**Authorization**: ASSET_MANAGER, DEPARTMENT_HEAD, ADMIN

##### PATCH /{id}/reject
Reject a transfer request.

```
PATCH /transfer-requests/{id}/reject
Authorization: Bearer {token}

Response (HTTP 200):
{
  "id": "uuid",
  "status": "REJECTED",
  "resolvedAt": "2024-01-15T11:00:00Z"
}
```

**Authorization**: ASSET_MANAGER, DEPARTMENT_HEAD, ADMIN

##### GET /
List transfer requests.

```
GET /transfer-requests?status=REQUESTED
Authorization: Bearer {token}

Response (HTTP 200):
[
  {
    "id": "uuid",
    "status": "REQUESTED",
    "requestedByName": "John Doe",
    "requestedToName": "Jane Smith"
  }
]
```

**Query Parameters**:
- status (optional) - Filter by REQUESTED, APPROVED, or REJECTED

**Authorization**: ASSET_MANAGER, ADMIN

##### GET /{id}
Get a specific transfer request.

**Authorization**: ASSET_MANAGER, ADMIN

**Location**: `com.assetflow.controller.TransferRequestController`

### 7. Exceptions

#### AssetAlreadyAllocatedException
Thrown when an asset is already allocated (conflict detected).

- **HTTP Status**: 409 Conflict
- **Message**: "Asset AF-0114 is currently held by Priya Sharma"
- **Extra Fields**: `currentHolder`, `suggestedAction` (for frontend guidance)

**Location**: `com.assetflow.exception.AssetAlreadyAllocatedException`

#### AllocationNotFoundException
Thrown when an allocation is not found.

- **HTTP Status**: 404 Not Found
- **Message**: "Allocation with ID {id} not found"

**Location**: `com.assetflow.exception.AllocationNotFoundException`

#### TransferRequestNotFoundException
Thrown when a transfer request is not found.

- **HTTP Status**: 404 Not Found
- **Message**: "Transfer request with ID {id} not found"

**Location**: `com.assetflow.exception.TransferRequestNotFoundException`

#### InvalidAllocationStateException
Thrown when allocation is in an invalid state for the requested operation.

- **HTTP Status**: 400 Bad Request
- **Message Examples**:
  - "Cannot request transfer for allocation with status RETURNED. Only ACTIVE allocations can be transferred."
  - "Allocation is already RETURNED, cannot return an asset twice"

**Location**: `com.assetflow.exception.InvalidAllocationStateException`

All exceptions are handled in `GlobalExceptionHandler` with appropriate HTTP status codes and response formats.

## Concurrency & Race Condition Prevention

### The Core Conflict

The primary conflict scenario:
1. User A requests allocation of Asset X
2. **Simultaneously** (microseconds later), User B requests allocation of same Asset X
3. Both should not succeed; one must be rejected

### Solution: Pessimistic Locking

The module uses **database-level pessimistic locking** to prevent race conditions:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<Allocation> findByAssetIdAndStatus(UUID assetId, AllocationStatus status);
```

**How It Works**:
1. When checking for active allocation, database acquires exclusive lock on the row
2. Lock is held until transaction commits or rolls back
3. If concurrent request tries to lock same row, it blocks until first transaction completes
4. Result: Only one allocation attempt can proceed; second is serialized after first

**Database Level**:
```sql
SELECT * FROM allocations WHERE asset_id = ? AND status = 'ACTIVE' FOR UPDATE;
```

The `FOR UPDATE` clause at database level ensures mutual exclusion.

### Transfer Approval Atomicity

Transfer approvals are atomic within a single transaction:
```java
@Transactional
public TransferRequestResponse approve(UUID transferRequestId, User approver) {
    // All steps below happen atomically - either all succeed or all rollback
    // 1. Mark transfer as APPROVED
    // 2. Mark old allocation as RETURNED
    // 3. Create new allocation for requestedTo user
    // No intermediate state where asset is unallocated
}
```

If any step fails (e.g., asset status update fails), entire operation rolls back.

### Index Strategy

**Allocation Indexes**:
```sql
CREATE INDEX idx_allocation_asset_status ON allocations(asset_id, status);
CREATE INDEX idx_allocation_holder_status ON allocations(holder_id, status);
```

Composite index on (asset_id, status) optimizes the critical `findByAssetIdAndStatus()` query that's used in the concurrency-critical path.

## Integration with Existing Modules

### Asset Module Integration
- Allocations reference Assets via foreign key
- Cannot allocate asset not in AVAILABLE or RESERVED status
- Allocation transition asset status to ALLOCATED
- Return transition asset status back to AVAILABLE
- Reuses existing `AssetService.updateStatus()` state machine

### User & Department Module Integration
- Allocations reference User (holder) and User (allocatedBy)
- TransferRequests reference User (requestedBy, requestedTo, approvedBy)
- Can optionally associate allocation with Department
- Integrates with existing Role-based authorization

### Security Integration
- Reuses existing JWT authentication
- Role-based access control:
  - Write operations: ASSET_MANAGER, DEPARTMENT_HEAD, ADMIN
  - Read operations: Authenticated users
- Uses existing @PreAuthorize annotations

## Database Schema

**Allocations Table**:
```sql
CREATE TABLE allocations (
    id UUID PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES assets(id),
    holder_id UUID NOT NULL REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    allocated_date DATE NOT NULL,
    expected_return_date DATE,
    returned_date DATE,
    condition_at_return VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    allocated_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL
);
```

**Transfer Requests Table**:
```sql
CREATE TABLE transfer_requests (
    id UUID PRIMARY KEY,
    allocation_id UUID NOT NULL REFERENCES allocations(id),
    requested_by_id UUID NOT NULL REFERENCES users(id),
    requested_to_id UUID NOT NULL REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
    created_at TIMESTAMP NOT NULL,
    resolved_at TIMESTAMP
);
```

**Indexes**:
- `idx_allocation_asset_status` (asset_id, status) - Critical for conflict detection
- `idx_allocation_holder_status` (holder_id, status) - For holder queries
- `idx_allocation_asset` (asset_id) - For history queries
- `idx_allocation_expected_return` (expected_return_date) - For overdue queries
- `idx_transfer_request_status` (status) - For approval queue
- `idx_transfer_request_allocation` (allocation_id) - For allocation transfers

**Migration**: `V003__create_allocation_and_transfer_tables.sql`

## API Examples

### Example 1: Successful Allocation
```bash
curl -X POST http://localhost:8080/allocations \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "550e8400-e29b-41d4-a716-446655440000",
    "holderId": "660e8400-e29b-41d4-a716-446655440001",
    "expectedReturnDate": "2024-12-31"
  }'
```

Response (201):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "assetId": "550e8400-e29b-41d4-a716-446655440000",
  "assetTag": "AF-0001",
  "holderId": "660e8400-e29b-41d4-a716-446655440001",
  "holderName": "John Doe",
  "allocatedDate": "2024-01-15",
  "expectedReturnDate": "2024-12-31",
  "returnedDate": null,
  "status": "ACTIVE",
  "allocatedByName": "Alice Manager"
}
```

### Example 2: Conflict - Asset Already Allocated
```bash
curl -X POST http://localhost:8080/allocations \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "550e8400-e29b-41d4-a716-446655440000",
    "holderId": "880e8400-e29b-41d4-a716-446655440003"
  }'
```

Response (409 Conflict):
```json
{
  "timestamp": "2024-01-15T10:35:00",
  "status": 409,
  "message": "Asset AF-0001 is currently held by John Doe",
  "currentHolder": "John Doe",
  "suggestedAction": "TRANSFER_REQUEST"
}
```

Frontend can now display: "Asset is held by John Doe. [Request Transfer] button"

### Example 3: Create Transfer Request
```bash
curl -X POST "http://localhost:8080/transfer-requests?allocationId=770e8400-e29b-41d4-a716-446655440002" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestedToId": "880e8400-e29b-41d4-a716-446655440003"
  }'
```

Response (201):
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "allocationId": "770e8400-e29b-41d4-a716-446655440002",
  "assetTag": "AF-0001",
  "requestedByName": "John Doe",
  "requestedToName": "Jane Smith",
  "status": "REQUESTED",
  "createdAt": "2024-01-15T10:40:00Z",
  "resolvedAt": null
}
```

### Example 4: Approve Transfer Request
```bash
curl -X PATCH http://localhost:8080/transfer-requests/990e8400-e29b-41d4-a716-446655440004/approve \
  -H "Authorization: Bearer {token}"
```

Response (200):
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "status": "APPROVED",
  "resolvedAt": "2024-01-15T10:45:00Z"
}
```

**Behind the scenes**:
- Old allocation (held by John Doe) marked as RETURNED
- New allocation created for Jane Smith as new holder
- Asset status stays ALLOCATED throughout

### Example 5: Get Allocation History
```bash
curl "http://localhost:8080/allocations/asset/550e8400-e29b-41d4-a716-446655440000/history" \
  -H "Authorization: Bearer {token}"
```

Response (200):
```json
[
  {
    "id": "new-allocation-uuid",
    "assetTag": "AF-0001",
    "holderName": "Jane Smith",
    "allocatedDate": "2024-01-15",
    "status": "ACTIVE",
    "allocatedByName": "Alice Manager"
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "assetTag": "AF-0001",
    "holderName": "John Doe",
    "allocatedDate": "2024-01-14",
    "returnedDate": "2024-01-15",
    "status": "RETURNED",
    "allocatedByName": "Alice Manager"
  }
]
```

## Future Enhancements

1. **Allocation Notifications**: Email current holder when transfer request created
2. **Allocation Policies**: Define rules (e.g., max 5 assets per employee)
3. **Allocation Approvals**: Require approval before asset is actually handed off
4. **Transfer History**: Track who requested, when approved, by whom
5. **Bulk Operations**: Allocate/return multiple assets at once
6. **Allocation Reports**: Generate reports on asset utilization, overdue items
7. **Automatic Returns**: Scheduled notifications/auto-return at expectedReturnDate
8. **Allocation Audit Trail**: Complete history of who held asset, when, conditions

## Troubleshooting

### Allocation Conflict
```
Error: Asset AF-0001 is currently held by John Doe
```
**Solution**: Create a transfer request to move asset from current holder to new holder

### Transfer Request Not Found
```
Error: Transfer request with ID {id} not found
```
**Solution**: Verify transfer request ID is correct, request may have been deleted or ID typo

### Cannot Return Already Returned Asset
```
Error: Allocation is already RETURNED, cannot return an asset twice
```
**Solution**: Asset already returned; check allocation history to find active allocation if needed

### Asset Status Prevents Allocation
```
Error: Asset AF-0001 has status LOST, cannot allocate
```
**Solution**: Asset must be in AVAILABLE or RESERVED status before allocation

## Testing Concurrency

To verify concurrent allocation conflict detection:

```bash
#!/bin/bash
# Simulate 5 concurrent allocation attempts on same asset
ASSET_ID="550e8400-e29b-41d4-a716-446655440000"

for i in {1..5}; do
  USER_ID=$(uuidgen)
  curl -X POST http://localhost:8080/allocations \
    -H "Authorization: Bearer {token}" \
    -H "Content-Type: application/json" \
    -d "{\"assetId\":\"$ASSET_ID\",\"holderId\":\"$USER_ID\"}" &
done

wait

# Only 1 should succeed (201)
# Other 4 should fail with 409 Conflict
```

Expected: Exactly 1 succeeds, 4 fail with 409 Conflict "already held by..."
