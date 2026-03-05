package com.vasilika.portfoliotracker.web;

import com.vasilika.portfoliotracker.service.query.ProjectQueryService;
import com.vasilika.portfoliotracker.web.dto.ProjectDetailsDto;
import com.vasilika.portfoliotracker.web.dto.ProjectDetailsPagedDto;
import com.vasilika.portfoliotracker.web.dto.ProjectDto;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * =========================================
 * Public Projects Controller
 * =========================================
 *
 * Exposes public READ-ONLY endpoints for projects.
 *
 * IMPORTANT SECURITY / PRODUCT RULE
 * -----------------------------------
 * This controller must NEVER return DEMO sandbox projects.
 *
 * Demo projects are only accessible through /demo/** endpoints
 * and require a DEMO token. This ensures:
 * - Demo users can freely edit demo data without affecting real data
 *
 * Base path:
 *   /api/projects
 */
@RestController
@RequestMapping("/api/projects")
public class PublicProjectsController {

    private final ProjectQueryService query;

    /**
     * Constructor injection of query service.
     */
    public PublicProjectsController(ProjectQueryService query) {
        this.query = query;
    }

    /**
     * Returns all PUBLIC portfolio projects (demo projects are excluded).
     *
     * HTTP Method: GET
     * Endpoint: /api/projects
     *
     * Used for:
     * - Portfolio homepage
     * - Public project listings
     */
    @GetMapping
    public List<ProjectDto> list() {
        // Only real portfolio projects (demo=false)
        return query.listPublicProjects();
    }

    /**
     * Returns full PUBLIC project details by slug (demo projects are excluded).
     *
     * HTTP Method: GET
     * Endpoint: /api/projects/{slug}
     *
     * Includes:
     * - Project info
     * - All tasks
     * - All updates
     */
    @GetMapping("/{slug}")
    public ProjectDetailsDto details(@PathVariable String slug) {
        // Only real portfolio projects (demo=false)
        return query.getPublicDetails(slug);
    }

    /**
     * Returns PUBLIC project details with pagination and optional filtering.
     * Demo projects are excluded.
     *
     * HTTP Method: GET
     * Endpoint: /api/projects/{slug}/paged
     *
     * Supports:
     * - Task filtering by status, type, priority
     * - Pagination for tasks and updates
     *
     * Default pagination:
     * - Tasks: page 0, size 10
     * - Updates: page 0, size 5
     */
    @GetMapping("/{slug}/paged")
    public ProjectDetailsPagedDto detailsPaged(
            @PathVariable String slug,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String priority,
            @RequestParam(defaultValue = "0") int tasksPage,
            @RequestParam(defaultValue = "10") int tasksSize,
            @RequestParam(defaultValue = "0") int updatesPage,
            @RequestParam(defaultValue = "5") int updatesSize
    ) {
        // Only real portfolio projects (demo=false)
        return query.getPublicDetailsPaged(
                slug,
                status,
                type,
                priority,
                tasksPage,
                tasksSize,
                updatesPage,
                updatesSize
        );
    }
}