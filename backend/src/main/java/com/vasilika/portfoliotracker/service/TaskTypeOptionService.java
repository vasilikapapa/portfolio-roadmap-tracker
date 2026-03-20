package com.vasilika.portfoliotracker.service;

import org.springframework.stereotype.Service;

/**
 * Normalizes and validates task type values.
 *
 * Task types are now stored directly on Task as plain strings,
 */
@Service
public class TaskTypeOptionService {

    /**
     * Normalizes and validates a task type code.
     * Throws IllegalArgumentException if missing.
     */
    public String requireValidCode(String code) {
        String normalized = normalize(code);

        if (normalized == null || normalized.isBlank()) {
            throw new IllegalArgumentException("Task type is required.");
        }

        return normalized;
    }

    /**
     * Normalizes task type input before saving.
     */
    public static String normalize(String code) {
        return code == null ? null : code.trim().toUpperCase();
    }
}