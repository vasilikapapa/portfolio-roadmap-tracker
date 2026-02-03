package com.vasilika.portfoliotracker.web.dto;

import jakarta.validation.constraints.Size;

public record UpdateTaskRequest(
        @Size(max = 200) String title,
        String description,
        String status,        // BACKLOG | IN_PROGRESS | DONE
        String type,          // FEATURE | BUG | REFACTOR
        String priority,      // LOW | MEDIUM | HIGH
        @Size(max = 40) String targetVersion
) {}
