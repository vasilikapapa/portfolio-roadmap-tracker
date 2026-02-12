package com.vasilika.portfoliotracker.web.mapper;

import com.vasilika.portfoliotracker.domain.Task;
import com.vasilika.portfoliotracker.web.dto.TaskDto;

public class TaskMapper {
    private TaskMapper() {}

    public static TaskDto toDto(Task t) {
        return new TaskDto(
                t.getId(),
                t.getProject().getId(),
                t.getTitle(),
                t.getDescription(),
                t.getStatus().name(),
                t.getType().name(),
                t.getPriority().name(),
                t.getTargetVersion(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
