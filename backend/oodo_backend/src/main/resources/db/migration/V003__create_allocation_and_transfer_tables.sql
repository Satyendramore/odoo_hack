-- Create allocations table
CREATE TABLE IF NOT EXISTS allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL,
    holder_id UUID NOT NULL,
    department_id UUID,
    allocated_date DATE NOT NULL,
    expected_return_date DATE,
    returned_date DATE,
    condition_at_return VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    allocated_by_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_allocation_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
    CONSTRAINT fk_allocation_holder FOREIGN KEY (holder_id) REFERENCES users(id),
    CONSTRAINT fk_allocation_department FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT fk_allocation_allocated_by FOREIGN KEY (allocated_by_id) REFERENCES users(id),
    CONSTRAINT chk_allocation_status CHECK (status IN ('ACTIVE', 'RETURNED'))
);

-- Create transfer_requests table
CREATE TABLE IF NOT EXISTS transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL,
    requested_by_id UUID NOT NULL,
    requested_to_id UUID NOT NULL,
    approved_by_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    CONSTRAINT fk_transfer_request_allocation FOREIGN KEY (allocation_id) REFERENCES allocations(id),
    CONSTRAINT fk_transfer_request_requested_by FOREIGN KEY (requested_by_id) REFERENCES users(id),
    CONSTRAINT fk_transfer_request_requested_to FOREIGN KEY (requested_to_id) REFERENCES users(id),
    CONSTRAINT fk_transfer_request_approved_by FOREIGN KEY (approved_by_id) REFERENCES users(id),
    CONSTRAINT chk_transfer_request_status CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_allocation_asset_status ON allocations(asset_id, status);
CREATE INDEX IF NOT EXISTS idx_allocation_holder_status ON allocations(holder_id, status);
CREATE INDEX IF NOT EXISTS idx_allocation_asset ON allocations(asset_id);
CREATE INDEX IF NOT EXISTS idx_allocation_expected_return ON allocations(expected_return_date);
CREATE INDEX IF NOT EXISTS idx_transfer_request_status ON transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_transfer_request_allocation ON transfer_requests(allocation_id);
