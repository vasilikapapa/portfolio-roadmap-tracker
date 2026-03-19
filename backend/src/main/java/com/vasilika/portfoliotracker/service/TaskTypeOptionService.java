package com.vasilika.portfoliotracker.service;

import com.vasilika.portfoliotracker.domain.TaskTypeOption;
import com.vasilika.portfoliotracker.repo.TaskTypeOptionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Reads and validates configurable task types.
 */
@Service
public class TaskTypeOptionService {

    private final TaskTypeOptionRepository taskTypeOptions;

    public TaskTypeOptionService(TaskTypeOptionRepository taskTypeOptions) {
        this.taskTypeOptions = taskTypeOptions;
    }

    /**
     * Returns active task type options for UI dropdowns.
     */
    public List<TaskTypeOption> listActive() {
        return taskTypeOptions.findAllByActiveTrueOrderBySortOrderAscLabelAsc();
    }

    /**
     * Normalizes and validates a task type code.
     * Throws IllegalArgumentException if invalid.
     */
    public String requireValidCode(String code) {
        String normalized = normalize(code);

        if (normalized == null || normalized.isBlank()) {
            throw new IllegalArgumentException("Task type is required.");
        }

        boolean exists = taskTypeOptions.existsByCodeIgnoreCase(normalized);

        if (!exists) {
            throw new IllegalArgumentException("Invalid task type: " + normalized);
        }

        return normalized;
    }

    public static String normalize(String code) {
        return code == null ? null : code.trim().toUpperCase();
    }
}