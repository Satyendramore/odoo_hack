package com.assetflow.service;

import com.assetflow.dto.AssetCategoryRequest;
import com.assetflow.dto.AssetCategoryResponse;
import com.assetflow.entity.AssetCategory;
import com.assetflow.exception.CategoryNotFoundException;
import com.assetflow.exception.InvalidRoleAssignmentException;
import com.assetflow.repository.AssetCategoryRepository;
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
public class AssetCategoryService {

    private final AssetCategoryRepository assetCategoryRepository;

    @Transactional
    public AssetCategoryResponse create(AssetCategoryRequest request) {
        // Validate name uniqueness (case-insensitive)
        if (assetCategoryRepository.existsByNameIgnoreCase(request.name())) {
            throw new InvalidRoleAssignmentException("Asset category with name '" + request.name() + "' already exists");
        }

        AssetCategory category = AssetCategory.builder()
                .name(request.name())
                .customFields(request.customFields())
                .build();

        AssetCategory saved = assetCategoryRepository.save(category);
        log.info("Asset category created: {}", saved.getId());
        return mapToResponse(saved);
    }

    @Transactional
    public AssetCategoryResponse update(UUID id, AssetCategoryRequest request) {
        AssetCategory category = assetCategoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Asset category with ID " + id + " not found"));

        // Validate name uniqueness if name is being changed
        if (!category.getName().equalsIgnoreCase(request.name()) &&
                assetCategoryRepository.existsByNameIgnoreCase(request.name())) {
            throw new InvalidRoleAssignmentException("Asset category with name '" + request.name() + "' already exists");
        }

        category.setName(request.name());
        category.setCustomFields(request.customFields());

        AssetCategory updated = assetCategoryRepository.save(category);
        log.info("Asset category updated: {}", updated.getId());
        return mapToResponse(updated);
    }

    @Transactional
    public void delete(UUID id) {
        AssetCategory category = assetCategoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Asset category with ID " + id + " not found"));

        assetCategoryRepository.delete(category);
        log.info("Asset category deleted: {}", id);
    }

    @Transactional(readOnly = true)
    public List<AssetCategoryResponse> getAll() {
        return assetCategoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AssetCategoryResponse getById(UUID id) {
        AssetCategory category = assetCategoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Asset category with ID " + id + " not found"));
        return mapToResponse(category);
    }

    private AssetCategoryResponse mapToResponse(AssetCategory category) {
        return new AssetCategoryResponse(
                category.getId(),
                category.getName(),
                category.getCustomFields()
        );
    }
}
