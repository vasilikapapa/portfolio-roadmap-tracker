package com.vasilika.portfoliotracker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // For now (until we add JWT/login), keep it simple for APIs
                .csrf(csrf -> csrf.disable())

                // Authorization rules
                .authorizeHttpRequests(auth -> auth
                        // public read-only endpoints
                        .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
                        .requestMatchers("/health").permitAll()

                        // allow swagger later if you add it
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // everything else requires auth (we'll add JWT later)
                        .anyRequest().authenticated()
                )

                // Don’t show a browser login popup for API calls
                .httpBasic(Customizer.withDefaults())
                .formLogin(form -> form.disable());

        return http.build();
    }
}
