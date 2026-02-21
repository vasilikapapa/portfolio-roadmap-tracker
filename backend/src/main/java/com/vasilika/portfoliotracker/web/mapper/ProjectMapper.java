package com.vasilika.portfoliotracker.web.mapper;

import com.vasilika.portfoliotracker.domain.Project;
import com.vasilika.portfoliotracker.web.dto.ProjectDto;

/**
 * =========================================
 * Project Mapper
 * =========================================
 *
 * Utility class responsible for converting
 * Project entity objects into ProjectDto
 * objects for API responses.
 *
 * Purpose:
 * - Keep entity → DTO mapping centralized
 * - Avoid exposing JPA entities directly
 * - Maintain clean separation between
 *   persistence and API layers
 */
public class ProjectMapper {

    /**
     * Private constructor prevents instantiation.
     * This class is intended to be used statically.
     */
    private ProjectMapper() {}

    /**
     * Converts a Project entity into a ProjectDto.
     *
     * Used when returning project data from the API.
     */
    public static ProjectDto toDto(Project p) {
        return new ProjectDto(
                p.getId(),
                p.getSlug(),
                p.getName(),
                p.getSummary(),
                p.getDescription(),
                p.getTechStack(),
                p.getRepoUrl(),
                p.getLiveUrl(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}