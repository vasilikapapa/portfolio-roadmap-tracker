package com.vasilika.portfoliotracker.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * =========================================
 * Create Update Request DTO
 * =========================================
 *
 * Data Transfer Object used when creating
 * a new project update (dev log, release note,
 * or progress update).
 *
 * Includes validation rules to ensure:
 * - Required fields are provided
 * - Input size is controlled
 *
 * This helps maintain API input validation
 * separate from persistence entities.
 */
public record CreateUpdateRequest(

        /**
         * Short title describing the update.
         * Required field.
         *
         * Example:
         * "Added authentication module"
         */
        @NotBlank
        @Size(max = 200)
        String title,

        /**
         * Main update content.
         * Required field.
         *
         * Typically includes:
         * - Development progress
         * - Feature descriptions
         * - Bug fixes
         * - Release notes
         */
        @NotBlank
        String body

) {}