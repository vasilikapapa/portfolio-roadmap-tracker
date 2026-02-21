package com.vasilika.portfoliotracker.repo;

import com.vasilika.portfoliotracker.domain.Update;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * =========================================
 * Update Repository
 * =========================================
 *
 * Spring Data JPA repository for Update entities.
 *
 * Responsibilities:
 * - Basic CRUD operations (inherited from JpaRepository)
 * - Retrieve project-specific updates
 * - Sort updates by newest first
 * - Support pagination for update feeds
 *
 * Designed for:
 * - Project dev logs
 * - Release notes
 * - Progress tracking timeline
 */
public interface UpdateRepository extends JpaRepository<Update, UUID> {

    /**
     * Retrieve all updates for a specific project.
     * No explicit sorting applied.
     */
    List<Update> findByProject_Id(UUID projectId);

    /**
     * Retrieve all updates for a project,
     * ordered by newest first.
     *
     * Useful for displaying recent dev logs.
     */
    List<Update> findByProject_IdOrderByCreatedAtDesc(UUID projectId);

    /**
     * Paginated version of newest-first query.
     *
     * Supports:
     * - Large update history
     * - Timeline-style UI
     * - Infinite scroll or paged responses
     */
    Page<Update> findByProject_IdOrderByCreatedAtDesc(UUID projectId, Pageable pageable);

}