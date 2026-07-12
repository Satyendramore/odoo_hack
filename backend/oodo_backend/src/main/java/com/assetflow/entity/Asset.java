package com.assetflow.entity;

import com.assetflow.enums.AssetStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "assets", uniqueConstraints = {
        @UniqueConstraint(columnNames = "asset_tag"),
        @UniqueConstraint(columnNames = "serial_number")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asset {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String assetTag;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private AssetCategory category;

    @Column(unique = true, length = 255)
    private String serialNumber;

    @Column(name = "acquisition_date")
    private LocalDate acquisitionDate;

    @Column(name = "acquisition_cost", precision = 19, scale = 2)
    private BigDecimal acquisitionCost;

    @Column(length = 255)
    private String condition;

    @Column(nullable = false, length = 500)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AssetStatus status;

    @Column(nullable = false)
    private Boolean isBookable;

    @Column(name = "photo_url", length = 1000)
    private String photoUrl;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = AssetStatus.AVAILABLE;
        }
        if (isBookable == null) {
            isBookable = false;
        }
    }
}
