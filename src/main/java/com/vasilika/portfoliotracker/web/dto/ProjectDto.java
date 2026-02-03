package com.vasilika.portfoliotracker.web.dto;

import java.time.Instant;
import java.util.UUID;

public record ProjectDto(
        UUID id,
        String slug,
        String name,
        String summary,
        String description,
        String techStack,
        String repoUrl,
        String liveUrl,
        Instant createdAt,
        Instant updatedAt
) {}
