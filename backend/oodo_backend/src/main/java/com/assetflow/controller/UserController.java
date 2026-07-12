package com.assetflow.controller;

import com.assetflow.dto.EmployeeResponse;
import com.assetflow.dto.RolePromotionRequest;
import com.assetflow.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/employees")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<EmployeeResponse>> getAllEmployees() {
        List<EmployeeResponse> employees = userService.getAllEmployees();
        return ResponseEntity.ok(employees);
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<EmployeeResponse> promoteRole(@PathVariable UUID id, @Valid @RequestBody RolePromotionRequest request) {
        EmployeeResponse employee = userService.promoteRole(id, request);
        return ResponseEntity.ok(employee);
    }
}
