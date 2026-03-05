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
 * ==========================================================
 * Spring Security Configuration
 * ==========================================================
 *
 * Architecture:
 *
 * 1) PUBLIC (no auth required)
 *    - View portfolio projects
 *    - Swagger docs
 *    - Health endpoint
 *
 * 2) DEMO (ROLE_DEMO)
 *    - Full CRUD inside sandbox tenant
 *    - Can reset demo data
 *
 * 3) ADMIN (ROLE_ADMIN)
 *    - Full CRUD on real portfolio data
 *
 * Security Model:
 * - Stateless (JWT-based)
 * - No sessions
 * - Frontend sends Bearer token on each request
 */
@Configuration
public class SecurityConfig {

    /**
     * Main Spring Security filter chain.
     *
     * Configures:
     * - CORS
     * - CSRF disabled (stateless API)
     * - Stateless session policy
     * - Route authorization rules
     * - JWT validation
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        System.out.println("DEMO LOGIN PERMIT ALL ACTIVE");
        http
                /**
                 * Enable CORS so frontend apps (React/Vite)
                 * can call this backend from a different origin.
                 */
                .cors(cors -> {})

                /**
                 * Disable CSRF:
                 * - This is a stateless REST API
                 * - JWT protects endpoints instead of cookies/sessions
                 */
                .csrf(csrf -> csrf.disable())

                /**
                 * Stateless session management:
                 * - Server does NOT store sessions
                 * - Each request must include JWT
                 */
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                /**
                 * Authorization rules (order matters!)
                 */
                .authorizeHttpRequests(auth -> auth

                        /**
                         * -------------------------------------------------
                         * 1️  PUBLIC ENDPOINTS
                         * -------------------------------------------------
                         */


                        // Swagger / OpenAPI docs (public for recruiters/dev)
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()

                        // Health endpoint (used by Render / deployment platforms)
                        .requestMatchers(HttpMethod.GET, "/health").permitAll()

                        // Login endpoint (no auth required)
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()

                        //Demo login (public)
                        .requestMatchers(HttpMethod.POST, "/auth/demo/login").permitAll()

                        // (Optional) “test” login (public) – only if you add it
                        // .requestMatchers(HttpMethod.POST, "/auth/test").permitAll()

                        // Public read endpoints
                        .requestMatchers(HttpMethod.GET, "/api/**").permitAll()

                        // Health endpoint
                        .requestMatchers(HttpMethod.GET, "/health").permitAll()



                /**
                         * -------------------------------------------------
                         * 2️ DEMO SANDBOX (ROLE_DEMO)
                         * -------------------------------------------------
                         *
                         * - Isolated CRUD environment
                         * - Safe for recruiters to experiment
                         * - Cannot affect real portfolio data
                         */
                        .requestMatchers("/demo/**").hasRole("DEMO")

                        /**
                         * -------------------------------------------------
                         * 3️REAL ADMIN (ROLE_ADMIN)
                         * -------------------------------------------------
                         *
                         * - Full control over real portfolio data
                         */
                        .requestMatchers("/admin/**").hasRole("ADMIN")

                        /**
                         * -------------------------------------------------
                         * 4️All other routes require authentication
                         * -------------------------------------------------
                         */
                        .anyRequest().authenticated()

                )

                /**
                 * JWT Resource Server Configuration
                 *
                 * Spring:
                 * - Validates signature
                 * - Validates expiration
                 * - Extracts roles
                 */
                .oauth2ResourceServer(oauth ->
                        oauth.jwt(jwt ->
                                jwt.jwtAuthenticationConverter(jwtAuthConverter())
                        )
                )

                /**
                 * Disable default login methods:
                 * - No form login
                 * - No basic auth
                 * We only use JWT.
                 */
                .httpBasic(b -> b.disable())
                .formLogin(f -> f.disable());

        return http.build();
    }

    /**
     * Converts JWT "roles" claim into Spring Security authorities.
     *
     * Example JWT payload:
     * {
     *   "sub": "admin",
     *   "roles": ["ADMIN"]
     * }
     *
     * Spring automatically converts:
     *   ADMIN  -> ROLE_ADMIN
     *
     * This enables:
     *   hasRole("ADMIN")
     *   hasRole("DEMO")
     */
    @Bean
    public JwtAuthenticationConverter jwtAuthConverter() {

        JwtGrantedAuthoritiesConverter gac = new JwtGrantedAuthoritiesConverter();

        // The claim name inside JWT that contains role list
        gac.setAuthoritiesClaimName("roles");

        // Spring requires ROLE_ prefix internally
        gac.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(gac);

        return converter;
    }
}