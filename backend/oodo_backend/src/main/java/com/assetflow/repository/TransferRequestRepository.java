package com.assetflow.repository;

import com.assetflow.entity.TransferRequest;
import com.assetflow.enums.TransferRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransferRequestRepository extends JpaRepository<TransferRequest, UUID> {

    /**
     * Find all transfer requests with given status.
     *
     * @param status the transfer request status
     * @return list of transfer requests matching the status
     */
    List<TransferRequest> findByStatus(TransferRequestStatus status);

    /**
     * Find all transfer requests for a specific allocation.
     *
     * @param allocationId the allocation ID
     * @return list of transfer requests for that allocation
     */
    List<TransferRequest> findByAllocationId(UUID allocationId);
}
