package com.vasilika.portfoliotracker.web.dto;

import jakarta.validation.constraints.Size;

/**
 * DTO used for partially updating a Project.
 *
 * All fields are optional.
 * Only non-null values will be applied in the controller.
 *
 * This allows PATCH-style updates instead of full replacements.
 */
public record UpdateProjectRequest(


        @Size(max = 120)          // Unique URL slug (must remain unique across projects)
        String slug,

        @Size(max = 200)          // Human-readable project name
        String name,

        @Size(max = 500)          // Short summary shown in project list
        String summary,

        String description,        // Longer markdown/text description

        String techStack,           // Comma-separated tech stack

        String repoUrl,            // GitHub or repository link

        String liveUrl              // Live deployed application link
) {}
