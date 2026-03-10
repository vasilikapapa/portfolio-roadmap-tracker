package com.vasilika.portfoliotracker.web.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for one planning board item.
 */
public record PlanningItemDto(
        UUID id,
        UUID projectId,
        UUID taskId,
        String taskTitle,
        String taskDescription,
        String taskStatus,
        String taskType,
        String taskPriority,
        String targetVersion,
        int sortOrder,
        boolean isCurrent,
        Instant createdAt,
        Instant updatedAt
) {}