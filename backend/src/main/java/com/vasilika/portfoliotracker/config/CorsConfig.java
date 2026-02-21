package com.vasilika.portfoliotracker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * =========================================
 * CORS Configuration
 * =========================================
 *
 * Purpose:
 * Enables Cross-Origin Resource Sharing (CORS)
 * so the frontend application can communicate
 * with this backend API.
 *
 * Without this configuration, the browser
 * would block requests coming from a different
 * domain (e.g., React/Vite frontend).
 */
@Configuration
public class CorsConfig {

    /**
     * Registers global CORS configuration
     * for all API endpoints.
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {

        return new WebMvcConfigurer() {

            /**
             * Configure allowed origins, methods, and headers.
             */
            @Override
            public void addCorsMappings(CorsRegistry registry) {

                registry.addMapping("/**") // Apply CORS rules to all endpoints

                        /**
                         * Allow requests from:
                         * - Local Vite frontend (default port 5173)
                         * - Local React frontend (port 3000)
                         * - Production frontend deployed on Vercel
                         *
                         * ⚠ Replace YOUR-VERCEL-DOMAIN with your actual deployed URL
                         */
                        .allowedOrigins(
                                "http://localhost:5173",
                                "http://localhost:3000",
                                "https://YOUR-VERCEL-DOMAIN.vercel.app"
                        )

                        /**
                         * Allow common HTTP methods used in REST APIs
                         */
                        .allowedMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS")

                        /**
                         * Allow all request headers
                         * (useful for Authorization headers like JWT)
                         */
                        .allowedHeaders("*")

                        /**
                         * Cache preflight (OPTIONS) request
                         * response for 1 hour (3600 seconds)
                         */
                        .maxAge(3600);
            }
        };
    }
}