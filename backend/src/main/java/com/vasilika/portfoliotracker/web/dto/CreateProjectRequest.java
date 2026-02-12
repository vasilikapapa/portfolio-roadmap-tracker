package com.vasilika.portfoliotracker.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(
        @NotBlank @Size(max = 120) String slug,
        @NotBlank @Size(max = 200) String name,
        @Size(max = 500) String summary,
        String description,
        String techStack,
        String repoUrl,
        String liveUrl
) {}
