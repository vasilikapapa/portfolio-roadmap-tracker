package com.vasilika.portfoliotracker.repo;

import com.vasilika.portfoliotracker.domain.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import com.vasilika.portfoliotracker.domain.enums.TaskPriority;
import com.vasilika.portfoliotracker.domain.enums.TaskStatus;
import com.vasilika.portfoliotracker.domain.enums.TaskType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

/**
 * =========================================
 * Task Repository
 * =========================================
 *
 * Spring Data JPA repository for Task entities.
 *
 * Responsibilities:
 * - Basic CRUD operations (provided by JpaRepository)
 * - Project-based task retrieval
 * - Filtering by status, type, priority
 * - Custom paginated query with sorting logic
 *
 * This repository supports both simple derived
 * queries and a custom JPQL query for flexible filtering.
 */
public interface TaskRepository extends JpaRepository<Task, UUID> {

    /**
     * Retrieve all tasks belonging to a project.
     */
    List<Task> findByProject_Id(UUID projectId);

    // ===== Optional filtering methods =====

    /**
     * Filter tasks by project and status.
     */
    List<Task> findByProject_IdAndStatus(UUID projectId, TaskStatus status);

    /**
     * Filter tasks by project and type.
     */
    List<Task> findByProject_IdAndType(UUID projectId, TaskType type);

    /**
     * Filter tasks by project and priority.
     */
    List<Task> findByProject_IdAndPriority(UUID projectId, TaskPriority priority);

    /**
     * Filter by project, status, and type.
     */
    List<Task> findByProject_IdAndStatusAndType(UUID projectId, TaskStatus status, TaskType type);

    /**
     * Filter by project, status, and priority.
     */
    List<Task> findByProject_IdAndStatusAndPriority(UUID projectId, TaskStatus status, TaskPriority priority);

    /**
     * Filter by project, type, and priority.
     */
    List<Task> findByProject_IdAndTypeAndPriority(UUID projectId, TaskType type, TaskPriority priority);

    /**
     * Filter by project, status, type, and priority.
     */
    List<Task> findByProject_IdAndStatusAndTypeAndPriority(
            UUID projectId,
            TaskStatus status,
            TaskType type,
            TaskPriority priority
    );

    /**
     * Custom paginated query with optional filters.
     *
     * Features:
     * - Supports pagination via Pageable
     * - Optional filtering:
     *   - status
     *   - type
     *   - priority
     * - Custom ordering:
     *   BACKLOG → IN_PROGRESS → DONE
     *   then by creation time ascending
     *
     * Useful for displaying roadmap tasks
     * in a structured development workflow.
     */
    @Query("""
      select t from Task t
      where t.project.id = :projectId
        and (:status is null or t.status = :status)
        and (:type is null or t.type = :type)
        and (:priority is null or t.priority = :priority)
      order by
        case
          when t.status = com.vasilika.portfoliotracker.domain.enums.TaskStatus.BACKLOG then 1
          when t.status = com.vasilika.portfoliotracker.domain.enums.TaskStatus.IN_PROGRESS then 2
          when t.status = com.vasilika.portfoliotracker.domain.enums.TaskStatus.DONE then 3
          else 99
        end,
        t.createdAt asc
    """)
    Page<Task> findPagedForProject(
            @Param("projectId") UUID projectId,
            @Param("status") TaskStatus status,
            @Param("type") TaskType type,
            @Param("priority") TaskPriority priority,
            Pageable pageable
    );

}