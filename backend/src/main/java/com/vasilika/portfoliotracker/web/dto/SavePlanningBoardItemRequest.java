package com.vasilika.portfoliotracker.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * One item sent from the frontend when saving
 * the full planning board order.
 */
public record SavePlanningBoardItemRequest(
        @NotNull UUID taskId,
        boolean isCurrent
) {}