package com.vasilika.portfoliotracker.web.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * =========================================
 * Global API Exception Handler
 * =========================================
 *
 * Centralized error handling for REST API.
 *
 * Benefits:
 * - Consistent error response structure
 * - Cleaner controller/service code
 * - Better API client experience
 * - Easier debugging and monitoring
 *
 * All exceptions handled here return JSON
 * responses with timestamp, status, and path.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    /**
     * Handles validation errors triggered by:
     * - @Valid
     * - Bean validation annotations
     * (e.g., @NotBlank, @Size)
     *
     * Returns structured field-level errors.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {

        var errors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.groupingBy(
                        e -> e.getField(),
                        Collectors.mapping(e -> e.getDefaultMessage(), Collectors.toList())
                ));

        return ResponseEntity.badRequest().body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 400,
                "error", "Validation failed",
                "path", req.getRequestURI(),
                "fieldErrors", errors
        ));
    }

    /**
     * Handles illegal argument exceptions.
     *
     * Common case:
     * - Invalid enum parsing
     * - Incorrect input format
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest req) {

        return ResponseEntity.badRequest().body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 400,
                "error", "Bad request",
                "message", ex.getMessage(),
                "path", req.getRequestURI()
        ));
    }

    /**
     * Handles authentication failures.
     *
     * Triggered when login credentials
     * are invalid.
     */
    @ExceptionHandler(com.vasilika.portfoliotracker.service.InvalidCredentialsException.class)
    public ResponseEntity<?> handleInvalidCredentials(RuntimeException ex, HttpServletRequest req) {

        return ResponseEntity.status(401).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 401,
                "error", "Unauthorized",
                "message", ex.getMessage(),
                "path", req.getRequestURI()
        ));
    }

    /**
     * Handles missing resources.
     *
     * Example:
     * - Project not found
     * - Task not found
     */
    @ExceptionHandler(java.util.NoSuchElementException.class)
    public ResponseEntity<?> handleNotFound(java.util.NoSuchElementException ex, HttpServletRequest req) {

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 404,
                "error", "Not found",
                "path", req.getRequestURI()
        ));
    }

    /**
     * Catch-all handler for unexpected errors.
     *
     * Prevents stack traces from leaking
     * to clients while providing basic info.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex, HttpServletRequest req) {

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 500,
                "error", "Internal server error",
                "message", ex.getMessage(),
                "path", req.getRequestURI()
        ));
    }
}