package com.vasilika.portfoliotracker.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.*;

import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * =========================================
 * Authentication Service
 * =========================================
 *
 * Handles authentication logic for admin access.
 *
 * Responsibilities:
 * - Validate admin credentials
 * - Generate JWT access tokens
 * - Configure token claims and expiration
 *
 * Note:
 * - Admin credentials are stored securely in
 *   application configuration (environment variables).
 * - Password is stored as a BCrypt hash.
 */
@Service
public class AuthService {

    private final JwtEncoder jwtEncoder;
    private final PasswordEncoder passwordEncoder;

    // Admin credentials loaded from configuration
    private final String adminUsername;
    private final String adminPasswordHash;

    /**
     * Constructor injection for dependencies
     * and admin credentials.
     */
    public AuthService(
            JwtEncoder jwtEncoder,
            PasswordEncoder passwordEncoder,
            @Value("${app.security.admin.username}") String adminUsername,
            @Value("${app.security.admin.password-hash}") String adminPasswordHash
    ) {
        this.jwtEncoder = jwtEncoder;
        this.passwordEncoder = passwordEncoder;
        this.adminUsername = adminUsername;
        this.adminPasswordHash = adminPasswordHash;
    }

    /**
     * Authenticates admin user and generates JWT token.
     *
     * Steps:
     * 1. Validate username and password
     * 2. Generate JWT claims
     * 3. Sign token with HS256
     * 4. Return token metadata
     */
    public Map<String, Object> login(String username, String password) {

        // Verify username matches configured admin account
        boolean userOk = adminUsername.equals(username);

        // Verify password against stored BCrypt hash
        boolean passOk = passwordEncoder.matches(password, adminPasswordHash);

        if (!userOk || !passOk) {
            throw new InvalidCredentialsException();
        }

        // Token timestamps
        Instant now = Instant.now();
        Instant expiresAt = now.plus(2, ChronoUnit.HOURS);

        /**
         * JWT claims:
         * - issuer: application identifier
         * - subject: authenticated username
         * - roles: used for Spring Security authorization
         */
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("portfolio-tracker")
                .issuedAt(now)
                .expiresAt(expiresAt)
                .subject(adminUsername)
                .claim("roles", List.of("ADMIN"))
                .build();

        // HS256 signing header
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();

        // Generate signed JWT token
        String token = jwtEncoder
                .encode(JwtEncoderParameters.from(header, claims))
                .getTokenValue();

        // Return token response
        return Map.of(
                "accessToken", token,
                "tokenType", "Bearer",
                "expiresAt", expiresAt.toString()
        );
    }
}