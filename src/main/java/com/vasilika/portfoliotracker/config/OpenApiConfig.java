package com.vasilika.portfoliotracker.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Portfolio Roadmap Tracker API")
                        .description("Public portfolio endpoints + admin-only endpoints for managing projects, tasks, and updates.")
                        .version("1.0.0")
                        .license(new License().name("MIT")));
    }
}
