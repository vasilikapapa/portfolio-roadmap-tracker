package com.vasilika.portfoliotracker.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * =========================================================
 * PlanningItem
 * =========================================================
 *
 * Represents one task placed in a project's development
 * planning queue.
 *
 * Purpose:
 * - store the order of tasks the user wants to work on
 * - mark one task as the current task
 *
 * Notes:
 * - One task can appear only once per project planning board
 * - sortOrder controls queue order
 */
@Entity
@Table(
        name = "planning_items",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_planning_items_project_task", columnNames = {
                        "project_id", "task_id"
                })
        }
)
public class PlanningItem {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    /**
     * Project that owns this planning board item.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /**
     * Roadmap task placed into the planning queue.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    /**
     * Position in the planning queue.
     * Lower number means higher priority in the list.
     */
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    /**
     * Whether this is the task currently being worked on.
     * Only one item should be true per project board.
     */
    @Column(name = "is_current", nullable = false)
    private boolean current;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public Task getTask() {
        return task;
    }

    public void setTask(Task task) {
        this.task = task;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public boolean isCurrent() {
        return current;
    }

    public void setCurrent(boolean current) {
        this.current = current;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}