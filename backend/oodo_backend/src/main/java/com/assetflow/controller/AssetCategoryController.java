package com.assetflow.controller;

import com.assetflow.dto.AssetCategoryRequest;
import com.assetflow.dto.AssetCategoryResponse;
import com.assetflow.service.AssetCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AssetCategoryController {

    private final AssetCategoryService assetCategoryService;

    @PostMapping
    public ResponseEntity<AssetCategoryResponse> create(@Valid @RequestBody AssetCategoryRequest request) {
        AssetCategoryResponse response = assetCategoryService.create(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetCategoryResponse> update(@PathVariable UUID id, @Valid @RequestBody AssetCategoryRequest request) {
        AssetCategoryResponse response = assetCategoryService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        assetCategoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<AssetCategoryResponse>> getAll() {
        List<AssetCategoryResponse> categories = assetCategoryService.getAll();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetCategoryResponse> getById(@PathVariable UUID id) {
        AssetCategoryResponse category = assetCategoryService.getById(id);
        return ResponseEntity.ok(category);
    }
}
