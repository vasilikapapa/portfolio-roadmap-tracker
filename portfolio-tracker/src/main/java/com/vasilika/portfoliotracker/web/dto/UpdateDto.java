package com.vasilika.portfoliotracker.web.dto;

import java.time.Instant;
import java.util.UUID;

public record UpdateDto(
        UUID id,
        UUID projectId,
        String title,
        String body,
        Instant createdAt
) {}
