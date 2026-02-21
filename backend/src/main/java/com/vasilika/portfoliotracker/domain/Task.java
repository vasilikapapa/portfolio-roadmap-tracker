package com.vasilika.portfoliotracker.domain;

import com.vasilika.portfoliotracker.domain.enums.TaskPriority;
import com.vasilika.portfoliotracker.domain.enums.TaskStatus;
import com.vasilika.portfoliotracker.domain.enums.TaskType;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * =========================================
 * Task Entity
 * =========================================
 *
 * Represents a development task within a project.
 *
 * Example use cases:
 * - Feature roadmap tracking
 * - Bug tracking
 * - Refactoring plans
 * - Release/version planning
 *
 * Each task belongs to exactly one Project.
 */
@Entity
@Table(name = "tasks")
public class Task {

    /**
     * Unique identifier for the task.
     * Stored as UUID for scalability and distributed systems.
     */
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    /**
     * Many-to-one relationship with Project.
     *
     * LAZY fetch:
     * - Project data is loaded only when needed
     * - Improves performance when listing tasks.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /**
     * Short descriptive title of the task.
     * Required field.
     */
    @Column(nullable = false, length = 200)
    private String title;

    /**
     * Optional detailed description.
     * Stored as TEXT for longer content.
     */
    @Column(columnDefinition = "text")
    private String description;

    /**
     * Current status of the task:
     * Examples:
     * - BACKLOG
     * - IN_PROGRESS
     * - DONE
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status;

    /**
     * Type/category of task:
     * Examples:
     * - FEATURE
     * - BUG
     * - REFACTOR
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskType type;

    /**
     * Priority level of task.
     * Helps with planning and ordering work.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskPriority priority;

    /**
     * Optional version target (e.g., v1.1, v2.0).
     * Useful for release planning.
     */
    @Column(name = "target_version", length = 40)
    private String targetVersion;

    /**
     * Timestamp when task was created.
     * Stored as UTC Instant.
     */
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    /**
     * Timestamp of last update.
     * Should be updated whenever task changes.
     */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // ===== Getters and Setters =====

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public TaskType getType() { return type; }
    public void setType(TaskType type) { this.type = type; }

    public TaskPriority getPriority() { return priority; }
    public void setPriority(TaskPriority priority) { this.priority = priority; }

    public String getTargetVersion() { return targetVersion; }
    public void setTargetVersion(String targetVersion) { this.targetVersion = targetVersion; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}