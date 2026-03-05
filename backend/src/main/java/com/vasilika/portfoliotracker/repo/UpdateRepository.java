package com.vasilika.portfoliotracker.repo;

import com.vasilika.portfoliotracker.domain.Update;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

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
 * - Basic CRUD operations (via JpaRepository)
 * - Retrieve updates by project
 * - Sort newest-first for timeline views
 * - Support pagination for long update histories
 *
 * NOTE:
 * - We do NOT use tenantKey here because your entities
 *   do not contain tenantKey.
 * - Demo separation is handled at the Project level via Project.demo.
 */
public interface UpdateRepository extends JpaRepository<Update, UUID> {

    /**
     * Retrieve all updates for a specific project (no explicit sort).
     */
    List<Update> findByProject_Id(UUID projectId);

    /**
     * Retrieve all updates for a project ordered by newest first.
     */
    List<Update> findByProject_IdOrderByCreatedAtDesc(UUID projectId);

    /**
     * Paginated version of newest-first query.
     */
    Page<Update> findByProject_IdOrderByCreatedAtDesc(UUID projectId, Pageable pageable);

    /**
    * For reset
     */
    List<Update> findAllByProject_DemoTrue();
}