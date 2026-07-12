package com.assetflow.entity;

import com.assetflow.enums.AllocationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "allocations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Allocation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "holder_id", nullable = false)
    private User holder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(nullable = false)
    private LocalDate allocatedDate;

    @Column(name = "expected_return_date")
    private LocalDate expectedReturnDate;

    @Column(name = "returned_date")
    private LocalDate returnedDate;

    @Column(name = "condition_at_return", length = 500)
    private String conditionAtReturn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AllocationStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocated_by_id", nullable = false)
    private User allocatedBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = AllocationStatus.ACTIVE;
        }
        if (allocatedDate == null) {
            allocatedDate = LocalDate.now();
        }
    }
}
