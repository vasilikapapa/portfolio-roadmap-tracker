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

public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByProject_Id(UUID projectId);

    // filters (optional)
    List<Task> findByProject_IdAndStatus(UUID projectId, TaskStatus status);

    List<Task> findByProject_IdAndType(UUID projectId, TaskType type);

    List<Task> findByProject_IdAndPriority(UUID projectId, TaskPriority priority);

    List<Task> findByProject_IdAndStatusAndType(UUID projectId, TaskStatus status, TaskType type);

    List<Task> findByProject_IdAndStatusAndPriority(UUID projectId, TaskStatus status, TaskPriority priority);

    List<Task> findByProject_IdAndTypeAndPriority(UUID projectId, TaskType type, TaskPriority priority);

    List<Task> findByProject_IdAndStatusAndTypeAndPriority(UUID projectId, TaskStatus status, TaskType type, TaskPriority priority);

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



