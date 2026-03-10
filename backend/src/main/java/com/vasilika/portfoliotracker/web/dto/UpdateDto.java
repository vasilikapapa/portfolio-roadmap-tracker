package com.vasilika.portfoliotracker.web.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO returned to the frontend for project updates.
 *
 *
 * - taskId lets the UI group updates by task
 * - taskTitle helps the UI render the task label
 *   without having to look it up separately
 */
public record UpdateDto(
        UUID id,
        UUID projectId,
        UUID taskId,
        String taskTitle,
        String title,
        String body,
        Instant createdAt
) {}