package com.vasilika.portfoliotracker.service.query;

import com.vasilika.portfoliotracker.domain.Project;
import com.vasilika.portfoliotracker.domain.enums.TaskPriority;
import com.vasilika.portfoliotracker.domain.enums.TaskStatus;
import com.vasilika.portfoliotracker.repo.ProjectRepository;
import com.vasilika.portfoliotracker.repo.TaskRepository;
import com.vasilika.portfoliotracker.repo.UpdateRepository;
import com.vasilika.portfoliotracker.service.TaskTypeOptionService;
import com.vasilika.portfoliotracker.web.dto.PageDto;
import com.vasilika.portfoliotracker.web.dto.ProjectDetailsDto;
import com.vasilika.portfoliotracker.web.dto.ProjectDetailsPagedDto;
import com.vasilika.portfoliotracker.web.dto.ProjectDto;
import com.vasilika.portfoliotracker.web.mapper.ProjectMapper;
import com.vasilika.portfoliotracker.web.mapper.TaskMapper;
import com.vasilika.portfoliotracker.web.mapper.UpdateMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

/**
 * =========================================
 * Project Query Service
 * =========================================
 *
 * Handles READ-ONLY operations for projects:
 * - Listing projects
 * - Retrieving project details
 * - Filtering and paginating tasks
 * - Paginating updates
 *
 * IMPORTANT: This service supports TWO "tenants":
 * -------------------------------------------------
 * 1) Public portfolio data (demo=false)
 * 2) Demo sandbox data (demo=true)
 *
 * We keep these separate so:
 * - Demo users can freely CRUD without touching real data
 *
 * Separation of responsibilities:
 * - Admin services/controllers = write operations for real projects
 * - Demo controllers/services  = write operations for demo sandbox
 * - Query service              = read operations for both, via explicit methods
 */
@Service
public class ProjectQueryService {

    private final ProjectRepository projects;
    private final TaskRepository tasks;
    private final UpdateRepository updates;
    private final TaskTypeOptionService taskTypeOptionService;

    /**
     * Constructor injection for repositories.
     */
    public ProjectQueryService(
            ProjectRepository projects,
            TaskRepository tasks,
            UpdateRepository updates,
            TaskTypeOptionService taskTypeOptionService
    ) {
        this.projects = projects;
        this.tasks = tasks;
        this.updates = updates;
        this.taskTypeOptionService = taskTypeOptionService;
    }

    // =========================================================
    // PUBLIC (REAL PORTFOLIO) READS  -> demo=false
    // =========================================================

    /**
     * Returns all PUBLIC portfolio projects (demo projects excluded).
     *
     * Used for:
     * - Portfolio overview page
     * - Public project listing
     */
    public List<ProjectDto> listPublicProjects() {
        return projects.findAllByDemoFalseOrderByCreatedAtDesc()
                .stream()
                .map(ProjectMapper::toDto)
                .toList();
    }

    /**
     * Retrieves PUBLIC project details by slug (demo projects excluded).
     *
     * Includes:
     * - All tasks (sorted by status + creation time)
     * - All updates (newest first)
     *
     * This version loads everything without pagination.
     */
    public ProjectDetailsDto getPublicDetails(String slug) {
        Project project = requireProjectBySlugAndDemo(slug, false);

        // Sort tasks by:
        // 1) Status order
        // 2) Creation time (ascending)
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
     * Retrieves PUBLIC project details with pagination and optional task filtering.
     *
     * Supports:
     * - Task filtering (status, type, priority)
     * - Pagination for tasks
     * - Pagination for updates
     */
    public ProjectDetailsPagedDto getPublicDetailsPaged(
            String slug,
            String status,
            String type,
            String priority,
            int tasksPage,
            int tasksSize,
            int updatesPage,
            int updatesSize
    ) {
        Project project = requireProjectBySlugAndDemo(slug, false);

        // Parse optional filters
        TaskStatus st = status == null ? null : parseEnum(TaskStatus.class, status);
        String ty = type == null ? null : taskTypeOptionService.requireValidCode(type);
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

    // =========================================================
    // DEMO (SANDBOX) READS -> demo=true
    // =========================================================
    // These are used by /demo/** endpoints (protected by ROLE_DEMO).
    // You can keep your demo controllers simple and call these.

    /**
     * Returns all DEMO sandbox projects (only demo=true).
     * Useful for a demo-only projects list page if you want one.
     */
    public List<ProjectDto> listDemoProjects() {
        return projects.findAllByDemoTrueOrderByCreatedAtDesc()
                .stream()
                .map(ProjectMapper::toDto)
                .toList();
    }

    /**
     * Returns demo project details by slug (demo=true).
     * Same shape as public details.
     */
    public ProjectDetailsDto getDemoDetails(String slug) {
        Project project = requireProjectBySlugAndDemo(slug, true);

        var taskDtos = tasks.findByProject_Id(project.getId()).stream()
                .sorted((a, b) -> {
                    int sa = a.getStatus().ordinal();
                    int sb = b.getStatus().ordinal();
                    if (sa != sb) return Integer.compare(sa, sb);
                    return a.getCreatedAt().compareTo(b.getCreatedAt());
                })
                .map(TaskMapper::toDto)
                .toList();

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
     * Returns demo project details with pagination and filtering (demo=true).
     */
    public ProjectDetailsPagedDto getDemoDetailsPaged(
            String slug,
            String status,
            String type,
            String priority,
            int tasksPage,
            int tasksSize,
            int updatesPage,
            int updatesSize
    ) {
        Project project = requireProjectBySlugAndDemo(slug, true);

        TaskStatus st = status == null ? null : parseEnum(TaskStatus.class, status);
        String ty = type == null ? null : taskTypeOptionService.requireValidCode(type);
        TaskPriority pr = priority == null ? null : parseEnum(TaskPriority.class, priority);

        Pageable tp = PageRequest.of(tasksPage, tasksSize);
        var taskPage = tasks.findPagedForProject(project.getId(), st, ty, pr, tp);

        Pageable up = PageRequest.of(updatesPage, updatesSize);
        var updatePage = updates.findByProject_IdOrderByCreatedAtDesc(project.getId(), up);

        var tasksDto = new PageDto<>(
                taskPage.getContent().stream().map(TaskMapper::toDto).toList(),
                taskPage.getNumber(),
                taskPage.getSize(),
                taskPage.getTotalElements(),
                taskPage.getTotalPages(),
                taskPage.hasNext()
        );

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

    // =========================================================
    // Helpers
    // =========================================================

    /**
     * Loads a project by (slug, demo flag) or throws if missing.
     *
     * This is the core rule that prevents public APIs from leaking demo data.
     */
    private Project requireProjectBySlugAndDemo(String slug, boolean demo) {
        return projects.findBySlugAndDemo(slug, demo)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + slug));
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