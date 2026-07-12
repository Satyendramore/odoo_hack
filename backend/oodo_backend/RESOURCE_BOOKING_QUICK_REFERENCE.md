# Resource Booking Module - Quick Reference

## Files Created

### Enums (1 file)
- `BookingStatus.java` (UPCOMING, ONGOING, COMPLETED, CANCELLED)

### Entities (1 file)
- `Booking.java` - Time-slot booking records

### Repositories (1 file)
- `BookingRepository.java` (with pessimistic lock for overlap detection)

### DTOs (3 files)
- `BookingRequest.java` (assetId, startTime, endTime, purpose + validation)
- `BookingResponse.java` (id, assetId, assetTag, bookedByName, times, status, purpose)
- `BookingOverlapErrorResponse.java` (409 Conflict response with conflicting times)

### Services (1 file)
- `BookingService.java` (book, cancel, reschedule, getCalendar, getUserUpcomingBookings)

### Controllers (1 file)
- `BookingController.java` (6 endpoints: POST, GET calendar, PATCH cancel, PATCH reschedule, GET one, GET my upcoming)

### Exceptions (4 files)
- `BookingOverlapException.java` (409) - includes conflictingStart/End for UI highlighting
- `AssetNotBookableException.java` (400) - asset has isBookable = false
- `BookingNotFoundException.java` (404)
- `InvalidBookingStateException.java` (400) - can't cancel/reschedule CANCELLED or COMPLETED

### Database (1 file)
- `V004__create_bookings_table.sql` - optimized indexes for overlap detection

### Documentation (2 files)
- `RESOURCE_BOOKING_MODULE_DOCUMENTATION.md` (800+ lines, detailed)
- `RESOURCE_BOOKING_QUICK_REFERENCE.md` (this file, quick lookup)

## Core Endpoints

```
POST   /bookings                    - Create booking (OVERLAP DETECTION)
GET    /bookings/asset/{assetId}   - Get calendar view for asset
GET    /bookings/{id}               - Get specific booking
GET    /bookings/my/upcoming        - Get my upcoming bookings
PATCH  /bookings/{id}/cancel        - Cancel booking (AUTHORIZATION)
PATCH  /bookings/{id}/reschedule    - Reschedule to new times (ATOMIC)
```

## Key Features

### 1. Half-Open Interval Overlap Detection
- **Problem**: Multiple users book same asset for overlapping time slots
- **Solution**: Half-open interval logic with pessimistic write lock
- **Logic**: `startTime1 < endTime2 AND endTime1 > startTime2`

**Examples:**
```
9:00-10:00 and 10:00-11:00 → NO OVERLAP (allowed, back-to-back OK)
9:00-10:00 and 9:30-10:30  → OVERLAP (rejected)
```

**Result**: First request succeeds (201), concurrent overlapping requests fail (409 Conflict)

```
Response 409:
{
  "timestamp": "2025-07-12T14:30:00",
  "status": 409,
  "message": "Requested slot 2025-07-12T14:30:00Z-2025-07-12T15:30:00Z overlaps with an existing booking 2025-07-12T14:00:00Z-2025-07-12T15:00:00Z",
  "conflictingStart": "2025-07-12T14:00:00Z",
  "conflictingEnd": "2025-07-12T15:00:00Z"
}
```

**Frontend Use**: Highlight conflicting times on calendar

### 2. Concurrency Safety
- **Pessimistic Lock**: `@Lock(LockModeType.PESSIMISTIC_WRITE)` on findOverlapping()
- **SERIALIZABLE Isolation**: `@Transactional(isolation = Isolation.SERIALIZABLE)` on book()
- **Database Level**: Uses SQL `FOR UPDATE` clause to lock rows during overlap check
- **Race Condition Prevention**: Lock held until transaction commits

### 3. Reschedule Atomicity
- **Problem**: User reschedules booking → old booking cancelled, new created → if failure between, data inconsistency
- **Solution**: Entire reschedule in single `@Transactional(isolation = SERIALIZABLE)` method
- **Result**: Either both changes happen or neither (all-or-nothing)

```
reschedule(id, newTimes, user):
  1. Cancel old booking (within same transaction)
  2. Create new booking with updated times (within same transaction)
  → Atomic: all succeed or all fail
```

### 4. Asset Bookability Validation
- **Check**: Asset must have `isBookable = true` before allowing booking
- **Response**: 400 Bad Request with clear message if asset not bookable
- **Use Case**: Some assets may not support time-slot booking (e.g., fixed installation)

### 5. Authorization at Service Layer
- **Who Can Cancel**: 
  - Person who made the booking (bookedBy.id)
  - Their Department Head
  - Asset Manager or Admin (role-based)
- **Checked**: Inside service layer (not just controller)
- **Response**: IllegalArgumentException if unauthorized

### 6. Booking Lifecycle
```
State Transitions:
UPCOMING   → CANCELLED (via cancel endpoint, or scheduled job flips to ONGOING)
ONGOING    → COMPLETED (via scheduled job when end time passes)
COMPLETED  → (terminal)
CANCELLED  → (terminal)

Terminal States: COMPLETED, CANCELLED (cannot cancel already-terminal bookings)
```

### 7. DTO Validation
- **BookingRequest**:
  - `assetId`: @NotNull, valid UUID
  - `startTime`: @NotNull, @Future (must be future time)
  - `endTime`: @NotNull, @Future (must be future time)
  - **Class-level check**: endTime must be strictly after startTime (checked in record constructor)
  - `purpose`: Optional string (e.g., "Team meeting", "Training session")

- **BookingResponse**:
  - Includes booking ID, asset tag (not ID), booked-by user name (not ID), times, status, purpose, created timestamp
  - Used consistently across all GET endpoints

- **BookingOverlapErrorResponse**:
  - HTTP 409 Conflict response
  - Includes message, conflicting booking's start/end times
  - Allows frontend to highlight taken slots on calendar

## Database Indexes

```sql
-- Common queries
idx_booking_asset_start         (asset_id, start_time)
idx_booking_booked_by_status    (booked_by_id, status)
idx_booking_status_end_time     (status, end_time)
idx_booking_asset_status        (asset_id, status)

-- Overlap detection query optimization
idx_booking_overlap             (asset_id, start_time, end_time) WHERE status <> 'CANCELLED'
```

## Common API Patterns

### 1. Book a Resource
```bash
POST /bookings
Content-Type: application/json

{
  "assetId": "550e8400-e29b-41d4-a716-446655440000",
  "startTime": "2025-07-15T14:00:00Z",
  "endTime": "2025-07-15T15:30:00Z",
  "purpose": "Team standup meeting"
}

# Response 201 Created
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "assetId": "550e8400-e29b-41d4-a716-446655440000",
  "assetTag": "AF-0042",
  "bookedByName": "Alice Smith",
  "startTime": "2025-07-15T14:00:00Z",
  "endTime": "2025-07-15T15:30:00Z",
  "status": "UPCOMING",
  "purpose": "Team standup meeting",
  "createdAt": "2025-07-12T10:00:00Z"
}

# If overlaps (409 Conflict)
{
  "timestamp": "2025-07-12T10:00:00",
  "status": 409,
  "message": "Requested slot ... overlaps with existing booking ...",
  "conflictingStart": "2025-07-15T14:00:00Z",
  "conflictingEnd": "2025-07-15T15:00:00Z"
}
```

### 2. View Calendar for Asset
```bash
GET /bookings/asset/550e8400-e29b-41d4-a716-446655440000

# Response 200 OK (list of all non-cancelled bookings)
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "assetId": "550e8400-e29b-41d4-a716-446655440000",
    "assetTag": "AF-0042",
    "bookedByName": "Alice Smith",
    "startTime": "2025-07-15T14:00:00Z",
    "endTime": "2025-07-15T15:30:00Z",
    "status": "UPCOMING",
    "purpose": "Team standup",
    "createdAt": "2025-07-12T10:00:00Z"
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "assetId": "550e8400-e29b-41d4-a716-446655440000",
    "assetTag": "AF-0042",
    "bookedByName": "Bob Johnson",
    "startTime": "2025-07-15T16:00:00Z",
    "endTime": "2025-07-15T17:00:00Z",
    "status": "UPCOMING",
    "purpose": "Client demo",
    "createdAt": "2025-07-12T10:05:00Z"
  }
]
```

### 3. Cancel a Booking
```bash
PATCH /bookings/660e8400-e29b-41d4-a716-446655440001/cancel

# Response 200 OK
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "assetId": "550e8400-e29b-41d4-a716-446655440000",
  "assetTag": "AF-0042",
  "bookedByName": "Alice Smith",
  "startTime": "2025-07-15T14:00:00Z",
  "endTime": "2025-07-15T15:30:00Z",
  "status": "CANCELLED",
  "purpose": "Team standup",
  "createdAt": "2025-07-12T10:00:00Z"
}
```

### 4. Reschedule a Booking
```bash
PATCH /bookings/660e8400-e29b-41d4-a716-446655440001/reschedule
Content-Type: application/json

{
  "assetId": "550e8400-e29b-41d4-a716-446655440000",
  "startTime": "2025-07-16T09:00:00Z",
  "endTime": "2025-07-16T10:00:00Z",
  "purpose": "Team standup (rescheduled)"
}

# Response 200 OK (new booking created, old one marked CANCELLED)
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "assetId": "550e8400-e29b-41d4-a716-446655440000",
  "assetTag": "AF-0042",
  "bookedByName": "Alice Smith",
  "startTime": "2025-07-16T09:00:00Z",
  "endTime": "2025-07-16T10:00:00Z",
  "status": "UPCOMING",
  "purpose": "Team standup (rescheduled)",
  "createdAt": "2025-07-12T10:10:00Z"
}
```

### 5. Get My Upcoming Bookings
```bash
GET /bookings/my/upcoming

# Response 200 OK (filtered by current user and UPCOMING status)
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "assetId": "550e8400-e29b-41d4-a716-446655440000",
    "assetTag": "AF-0042",
    "bookedByName": "Alice Smith",
    "startTime": "2025-07-15T14:00:00Z",
    "endTime": "2025-07-15T15:30:00Z",
    "status": "UPCOMING",
    "purpose": "Team standup",
    "createdAt": "2025-07-12T10:00:00Z"
  }
]
```

## Testing Concurrency

### Scenario: Concurrent Bookings (Expected Behavior)
```
Timeline:
T0: User A requests 14:00-15:00 on asset AF-0042
T0: User B requests 14:30-15:30 on asset AF-0042 (concurrently)

Result (one of):
Option 1: A succeeds (201), B fails (409 Conflict) ← Typical
Option 2: B succeeds (201), A fails (409 Conflict) ← Also valid

Key: BOTH cannot succeed (overlap prevention works)
```

### How to Test
```bash
# Terminal 1: Book 14:00-15:00
curl -X POST http://localhost:8080/bookings \
  -H "Authorization: Bearer TOKEN_A" \
  -d '{"assetId":"...","startTime":"2025-07-15T14:00:00Z","endTime":"2025-07-15T15:00:00Z"}'

# Terminal 2: Book 14:30-15:30 (overlaps, concurrent)
curl -X POST http://localhost:8080/bookings \
  -H "Authorization: Bearer TOKEN_B" \
  -d '{"assetId":"...","startTime":"2025-07-15T14:30:00Z","endTime":"2025-07-15T15:30:00Z"}'

# One gets 201, other gets 409
```

## Migration Safety

- **V004 Migration**: Adds bookings table with constraints and indexes
- **No breaking changes**: Does not modify existing tables (asset, users, allocations, etc.)
- **Rollback safe**: Can be rolled back by dropping bookings table
- **Foreign keys**: Links to existing assets and users tables

## Next Steps (Scheduled Jobs)

These are future enhancements (not implemented in current version):

1. **Transition UPCOMING → ONGOING**: When current time >= startTime
   - Triggered by scheduled job (Spring `@Scheduled`)
   - Query: `findByStatusAndEndTimeBefore(UPCOMING, now)`

2. **Transition ONGOING → COMPLETED**: When current time >= endTime
   - Similar scheduled job pattern

3. **Cleanup**: Optionally delete CANCELLED bookings older than N days

## Integration Points

- **Asset Module**: Checks `asset.isBookable` and loads asset metadata
- **User Module**: Loads booked-by user details, department info for authorization
- **Auth Module**: Uses `@PreAuthorize("isAuthenticated()")` for all endpoints
- **Error Handling**: Uses existing GlobalExceptionHandler with 5 new booking exception handlers

## Code Reuse & Patterns

This module reuses patterns from existing modules:

1. **Pessimistic Locking** (from Allocation module)
   - Used in findOverlapping() to prevent race conditions

2. **SERIALIZABLE Isolation** (from Allocation module)
   - Used in book() and reschedule() for strong consistency

3. **Authorization at Service Layer** (from Allocation module)
   - Role-based checks inside service, not just controller

4. **DTO Validation** (from all modules)
   - Records with @NotNull, @Future annotations
   - Class-level checks in record constructor (endTime > startTime)

5. **Repository Queries** (from Asset module)
   - Multiple @Query methods for different access patterns

6. **Exception Handling** (from all modules)
   - Custom exceptions with structured data
   - Global exception handler registered in GlobalExceptionHandler

## Files Modified

- `GlobalExceptionHandler.java`: Added 5 booking exception handlers

## Files Created

- 14 files total (see "Files Created" section above)
- ~800 lines of documentation
- ~600 lines of Java code
- 1 SQL migration file with optimized indexes
