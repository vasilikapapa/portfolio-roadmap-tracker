package com.vasilika.portfoliotracker.domain.enums.

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Configurable task type option.
 *
 * Examples:
 * - FEATURE
 * - BUG
 * - REFACTOR
 * - CHORE
 * - DOCUMENTATION
 * - PERFORMANCE
 * - DESIGN
 */
@Entity
@Table(
        name = "task_type_options",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_task_type_options_code", columnNames = "code")
        }
)
public class TaskTypeOption {

    @Id
    @Column(columnDefinition = "uuid", nullable = false, updatable = false)
    private UUID id;

    /**
     * Stable machine-readable code stored on tasks.
     */
    @Column(nullable = false, length = 50)
    private String code;

    /**
     * Friendly label shown in the UI.
     */
    @Column(nullable = false, length = 100)
    private String label;

    /**
     * Controls display order in dropdowns.
     */
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    /**
     * Allows hiding old task types without deleting them.
     */
    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public TaskTypeOption() {
    }

    @PrePersist
    public void onCreate() {
        Instant now = Instant.now();

        if (id == null) {
            id = UUID.randomUUID();
        }

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code != null ? code.trim().toUpperCase() : null;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}