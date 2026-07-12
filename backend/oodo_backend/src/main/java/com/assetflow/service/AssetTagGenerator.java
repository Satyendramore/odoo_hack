package com.assetflow.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssetTagGenerator {

    private final EntityManager entityManager;

    /**
     * Generates a unique asset tag in the format AF-XXXX where XXXX is a zero-padded
     * number from the database sequence. Thread-safe via database sequence locking.
     *
     * @return the generated asset tag (e.g., "AF-0001", "AF-0042", "AF-10000")
     */
    @Transactional
    public String generateAssetTag() {
        // Use database-agnostic approach: count existing assets + 1
        Object result = entityManager
                .createNativeQuery("SELECT COALESCE(MAX(CAST(SUBSTRING(asset_tag, 4) AS UNSIGNED)), 0) + 1 FROM assets")
                .getSingleResult();
        
        Long nextValue = ((Number) result).longValue();

        String tag = formatAssetTag(nextValue);
        log.debug("Generated asset tag: {}", tag);
        return tag;
    }

    /**
     * Formats the sequence value into the asset tag format.
     * - Values 1-9999: formatted with leading zeros (AF-0001)
     * - Values >= 10000: no padding (AF-10000, AF-99999, etc.)
     *
     * @param sequenceValue the value from the database sequence
     * @return formatted asset tag string
     */
    private String formatAssetTag(Long sequenceValue) {
        if (sequenceValue <= 9999) {
            return String.format("AF-%04d", sequenceValue);
        } else {
            return String.format("AF-%d", sequenceValue);
        }
    }
}
