-- Create bookings table for time-slot based resource booking
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL,
    booked_by_id UUID NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UPCOMING',
    purpose VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    CONSTRAINT fk_booking_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
    CONSTRAINT fk_booking_booked_by FOREIGN KEY (booked_by_id) REFERENCES users(id),
    CONSTRAINT chk_booking_status CHECK (status IN ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_booking_time_order CHECK (start_time < end_time)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_booking_asset_start ON bookings(asset_id, start_time);
CREATE INDEX IF NOT EXISTS idx_booking_booked_by_status ON bookings(booked_by_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_status_end_time ON bookings(status, end_time);
CREATE INDEX IF NOT EXISTS idx_booking_asset_status ON bookings(asset_id, status);

-- This index optimizes the overlap detection query
-- The query is: b.asset.id = :assetId AND b.status <> 'CANCELLED' 
--               AND b.startTime < :endTime AND b.endTime > :startTime
-- A composite index on (asset_id, status, start_time, end_time) is ideal but
-- we use separate indexes for flexibility and smaller index size
CREATE INDEX IF NOT EXISTS idx_booking_overlap ON bookings(asset_id, start_time, end_time) WHERE status <> 'CANCELLED';
