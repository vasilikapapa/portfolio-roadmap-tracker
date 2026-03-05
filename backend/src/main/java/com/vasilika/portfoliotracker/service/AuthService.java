package com.vasilika.portfoliotracker.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
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
 * Responsibilities:
 * - Validate ADMIN credentials
 * - Issue JWT tokens (ADMIN, DEMO, etc.)
 *
 * Token format (matches your frontend expectations):
 * {
 *   "accessToken": "...",
 *   "tokenType": "Bearer",
 *   "expiresAt": "..."
 * }
 *
 * Security model:
 * - ADMIN token -> access /admin/**
 * - DEMO token  -> access /demo/** (sandbox CRUD only)
 * - Public GET  -> access /api/**
 */
@Service
public class AuthService {

    private final JwtEncoder jwtEncoder;
    private final PasswordEncoder passwordEncoder;

    // Admin credentials loaded from configuration (.env / application.yml)
    private final String adminUsername;
    private final String adminPasswordHash;

    private final String demoUsername;
    private final String demoPasswordHash;
    private final DemoSeederService demoSeeder;


    public AuthService(
            JwtEncoder jwtEncoder,
            PasswordEncoder passwordEncoder,
            @Value("${app.security.admin.username}") String adminUsername,
            @Value("${app.security.admin.password-hash}") String adminPasswordHash,
            @Value("${app.security.demo.username}") String demoUsername,
            @Value("${app.security.demo.password-hash}") String demoPasswordHash,
            DemoSeederService demoSeeder) {
        this.jwtEncoder = jwtEncoder;
        this.passwordEncoder = passwordEncoder;
        this.adminUsername = adminUsername;
        this.adminPasswordHash = adminPasswordHash;
        this.demoUsername = demoUsername;
        this.demoPasswordHash = demoPasswordHash;
        this.demoSeeder = demoSeeder;
    }

    /**
     * =========================================
     * ADMIN login
     * =========================================
     *
     * Validates username + password, then issues a token with roles ["ADMIN"].
     */
    public Map<String, Object> loginAdmin(String username, String password) {

        // 1) Verify username matches configured admin account
        boolean userOk = adminUsername.equals(username);

        // 2) Verify password against stored BCrypt hash
        boolean passOk = passwordEncoder.matches(password, adminPasswordHash);

        if (!userOk || !passOk) {
            throw new InvalidCredentialsException();
        }

        // 3) Issue token with ADMIN role
        return issueToken(adminUsername, List.of("ADMIN"));
    }

    /**
     * =========================================
     * DEMO login (PUBLIC)
     * =========================================
  */

    public Map<String, Object> loginDemo(String username, String password) {

        if (!"demo".equals(username)
                || !"demo-portfolio-2026!".equals(password)) {
            throw new InvalidCredentialsException();
        }

        // 🔥 reseed demo data every login
        demoSeeder.seedDemoData();

        return issueToken(demoUsername, List.of("DEMO"));
    }
    /**
     * =========================================
     * (Optional) TEST login (PUBLIC)
     * =========================================
     *
     * a separate role like TEST.
     * also:
     * - permit POST /auth/test
     * - protect /test/** or similar in SecurityConfig
     */
    // public Map<String, Object> testLogin() {
    //     return issueToken("test", List.of("TEST"));
    // }

    /**
     * =========================================
     * Token issuing helper
     * =========================================
     */
    private Map<String, Object> issueToken(String subject, List<String> roles) {

        Instant now = Instant.now();
        Instant expiresAt = now.plus(2, ChronoUnit.HOURS);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("portfolio-tracker")
                .issuedAt(now)
                .expiresAt(expiresAt)
                .subject(subject)
                .claim("roles", roles)
                .build();

        // HS256 signing header (matches your existing approach)
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();

        String token = jwtEncoder
                .encode(JwtEncoderParameters.from(header, claims))
                .getTokenValue();

        return Map.of(
                "accessToken", token,
                "tokenType", "Bearer",
                "expiresAt", expiresAt.toString()
        );
    }
}