# Asset Allocation & Transfer Module - Quick Reference

## Files Created

### Enums (2 files)
- `AllocationStatus.java` (ACTIVE, RETURNED)
- `TransferRequestStatus.java` (REQUESTED, APPROVED, REJECTED)

### Entities (2 files)
- `Allocation.java` - Asset allocation records
- `TransferRequest.java` - Transfer request records

### Repositories (2 files)
- `AllocationRepository.java` (with pessimistic lock for concurrency)
- `TransferRequestRepository.java`

### DTOs (6 files)
- `AllocationRequest.java`
- `AllocationResponse.java`
- `ReturnRequest.java`
- `TransferRequestCreateRequest.java`
- `TransferRequestResponse.java`
- `ErrorResponseWithMetadata.java` (for conflict responses)

### Services (2 files)
- `AllocationService.java` (allocate, return, history)
- `TransferRequestService.java` (request, approve, reject)

### Controllers (2 files)
- `AllocationController.java` (POST, GET endpoints)
- `TransferRequestController.java` (PATCH, GET endpoints)

### Exceptions (4 files)
- `AssetAlreadyAllocatedException.java` (409)
- `AllocationNotFoundException.java` (404)
- `TransferRequestNotFoundException.java` (404)
- `InvalidAllocationStateException.java` (400)

### Database (1 file)
- `V003__create_allocation_and_transfer_tables.sql`

### Documentation (2 files)
- `ALLOCATION_TRANSFER_MODULE_DOCUMENTATION.md` (800+ lines)
- `ALLOCATION_TRANSFER_QUICK_REFERENCE.md` (this file)

## Core Endpoints

### Allocations
```
POST   /allocations              - Allocate asset (CONFLICT DETECTION)
POST   /allocations/{id}/return  - Return asset
GET    /allocations/{id}         - Get allocation
GET    /allocations/asset/{id}/history  - Get history
GET    /allocations/overdue      - Get overdue items
```

### Transfer Requests
```
POST   /transfer-requests                - Create request
PATCH  /transfer-requests/{id}/approve  - Approve (ATOMIC)
PATCH  /transfer-requests/{id}/reject   - Reject
GET    /transfer-requests                - List (optional status filter)
GET    /transfer-requests/{id}          - Get one
```

## Key Features

### 1. Conflict Detection (POST /allocations)
- **Problem**: Multiple users allocate same asset simultaneously
- **Solution**: Pessimistic write lock on allocation check
- **Result**: First succeeds (201), others fail (409 Conflict)

```
Response 409:
{
  "message": "Asset AF-0001 is currently held by John Doe",
  "currentHolder": "John Doe",
  "suggestedAction": "TRANSFER_REQUEST"
}
```

### 2. Transfer Request Flow
```
Step 1: Create transfer request (POST /transfer-requests)
        ↓
Step 2: Approve transfer request (PATCH .../approve)
        ↓
Step 3: Atomic changes:
        - Mark old allocation as RETURNED
        - Create new allocation (new holder)
        - Asset status stays ALLOCATED (no flicker)
        ↓
Result: Asset transferred, no conflict
```

### 3. Concurrency Safety
- **Pessimistic Lock**: `@Lock(LockModeType.PESSIMISTIC_WRITE)` on active allocation check
- **SERIALIZABLE Isolation**: `@Transactional(isolation = Isolation.SERIALIZABLE)` on allocate()
- **Atomic Transfers**: Entire approve() in single transaction
- **Database Level**: Uses SQL `FOR UPDATE` clause

## Role-Based Access

```
Allocation Write (POST, POST /return)
├─ ASSET_MANAGER ✓
├─ DEPARTMENT_HEAD ✓
└─ ADMIN ✓

Allocation Read (GET)
├─ Any authenticated user ✓

Transfer Write (PATCH /approve, /reject)
├─ ASSET_MANAGER ✓
├─ DEPARTMENT_HEAD ✓
└─ ADMIN ✓

Transfer Read (GET)
├─ ASSET_MANAGER ✓
└─ ADMIN ✓
```

## Allocation Status Lifecycle

```
        allocate()
           ↓
       [ACTIVE]
           ↓
       returnAsset()
           ↓
      [RETURNED] ← terminal
```

## Transfer Request Status Lifecycle

```
           create()
             ↓
       [REQUESTED]
          ↙     ↘
      approve()  reject()
       ↓             ↓
    [APPROVED]  [REJECTED] ← terminal
```

## Common Workflows

### Workflow 1: Simple Allocation & Return
```bash
# 1. Allocate asset to John Doe
POST /allocations
{
  "assetId": "af-uuid",
  "holderId": "john-uuid",
  "expectedReturnDate": "2024-12-31"
}
→ 201 Created, allocation-id = "alloc-uuid"

# 2. Later, return the asset
POST /allocations/alloc-uuid/return
{
  "conditionAtReturn": "Scratches on screen"
}
→ 200 OK
```

### Workflow 2: Conflict Resolution (Transfer Request)
```bash
# 1. Try to allocate same asset to Jane Doe (conflict!)
POST /allocations
{
  "assetId": "af-uuid",
  "holderId": "jane-uuid"
}
→ 409 Conflict
{
  "message": "Asset AF-0001 is currently held by John Doe",
  "currentHolder": "John Doe",
  "suggestedAction": "TRANSFER_REQUEST"
}

# 2. Create transfer request from John to Jane
POST /transfer-requests?allocationId=alloc-uuid
{
  "requestedToId": "jane-uuid"
}
→ 201 Created, transfer-id = "xfer-uuid"

# 3. Manager approves transfer
PATCH /transfer-requests/xfer-uuid/approve
→ 200 OK (atomic: old allocation RETURNED, new allocation created)

# 4. Verify Jane now holds the asset
GET /allocations/asset/af-uuid/history
→ [
     { "status": "ACTIVE", "holderName": "Jane Doe" },
     { "status": "RETURNED", "holderName": "John Doe" }
   ]
```

## Error Codes & Messages

| Error | Code | Message |
|-------|------|---------|
| Asset already allocated | 409 | "Asset AF-0001 is currently held by John Doe" |
| Allocation not found | 404 | "Allocation with ID {id} not found" |
| Transfer request not found | 404 | "Transfer request with ID {id} not found" |
| Invalid allocation state | 400 | "Cannot request transfer for RETURNED allocation" |
| Asset invalid status | 400 | "Asset AF-0001 has status LOST, cannot allocate" |

## Database Indexes

All critical queries are indexed:
- `idx_allocation_asset_status` - **CRITICAL**: Conflict detection
- `idx_allocation_holder_status` - Holder queries
- `idx_allocation_asset` - History queries
- `idx_allocation_expected_return` - Overdue queries
- `idx_transfer_request_status` - Approval queue
- `idx_transfer_request_allocation` - Transfer history

## Concurrency Testing

```bash
# Simulate 5 concurrent allocation attempts
for i in {1..5}; do
  curl -X POST http://localhost:8080/allocations \
    -H "Authorization: Bearer {token}" \
    -d '{"assetId":"asset-uuid","holderId":"user-$i-uuid"}' &
done
wait

# Expected:
# - 1 succeeds (201)
# - 4 fail (409 Conflict)
```

## Integration Points

### Asset Module
- Allocation references Asset
- Asset status → ALLOCATED (on allocate)
- Asset status → AVAILABLE (on return)
- Uses existing AssetService.updateStatus()

### User Module
- Allocation.holder → User
- Allocation.allocatedBy → User
- TransferRequest.requestedBy/requestedTo/approvedBy → User

### Department Module
- Allocation.department → Department (optional)

### Security
- Existing JWT authentication
- Existing @PreAuthorize annotations
- Existing Role enum (ASSET_MANAGER, DEPARTMENT_HEAD, ADMIN)

## Performance

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Allocate | O(log n) | Pessimistic lock + index on (asset_id, status) |
| Return | O(log n) | Index on asset_id |
| Transfer approve | O(log n) | Atomic transaction |
| Get history | O(log n) | Index on asset_id |
| Get overdue | O(n) | Full table scan, no filter |

## Validation Rules

### AllocationRequest
- `assetId`: @NotNull
- `holderId`: @NotNull
- `expectedReturnDate`: optional

### TransferRequestCreateRequest
- `requestedToId`: @NotNull

### ReturnRequest
- `conditionAtReturn`: optional (free text)

## Common Issues & Solutions

**Q: Asset shows 409 Conflict, what do I do?**
A: Create a transfer request to move asset from current holder to new holder.

**Q: Can I allocate an asset that's LOST or RETIRED?**
A: No, only AVAILABLE or RESERVED assets can be allocated.

**Q: What happens during transfer approval?**
A: Atomic operation: old allocation marked RETURNED, new allocation created for requestedTo user.

**Q: Is there a race condition with two concurrent allocations?**
A: No, pessimistic lock on asset allocation check prevents this.

**Q: Can I return an asset twice?**
A: No, once RETURNED, allocation is terminal.

## Files Modified

- `GlobalExceptionHandler.java` (added 5 new exception handlers)

No existing code was modified or duplicated. Module extends existing patterns.
