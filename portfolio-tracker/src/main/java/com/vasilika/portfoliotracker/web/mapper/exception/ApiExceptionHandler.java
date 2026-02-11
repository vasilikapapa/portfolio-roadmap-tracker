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

@RestControllerAdvice
public class ApiExceptionHandler {

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

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest req) {
        // Useful for enum parsing issues (e.g. BACKLOGG)
        return ResponseEntity.badRequest().body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 400,
                "error", "Bad request",
                "message", ex.getMessage(),
                "path", req.getRequestURI()
        ));
    }

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



    @ExceptionHandler(java.util.NoSuchElementException.class)
    public ResponseEntity<?> handleNotFound(java.util.NoSuchElementException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 404,
                "error", "Not found",
                "path", req.getRequestURI()
        ));
    }

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
