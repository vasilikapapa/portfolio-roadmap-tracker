package com.vasilika.portfoliotracker.web.dto;


import java.time.Instant;


public record UpdateUpdateRequest (
    String title,
    String body,
    Instant createdAt
) {}
