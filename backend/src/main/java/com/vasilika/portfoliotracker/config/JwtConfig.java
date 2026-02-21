package com.vasilika.portfoliotracker.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * =========================================
 * JWT Security Configuration
 * =========================================
 *
 * Purpose:
 * - Configures JWT encoding and decoding using HS256
 * - Validates that a strong secret key is provided
 * - Provides PasswordEncoder for secure password hashing
 *
 * Used for:
 * - Generating JWT tokens during authentication
 * - Validating JWT tokens on protected endpoints
 * - Hashing user passwords before storing in database
 */
@Configuration
public class JwtConfig {

    /**
     * Creates the SecretKey used for signing and verifying JWT tokens.
     *
     * The secret is loaded from application properties:
     *   app.security.jwt.secret
     *
     * ⚠ IMPORTANT:
     * - Must be at least 32 characters for HS256 security.
     * - Should be stored as an environment variable in production.
     */
    @Bean("jwtSecretKey")
    public SecretKey jwtSecretKey(@Value("${app.security.jwt.secret}") String secret) {

        // Validate secret strength
        if (secret == null || secret.trim().length() < 32) {
            throw new IllegalStateException(
                    "APP_JWT_SECRET is missing or too short (must be 32+ chars)."
            );
        }

        // Create HMAC SHA-256 key from secret string
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    /**
     * JWT Encoder:
     * Responsible for generating (signing) JWT tokens.
     *
     * Uses:
     * - Nimbus implementation
     * - HMAC SHA-256 (HS256)
     */
    @Bean("hs256JwtEncoder")
    public JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {

        return new NimbusJwtEncoder(
                new ImmutableSecret<SecurityContext>(jwtSecretKey)
        );
    }

    /**
     * JWT Decoder:
     * Responsible for validating and decoding incoming JWT tokens.
     *
     * Used automatically by Spring Security when
     * a request contains an Authorization: Bearer <token> header.
     */
    @Bean
    public JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {

        return NimbusJwtDecoder
                .withSecretKey(jwtSecretKey)
                .build();
    }

    /**
     * Password Encoder:
     * Used for hashing user passwords securely before storing them.
     *
     * BCrypt:
     * - Adaptive hashing algorithm
     * - Automatically generates salt
     * - Industry standard for password storage
     */
    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }
}