package com.assetflow.repository;

import com.assetflow.entity.Department;
import com.assetflow.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    List<Department> findByStatus(Status status);

    boolean existsByNameIgnoreCase(String name);
}
