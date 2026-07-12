package com.assetflow.service;

import com.assetflow.dto.EmployeeResponse;
import com.assetflow.dto.RolePromotionRequest;
import com.assetflow.entity.User;
import com.assetflow.enums.Role;
import com.assetflow.exception.InvalidRoleAssignmentException;
import com.assetflow.exception.UserNotFoundException;
import com.assetflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees() {
        return userRepository.findAll().stream()
                .map(this::mapToEmployeeResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmployeeResponse promoteRole(UUID userId, RolePromotionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User with ID " + userId + " not found"));

        // Restrict role promotion to ASSET_MANAGER or DEPARTMENT_HEAD only
        // ADMIN role promotion and EMPLOYEE role assignment must never happen through this endpoint
        // This is the ONLY place in the entire application where a role above EMPLOYEE is ever assigned
        if (request.role() == Role.ADMIN) {
            throw new InvalidRoleAssignmentException("Cannot promote user to ADMIN role through this endpoint");
        }

        if (request.role() == Role.EMPLOYEE) {
            throw new InvalidRoleAssignmentException("EMPLOYEE is the default role and cannot be assigned through promotion");
        }

        if (request.role() != Role.ASSET_MANAGER && request.role() != Role.DEPARTMENT_HEAD) {
            throw new InvalidRoleAssignmentException("Only ASSET_MANAGER and DEPARTMENT_HEAD roles can be assigned");
        }

        user.setRole(request.role());
        User updated = userRepository.save(user);
        log.info("User {} promoted to role: {}", userId, request.role());
        return mapToEmployeeResponse(updated);
    }

    private EmployeeResponse mapToEmployeeResponse(User user) {
        return new EmployeeResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getDepartment() != null ? user.getDepartment().getName() : null,
                user.getDepartment() != null ? user.getDepartment().getId() : null,
                user.getStatus()
        );
    }
}
