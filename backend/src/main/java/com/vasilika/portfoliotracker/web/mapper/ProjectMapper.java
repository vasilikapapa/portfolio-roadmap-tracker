package com.vasilika.portfoliotracker.web.mapper;

import com.vasilika.portfoliotracker.domain.Project;
import com.vasilika.portfoliotracker.web.dto.ProjectDto;

public class ProjectMapper {
    private ProjectMapper() {}

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
