package com.vasilika.portfoliotracker.repo;

import com.vasilika.portfoliotracker.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * ProjectRepository
 *
 * Data access layer for {@link Project} entities.
 *
 * Extends {@link JpaRepository} to provide:
 * - Basic CRUD operations
 * - Pagination and sorting
 * - Integration with Spring Data JPA query generation
 */
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    /**
     * Finds a project by its unique slug.
     *
     * Slugs are used instead of UUIDs for cleaner, user-friendly URLs.
     *
     * @param slug unique project identifier
     * @return an Optional containing the project if found, or empty if not
     */
    Optional<Project> findBySlug(String slug);
}
