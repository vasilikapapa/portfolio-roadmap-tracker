package com.vasilika.portfoliotracker.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTaskRequest(
        @NotBlank @Size(max = 200) String title,
        String description,
        @NotNull String status,    // BACKLOG | IN_PROGRESS | DONE
        @NotNull String type,      // FEATURE | BUG | REFACTOR
        @NotNull String priority,  // LOW | MEDIUM | HIGH
        @Size(max = 40) String targetVersion
) {}
