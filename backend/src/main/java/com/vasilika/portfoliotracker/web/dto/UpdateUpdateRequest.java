package com.vasilika.portfoliotracker.web.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Partial update request for an existing update.
 *
 * taskId:
 * - null = general project update
 * - UUID = related task
 */
public record UpdateUpdateRequest(
        UUID taskId,
        String title,
        String body
) {}