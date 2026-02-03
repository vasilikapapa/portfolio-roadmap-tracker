
package com.vasilika.portfoliotracker.web.dto;

import java.time.Instant;
import java.util.UUID;

public record TaskDto(
        UUID id,
        UUID projectId,
        String title,
        String description,
        String status,
        String type,
        String priority,
        String targetVersion,
        Instant createdAt,
        Instant updatedAt
) {}
