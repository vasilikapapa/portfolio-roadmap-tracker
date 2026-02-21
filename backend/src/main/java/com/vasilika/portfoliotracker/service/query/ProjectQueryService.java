package com.vasilika.portfoliotracker.service.query;

import com.vasilika.portfoliotracker.domain.enums.TaskPriority;
import com.vasilika.portfoliotracker.domain.enums.TaskStatus;
import com.vasilika.portfoliotracker.domain.enums.TaskType;
import com.vasilika.portfoliotracker.repo.ProjectRepository;
import com.vasilika.portfoliotracker.repo.TaskRepository;
import com.vasilika.portfoliotracker.repo.UpdateRepository;
import com.vasilika.portfoliotracker.web.dto.*;
import com.vasilika.portfoliotracker.web.mapper.ProjectMapper;
import com.vasilika.portfoliotracker.web.mapper.TaskMapper;
import com.vasilika.portfoliotracker.web.mapper.UpdateMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Locale;

/**
 * =========================================
 * Project Query Service
 * =========================================
 *
 * Handles read-only operations for:
 * - Listing projects
 * - Retrieving project details
 * - Filtering and paginating tasks
 * - Paginating project updates
 *
 * This service is typically used by public
 * (non-admin) endpoints.
 *
 * Separation of responsibilities:
 * - Admin service = write operations
 * - Query service = read operations
 */
@Service
public class ProjectQueryService {

    private final ProjectRepository projects;
    private final TaskRepository tasks;
    private final UpdateRepository updates;

    /**
     * Constructor injection for repositories.
     */
    public ProjectQueryService(ProjectRepository projects, TaskRepository tasks, UpdateRepository updates) {
        this.projects = projects;
        this.tasks = tasks;
        this.updates = updates;
    }

    /**
     * Returns all projects as DTOs.
     *
     * Used for:
     * - Portfolio overview page
     * - Public project listing
     */
    public java.util.List<ProjectDto> listProjects() {
        return projects.findAll()
                .stream()
                .map(ProjectMapper::toDto)
                .toList();
    }

    /**
     * Retrieves full project details by slug.
     *
     * Includes:
     * - All tasks (sorted by status + creation time)
     * - All updates (newest first)
     *
     * This version loads everything without pagination.
     */
    public ProjectDetailsDto getDetails(String slug) {

        var project = projects.findBySlug(slug).orElseThrow();

        // Sort tasks by:
        // 1. Status order
        // 2. Creation time (ascending)
        var taskDtos = tasks.findByProject_Id(project.getId()).stream()
                .sorted((a, b) -> {
                    int sa = a.getStatus().ordinal();
                    int sb = b.getStatus().ordinal();
                    if (sa != sb) return Integer.compare(sa, sb);
                    return a.getCreatedAt().compareTo(b.getCreatedAt());
                })
                .map(TaskMapper::toDto)
                .toList();

        // Updates sorted newest first
        var updateDtos = updates
                .findByProject_IdOrderByCreatedAtDesc(project.getId())
                .stream()
                .map(UpdateMapper::toDto)
                .toList();

        return new ProjectDetailsDto(
                ProjectMapper.toDto(project),
                taskDtos,
                updateDtos
        );
    }

    /**
     * Retrieves project details with pagination and optional filtering.
     *
     * Supports:
     * - Task filtering (status, type, priority)
     * - Pagination for tasks
     * - Pagination for updates
     *
     * Useful for:
     * - Large projects
     * - Infinite scroll
     * - API efficiency
     */
    public ProjectDetailsPagedDto getDetailsPaged(
            String slug,
            String status,
            String type,
            String priority,
            int tasksPage,
            int tasksSize,
            int updatesPage,
            int updatesSize
    ) {

        var project = projects.findBySlug(slug).orElseThrow();

        // Parse optional enum filters
        TaskStatus st = status == null ? null : parseEnum(TaskStatus.class, status);
        TaskType ty = type == null ? null : parseEnum(TaskType.class, type);
        TaskPriority pr = priority == null ? null : parseEnum(TaskPriority.class, priority);

        // Task pagination
        Pageable tp = PageRequest.of(tasksPage, tasksSize);
        var taskPage = tasks.findPagedForProject(project.getId(), st, ty, pr, tp);

        // Update pagination
        Pageable up = PageRequest.of(updatesPage, updatesSize);
        var updatePage = updates.findByProject_IdOrderByCreatedAtDesc(project.getId(), up);

        // Wrap task results into PageDto
        var tasksDto = new PageDto<>(
                taskPage.getContent().stream().map(TaskMapper::toDto).toList(),
                taskPage.getNumber(),
                taskPage.getSize(),
                taskPage.getTotalElements(),
                taskPage.getTotalPages(),
                taskPage.hasNext()
        );

        // Wrap update results into PageDto
        var updatesDto = new PageDto<>(
                updatePage.getContent().stream().map(UpdateMapper::toDto).toList(),
                updatePage.getNumber(),
                updatePage.getSize(),
                updatePage.getTotalElements(),
                updatePage.getTotalPages(),
                updatePage.hasNext()
        );

        return new ProjectDetailsPagedDto(
                ProjectMapper.toDto(project),
                tasksDto,
                updatesDto
        );
    }

    /**
     * Utility method to safely parse enum values.
     *
     * Normalizes:
     * - Trims whitespace
     * - Converts to uppercase
     * - Matches enum constants
     */
    private static <E extends Enum<E>> E parseEnum(Class<E> enumClass, String value) {
        return Enum.valueOf(enumClass, value.trim().toUpperCase(Locale.ROOT));
    }
}