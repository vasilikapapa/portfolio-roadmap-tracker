package com.vasilika.portfoliotracker.web.mapper;

import com.vasilika.portfoliotracker.domain.PlanningItem;
import com.vasilika.portfoliotracker.web.dto.PlanningItemDto;

/**
 * Maps PlanningItem entities into API DTOs.
 */
public class PlanningItemMapper {

    private PlanningItemMapper() {}

    public static PlanningItemDto toDto(PlanningItem item) {
        return new PlanningItemDto(
                item.getId(),
                item.getProject().getId(),
                item.getTask().getId(),
                item.getTask().getTitle(),
                item.getTask().getDescription(),
                item.getTask().getStatus().name(),
                item.getTask().getType().name(),
                item.getTask().getPriority().name(),
                item.getTask().getTargetVersion(),
                item.getSortOrder(),
                item.isCurrent(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}