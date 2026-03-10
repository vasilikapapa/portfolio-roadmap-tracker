package com.vasilika.portfoliotracker.web.mapper;

import com.vasilika.portfoliotracker.domain.Update;
import com.vasilika.portfoliotracker.web.dto.UpdateDto;

/**
 * Maps Update entities into API DTOs.
 */
public class UpdateMapper {

    private UpdateMapper() {}

    public static UpdateDto toDto(Update u) {
        return new UpdateDto(
                u.getId(),
                u.getProject().getId(),
                u.getTask() != null ? u.getTask().getId() : null,
                u.getTask() != null ? u.getTask().getTitle() : null,
                u.getTitle(),
                u.getBody(),
                u.getCreatedAt()
        );
    }
}