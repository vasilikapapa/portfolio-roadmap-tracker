package com.vasilika.portfoliotracker.web.dto;

import jakarta.validation.constraints.Size;
/**
 * DTO used for partially updating a Task.
 *
 * This supports:
 * - Moving task between statuses (Kanban board behavior)
 * - Updating priority/type
 * - Editing title/description
 */
public record UpdateTaskRequest(
        @Size(max = 200) String title,
        String description,
        String status,        // BACKLOG | IN_PROGRESS | DONE
        String type,          // FEATURE | BUG | REFACTOR
        String priority,      // LOW | MEDIUM | HIGH
        @Size(max = 40) String targetVersion
) {}
