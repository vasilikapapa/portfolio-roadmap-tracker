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
 * Example use cases:
 * - Release notes
 * - Progress updates
 * - Feature announcements
 * - Technical improvements documentation
 *
 * Each update belongs to exactly one Project.
 */
@Entity
@Table(name = "updates")
public class Update {

    /**
     * Unique identifier for the update.
     * Stored as UUID for scalability and uniqueness.
     */
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    /**
     * Many-to-one relationship with Project.
     *
     * LAZY fetch:
     * - Project data loads only when accessed
     * - Improves performance when listing updates.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /**
     * Short title summarizing the update.
     * Required field.
     */
    @Column(nullable = false, length = 200)
    private String title;

    /**
     * Main update content.
     * Stored as TEXT to allow longer descriptions
     * such as release notes or technical summaries.
     */
    @Column(name = "body", nullable = false, columnDefinition = "text")
    private String body;

    /**
     * Timestamp when the update was created.
     * Stored as UTC Instant for consistency.
     */
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    // ===== Getters and Setters =====

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}