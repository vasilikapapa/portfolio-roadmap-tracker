package com.vasilika.portfoliotracker.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * =========================================
 * OpenAPI (Swagger) Configuration
 * =========================================
 *
 * Purpose:
 * - Configures API documentation metadata
 * - Customizes Swagger UI information
 * - Provides structured documentation for frontend,
 *   recruiters, or other developers
 *
 * Accessible via:
 *   /swagger-ui.html
 *   /v3/api-docs
 *
 * This makes your backend self-documented and
 * production-ready from a developer experience perspective.
 */
@Configuration
public class OpenApiConfig {

    /**
     * Creates the OpenAPI bean used by springdoc.
     *
     * This defines:
     * - API title
     * - Description
     * - Version
     * - License information
     */
    @Bean
    public OpenAPI openAPI() {

        return new OpenAPI()
                .info(new Info()

                        /**
                         * API name displayed in Swagger UI
                         */
                        .title("Portfolio Roadmap Tracker API")

                        /**
                         * Short explanation of what this API does
                         */
                        .description(
                                "Public portfolio endpoints + admin-only endpoints " +
                                        "for managing projects, tasks, and updates."
                        )

                        /**
                         * Current API version
                         * Update when breaking changes are introduced.
                         */
                        .version("1.0.0")

                        /**
                         * License information for the project
                         * Useful for open-source repositories.
                         */
                        .license(new License().name("MIT"))
                );
    }
}