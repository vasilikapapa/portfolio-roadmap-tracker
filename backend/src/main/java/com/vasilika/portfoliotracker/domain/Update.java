package com.vasilika.portfoliotracker.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * =========================================
 * Update Entity (Project Dev Logs)
 * =========================================
 *
 * Represents a development update or progress note
 * related to a specific project.
 *
 * NEW:
 * - An update can now optionally reference a specific task.
 * - This lets the frontend group updates under their related task.
 */
@Entity
@Table(name = "updates")
public class Update {

    /**
     * Unique identifier for the update.
     */
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    /**
     * Every update still belongs to a project.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /**
     * Optional related task.
     *
     * Why nullable?
     * - Some updates are project-wide and not tied to a single task.
     * - Example: deployment notes, design cleanup, roadmap changes.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    /**
     * Short title summarizing the update.
     */
    @Column(nullable = false, length = 200)
    private String title;

    /**
     * Main update content.
     */
    @Column(name = "body", nullable = false, columnDefinition = "text")
    private String body;

    /**
     * Timestamp when the update was created.
     */
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    // ===== Getters and Setters =====

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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}