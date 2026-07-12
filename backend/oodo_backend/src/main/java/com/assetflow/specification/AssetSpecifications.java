package com.assetflow.specification;

import com.assetflow.entity.Asset;
import com.assetflow.entity.AssetCategory;
import com.assetflow.entity.Department;
import com.assetflow.enums.AssetStatus;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

/**
 * Specifications for Asset entity to support flexible filtering
 * without a combinatorial explosion of derived query methods.
 */
public class AssetSpecifications {

    public static Specification<Asset> hasCategory(UUID categoryId) {
        return (root, query, cb) -> {
            if (categoryId == null) {
                return null;
            }
            return cb.equal(root.get("category").get("id"), categoryId);
        };
    }

    public static Specification<Asset> hasStatus(AssetStatus status) {
        return (root, query, cb) -> {
            if (status == null) {
                return null;
            }
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Asset> hasLocation(String location) {
        return (root, query, cb) -> {
            if (location == null || location.isBlank()) {
                return null;
            }
            return cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase() + "%");
        };
    }

    public static Specification<Asset> hasDepartment(UUID departmentId) {
        return (root, query, cb) -> {
            if (departmentId == null) {
                return null;
            }
            return cb.equal(root.get("department").get("id"), departmentId);
        };
    }

    public static Specification<Asset> tagOrSerialContains(String searchTerm) {
        return (root, query, cb) -> {
            if (searchTerm == null || searchTerm.isBlank()) {
                return null;
            }
            String pattern = "%" + searchTerm.toLowerCase() + "%";
            Predicate tagPredicate = cb.like(cb.lower(root.get("assetTag")), pattern);
            Predicate serialPredicate = cb.like(cb.lower(root.get("serialNumber")), pattern);
            return cb.or(tagPredicate, serialPredicate);
        };
    }
}
