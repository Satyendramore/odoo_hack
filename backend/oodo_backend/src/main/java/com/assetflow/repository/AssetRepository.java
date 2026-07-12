package com.assetflow.repository;

import com.assetflow.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID>, JpaSpecificationExecutor<Asset> {
    boolean existsByAssetTag(String assetTag);

    Optional<Asset> findByAssetTag(String assetTag);

    boolean existsBySerialNumber(String serialNumber);
}
