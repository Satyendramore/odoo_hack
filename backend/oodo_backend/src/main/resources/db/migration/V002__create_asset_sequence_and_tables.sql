-- Create sequence for asset tag generation
-- Starting at 1, increments by 1 with no cache for guaranteed uniqueness
CREATE SEQUENCE IF NOT EXISTS asset_tag_seq
    START WITH 1
    INCREMENT BY 1
    NO CACHE;

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag VARCHAR(20) NOT NULL UNIQUE,
    category_id UUID NOT NULL,
    serial_number VARCHAR(255) UNIQUE,
    acquisition_date DATE,
    acquisition_cost NUMERIC(19, 2),
    condition VARCHAR(255),
    location VARCHAR(500) NOT NULL,
    department_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    is_bookable BOOLEAN NOT NULL DEFAULT FALSE,
    photo_url VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_asset_category FOREIGN KEY (category_id) REFERENCES asset_categories(id),
    CONSTRAINT fk_asset_department FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT chk_asset_status CHECK (status IN ('AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_asset_category ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_asset_department ON assets(department_id);
CREATE INDEX IF NOT EXISTS idx_asset_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_asset_location ON assets(location);
CREATE INDEX IF NOT EXISTS idx_asset_tag ON assets(asset_tag);
