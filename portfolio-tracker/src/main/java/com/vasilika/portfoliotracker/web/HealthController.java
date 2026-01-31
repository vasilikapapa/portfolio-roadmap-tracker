package com.vasilika.portfoliotracker.web;

import com.vasilika.portfoliotracker.repo.ProjectRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * HealthController
 *
 * Lightweight controller used to verify:
 * - The application is running
 * - The database connection is working
 * - Spring Data JPA repositories are properly wired
 *
 * This endpoint is intentionally simple and public.
 * It is useful for local development, monitoring, and deployment health checks.
 */
@RestController
public class HealthController {

    /**
     * Repository dependency used to verify database connectivity.
     * If this bean is created successfully, JPA and the datasource are working.
     */
    private final ProjectRepository projectRepository;

    /**
     * Constructor-based dependency injection (recommended approach).
     */
    public HealthController(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    /**
     * Health check endpoint.
     *
     * @return a simple JSON response indicating application status
     *         and current number of projects in the database.
     */
    @GetMapping("/health")
    public Map<String, Object> health() {
        long projects = projectRepository.count();

        return Map.of(
                "status", "ok",
                "projectsCount", projects
        );
    }
}
