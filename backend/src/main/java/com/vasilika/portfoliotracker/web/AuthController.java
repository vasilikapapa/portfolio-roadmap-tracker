package com.vasilika.portfoliotracker.web;

import com.vasilika.portfoliotracker.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * =========================================
 * Authentication Controller
 * =========================================
 *
 * Handles authentication endpoints.
 *
 * Responsibilities:
 * - Accept login credentials
 * - Validate input
 * - Delegate authentication to AuthService
 * - Return JWT access token on success
 *
 * Base path:
 *   /auth
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    /**
     * Constructor injection of authentication service.
     */
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Login request DTO used only by this controller.
     *
     * Validation:
     * - Username must not be blank
     * - Password must not be blank
     */
    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {}

    /**
     * Authenticates user and returns JWT token.
     *
     * HTTP Method: POST
     * Endpoint: /auth/login
     *
     * Request:
     * - Username and password
     *
     * Response:
     * - JWT access token
     * - Token type
     * - Expiration timestamp
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {

        return ResponseEntity.ok(
                authService.login(req.username(), req.password())
        );
    }
}