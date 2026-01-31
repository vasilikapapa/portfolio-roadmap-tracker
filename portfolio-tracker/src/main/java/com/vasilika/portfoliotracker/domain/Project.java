package com.vasilika.portfoliotracker.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Project entity
 *
 * Represents a single portfolio project that is publicly visible.
 * Each project can later have multiple tasks and updates associated with it.
 *
 * This entity is mapped to the `projects` table managed by Flyway migrations.
 */
@Entity
@Table(name = "projects")
public class Project {

    /**
     * Primary key (UUID).
     * Generated manually in @PrePersist to stay database-agnostic.
     */
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    /**
     * URL-friendly unique identifier (e.g. "workout-app").
     * Used for clean URLs and lookups instead of exposing UUIDs.
     */
    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    /**
     * Human-readable project name.
     */
    @Column(nullable = false, length = 200)
    private String name;

    /**
     * Short description shown in project listings.
     */
    @Column(length = 500)
    private String summary;

    /**
     * Full project description (Markdown-supported on the frontend).
     */
    @Column(columnDefinition = "text")
    private String description;

    /**
     * Technologies used (stored as free text or JSON later if needed).
     */
    @Column(name = "tech_stack", columnDefinition = "text")
    private String techStack;

    /**
     * Link to the source code repository (GitHub, GitLab, etc.).
     */
    @Column(name = "repo_url", columnDefinition = "text")
    private String repoUrl;

    /**
     * Link to the live deployed application (if available).
     */
    @Column(name = "live_url", columnDefinition = "text")
    private String liveUrl;

    /**
     * Timestamp when the project was created.
     * Set automatically on insert.
     */
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    /**
     * Timestamp when the project was last updated.
     * Updated automatically on every change.
     */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Lifecycle hook executed before the entity is persisted.
     * Initializes UUID and timestamps.
     */
    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    /**
     * Lifecycle hook executed before the entity is updated.
     * Refreshes the `updatedAt` timestamp.
     */
    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    // ===== Getters & Setters =====

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTechStack() { return techStack; }
    public void setTechStack(String techStack) { this.techStack = techStack; }

    public String getRepoUrl() { return repoUrl; }
    public void setRepoUrl(String repoUrl) { this.repoUrl = repoUrl; }

    public String getLiveUrl() { return liveUrl; }
    public void setLiveUrl(String liveUrl) { this.liveUrl = liveUrl; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
