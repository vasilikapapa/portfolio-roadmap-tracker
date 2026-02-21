package com.vasilika.portfoliotracker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

/**
 * =========================================
 * Spring Security Configuration
 * =========================================
 *
 * Purpose:
 * - Secures API endpoints using JWT authentication
 * - Allows public access to selected endpoints
 * - Restricts admin routes by role
 * - Configures stateless authentication (no sessions)
 *
 * This setup is typical for modern REST APIs:
 * frontend authenticates once → receives JWT →
 * sends token with each request.
 */
@Configuration
public class SecurityConfig {

    /**
     * Main Spring Security filter chain configuration.
     *
     * Defines:
     * - CORS support
     * - CSRF behavior
     * - Session policy
     * - Endpoint authorization rules
     * - JWT authentication setup
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                /**
                 * Enable CORS so frontend apps
                 * (React, Vite, etc.) can call this API.
                 */
                .cors(cors -> {})

                /**
                 * Disable CSRF because:
                 * - This is a stateless REST API
                 * - JWT protects requests instead of sessions
                 */
                .csrf(csrf -> csrf.disable())

                /**
                 * Stateless session management:
                 * No HTTP session stored on server.
                 * Each request must include JWT token.
                 */
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                /**
                 * Authorization rules for endpoints.
                 */
                .authorizeHttpRequests(auth -> auth

                        /**
                         * Allow Swagger/OpenAPI docs publicly
                         * (useful for development and recruiters).
                         */
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()

                        /**
                         * Allow login endpoint without authentication.
                         */
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()

                        /**
                         * Public GET endpoints (portfolio viewing).
                         */
                        .requestMatchers(HttpMethod.GET, "/api/**").permitAll()

                        /**
                         * Health check endpoint for deployment platforms.
                         */
                        .requestMatchers(HttpMethod.GET, "/health").permitAll()

                        /**
                         * Admin-only endpoints require ADMIN role.
                         */
                        .requestMatchers("/admin/**").hasRole("ADMIN")

                        /**
                         * All other endpoints require authentication.
                         */
                        .anyRequest().authenticated()
                )

                /**
                 * Configure JWT-based authentication.
                 * Spring validates tokens automatically.
                 */
                .oauth2ResourceServer(oauth ->
                        oauth.jwt(jwt ->
                                jwt.jwtAuthenticationConverter(jwtAuthConverter())
                        )
                )

                /**
                 * Disable default authentication methods
                 * since JWT is used instead.
                 */
                .httpBasic(b -> b.disable())
                .formLogin(f -> f.disable());

        return http.build();
    }

    /**
     * Converts JWT claims into Spring Security authorities.
     *
     * Example:
     * JWT contains:
     *   "roles": ["ADMIN"]
     *
     * Spring interprets as:
     *   ROLE_ADMIN
     *
     * This allows use of:
     *   hasRole("ADMIN")
     */
    @Bean
    public JwtAuthenticationConverter jwtAuthConverter() {

        JwtGrantedAuthoritiesConverter gac = new JwtGrantedAuthoritiesConverter();

        // Claim name in JWT containing roles
        gac.setAuthoritiesClaimName("roles");

        // Prefix required by Spring Security
        gac.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(gac);

        return converter;
    }
}