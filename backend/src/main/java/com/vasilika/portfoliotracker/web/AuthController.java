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
 * Endpoints:
 * - POST /auth/login  -> ADMIN login (username/password)
 * - POST /auth/demo-login   -> DEMO login (no password, public)
 *
 * Notes:
 * - Demo token is safe because demo endpoints are sandboxed
 *   (they only affect Project.demo=true data).
 */



    /**
     * Auth Controller
     *
     * /auth/login      -> ADMIN login
     * /auth/demo/login -> DEMO login (sandbox)
     */
    @RestController
    @RequestMapping("/auth")
    public class AuthController {

        private final AuthService authService;
        public AuthController(AuthService authService) {
            this.authService = authService;
        }

        public record LoginRequest(
                @NotBlank String username,
                @NotBlank String password
        ) {}

        /** ADMIN login */
        @PostMapping("/login")
        public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
            return ResponseEntity.ok(authService.loginAdmin(req.username(), req.password()));
        }

        /** DEMO login */
        @PostMapping("/demo/login")
        public ResponseEntity<?> demoLogin(@Valid @RequestBody LoginRequest req) {

            return ResponseEntity.ok(authService.loginDemo(req.username(), req.password()));
        }
    }

    /**
     * (Optional) a separate "TEST" role later:
     *
     * POST /auth/test
     *
     * Disabled until we add Security rules + endpoints.
     */
    // @PostMapping("/test")
    // public ResponseEntity<?> testLogin() {
    //     return ResponseEntity.ok(authService.testLogin());
    // }
