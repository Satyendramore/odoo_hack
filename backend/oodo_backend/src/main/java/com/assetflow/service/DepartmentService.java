package com.assetflow.service;

import com.assetflow.dto.DepartmentRequest;
import com.assetflow.dto.DepartmentResponse;
import com.assetflow.entity.Department;
import com.assetflow.entity.User;
import com.assetflow.enums.Status;
import com.assetflow.exception.DepartmentNotFoundException;
import com.assetflow.exception.InvalidRoleAssignmentException;
import com.assetflow.repository.DepartmentRepository;
import com.assetflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @Transactional
    public DepartmentResponse create(DepartmentRequest request) {
        // Validate name uniqueness (case-insensitive)
        if (departmentRepository.existsByNameIgnoreCase(request.name())) {
            throw new InvalidRoleAssignmentException("Department with name '" + request.name() + "' already exists");
        }

        User head = null;
        if (request.headId() != null) {
            head = userRepository.findById(request.headId())
                    .orElseThrow(() -> new com.assetflow.exception.UserNotFoundException(
                            "User with ID " + request.headId() + " not found"
                    ));
        }

        Department parentDept = null;
        if (request.parentDepartmentId() != null) {
            parentDept = departmentRepository.findById(request.parentDepartmentId())
                    .orElseThrow(() -> new DepartmentNotFoundException(
                            "Parent department with ID " + request.parentDepartmentId() + " not found"
                    ));
        }

        Department department = Department.builder()
                .name(request.name())
                .head(head)
                .parentDepartment(parentDept)
                .status(Status.ACTIVE)
                .build();

        Department saved = departmentRepository.save(department);
        log.info("Department created: {}", saved.getId());
        return mapToResponse(saved);
    }

    @Transactional
    public DepartmentResponse update(UUID id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new DepartmentNotFoundException("Department with ID " + id + " not found"));

        // Validate name uniqueness if name is being changed
        if (!department.getName().equalsIgnoreCase(request.name()) &&
                departmentRepository.existsByNameIgnoreCase(request.name())) {
            throw new InvalidRoleAssignmentException("Department with name '" + request.name() + "' already exists");
        }

        department.setName(request.name());

        // Resolve head
        if (request.headId() != null) {
            User head = userRepository.findById(request.headId())
                    .orElseThrow(() -> new com.assetflow.exception.UserNotFoundException(
                            "User with ID " + request.headId() + " not found"
                    ));
            department.setHead(head);
        } else {
            department.setHead(null);
        }

        // Resolve parent department
        if (request.parentDepartmentId() != null) {
            // Guard against circular parent chain
            if (request.parentDepartmentId().equals(id)) {
                throw new InvalidRoleAssignmentException("A department cannot be its own parent");
            }

            Department parentDept = departmentRepository.findById(request.parentDepartmentId())
                    .orElseThrow(() -> new DepartmentNotFoundException(
                            "Parent department with ID " + request.parentDepartmentId() + " not found"
                    ));

            // Check for circular dependency
            if (isCircularDependency(id, parentDept)) {
                throw new InvalidRoleAssignmentException("Circular department hierarchy detected");
            }

            department.setParentDepartment(parentDept);
        } else {
            department.setParentDepartment(null);
        }

        Department updated = departmentRepository.save(department);
        log.info("Department updated: {}", updated.getId());
        return mapToResponse(updated);
    }

    @Transactional
    public void deactivate(UUID id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new DepartmentNotFoundException("Department with ID " + id + " not found"));

        department.setStatus(Status.INACTIVE);
        departmentRepository.save(department);
        log.info("Department deactivated: {}", id);
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAll() {
        return departmentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getById(UUID id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new DepartmentNotFoundException("Department with ID " + id + " not found"));
        return mapToResponse(department);
    }

    private DepartmentResponse mapToResponse(Department department) {
        return new DepartmentResponse(
                department.getId(),
                department.getName(),
                department.getHead() != null ? department.getHead().getName() : null,
                department.getHead() != null ? department.getHead().getId() : null,
                department.getParentDepartment() != null ? department.getParentDepartment().getName() : null,
                department.getParentDepartment() != null ? department.getParentDepartment().getId() : null,
                department.getStatus()
        );
    }

    private boolean isCircularDependency(UUID departmentId, Department potentialParent) {
        Department current = potentialParent;
        while (current != null) {
            if (current.getId().equals(departmentId)) {
                return true;
            }
            current = current.getParentDepartment();
        }
        return false;
    }
}
