package com.vasilika.portfoliotracker.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * =========================================
 * Create Project Request DTO
 * =========================================
 *
 * Data Transfer Object used when creating
 * a new project via API.
 *
 * Includes validation rules to ensure:
 * - Required fields are provided
 * - Input length constraints are enforced
 *
 * This DTO keeps API input separated
 * from database entity models.
 */
public record CreateProjectRequest(

        /**
         * Unique project identifier (URL-friendly).
         * Example: "portfolio-tracker"
         *
         * Required field.
         */
        @NotBlank
        @Size(max = 120)
        String slug,

        /**
         * Project display name.
         * Required field.
         */
        @NotBlank
        @Size(max = 200)
        String name,

        /**
         * Short summary of the project.
         * Optional field.
         */
        @Size(max = 500)
        String summary,

        /**
         * Detailed project description.
         * Can include technical explanations,
         * goals, or feature overview.
         */
        String description,

        /**
         * Technology stack used in the project.
         * Example: "Spring Boot, React, PostgreSQL"
         */
        String techStack,

        /**
         * Link to project source repository.
         */
        String repoUrl,

        /**
         * Link to live deployed project (if available).
         */
        String liveUrl

) {}