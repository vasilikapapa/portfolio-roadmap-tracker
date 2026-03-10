package com.vasilika.portfoliotracker.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Request DTO for replacing the full planning board.
 *
 * The frontend sends the queue in display order.
 * Backend stores that order as sortOrder.
 */
public record SavePlanningBoardRequest(
        @NotNull @Valid List<SavePlanningBoardItemRequest> items
) {}