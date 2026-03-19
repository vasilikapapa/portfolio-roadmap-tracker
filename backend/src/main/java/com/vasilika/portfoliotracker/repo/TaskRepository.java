package com.vasilika.portfoliotracker.repo;

import com.vasilika.portfoliotracker.domain.Task;
import com.vasilika.portfoliotracker.domain.enums.TaskPriority;
import com.vasilika.portfoliotracker.domain.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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
 * - Basic CRUD operations (via JpaRepository)
 * - Retrieve tasks by project
 * - Optional filtering by status/type/priority
 * - Paginated query for Kanban-style task boards
 *
 * NOTE:
 * - We do NOT use tenantKey here because your entities
 *   do not contain tenantKey.
 * - Demo separation is handled at the Project level via Project.demo.
 *
 * IMPORTANT:
 * - Task type is now configurable and stored as a String code
 *   (examples: FEATURE, BUG, CHORE, DOCUMENTATION)
 * - Because of that, all repository methods now use String for type
 *   instead of a TaskType enum.
 */
public interface TaskRepository extends JpaRepository<Task, UUID> {

    /**
     * Retrieve all tasks belonging to a project.
     */
    List<Task> findByProject_Id(UUID projectId);

    // ===== Optional derived filtering queries (handy for services) =====

    List<Task> findByProject_IdAndStatus(UUID projectId, TaskStatus status);

    List<Task> findByProject_IdAndType(UUID projectId, String type);

    List<Task> findByProject_IdAndPriority(UUID projectId, TaskPriority priority);

    List<Task> findByProject_IdAndStatusAndType(UUID projectId, TaskStatus status, String type);

    List<Task> findByProject_IdAndStatusAndPriority(UUID projectId, TaskStatus status, TaskPriority priority);

    List<Task> findByProject_IdAndTypeAndPriority(UUID projectId, String type, TaskPriority priority);

    List<Task> findByProject_IdAndStatusAndTypeAndPriority(
            UUID projectId,
            TaskStatus status,
            String type,
            TaskPriority priority
    );

    /**
     * Custom paginated query with optional filters.
     *
     * Features:
     * - Optional filtering by status/type/priority
     * - Orders by Kanban column order:
     *   BACKLOG -> IN_PROGRESS -> DONE
     * - Then by creation time ascending (stable ordering in each column)
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
            @Param("type") String type,
            @Param("priority") TaskPriority priority,
            Pageable pageable
    );

    /**
     * Used by demo reset flow.
     */
    List<Task> findAllByProject_DemoTrue();
}