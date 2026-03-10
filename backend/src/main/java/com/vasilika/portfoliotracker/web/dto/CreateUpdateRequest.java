package com.vasilika.portfoliotracker.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * =========================================
 * Create Update Request DTO
 * =========================================
 *
 * Used when creating a new project update.
 *
 *
 * - taskId is optional.
 * - If provided, the backend will attach the update
 *   to that task after validating that the task belongs
 *   to the same project.
 */
public record CreateUpdateRequest(

        /**
         * Optional related task.
         * Null means this is a project-level update.
         */
        UUID taskId,

        /**
         * Short title describing the update.
         */
        @NotBlank
        @Size(max = 200)
        String title,

        /**
         * Main update content.
         */
        @NotBlank
        String body
) {}