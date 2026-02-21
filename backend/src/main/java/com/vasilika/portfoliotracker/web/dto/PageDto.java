package com.vasilika.portfoliotracker.web.dto;

import java.util.List;

/**
 * =========================================
 * Page DTO (Generic Pagination Response)
 * =========================================
 *
 * Generic wrapper used for paginated API responses.
 *
 * Purpose:
 * - Standardize pagination output across endpoints
 * - Avoid exposing Spring Page directly to clients
 * - Provide consistent structure for frontend apps
 *
 * Typically used for:
 * - Tasks lists
 * - Updates timeline
 * - Any pageable API results
 *
 * <T> represents the DTO type being returned.
 */
public record PageDto<T>(

        /**
         * List of items for the current page.
         */
        List<T> items,

        /**
         * Current page number (0-based).
         */
        int page,

        /**
         * Number of items per page.
         */
        int size,

        /**
         * Total number of elements across all pages.
         */
        long totalElements,

        /**
         * Total number of available pages.
         */
        int totalPages,

        /**
         * Indicates whether another page exists.
         * Useful for infinite scrolling.
         */
        boolean hasNext

) {}