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

@Service
public class AuthService {

    private final JwtEncoder jwtEncoder;
    private final PasswordEncoder passwordEncoder;

    private final String adminUsername;
    private final String adminPasswordHash;

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

    public Map<String, Object> login(String username, String password) {
        boolean userOk = adminUsername.equals(username);
        boolean passOk = passwordEncoder.matches(password, adminPasswordHash);

        if (!userOk || !passOk) {
            throw new InvalidCredentialsException();
        }

        Instant now = Instant.now();
        Instant expiresAt = now.plus(2, ChronoUnit.HOURS);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("portfolio-tracker")
                .issuedAt(now)
                .expiresAt(expiresAt)
                .subject(adminUsername)
                .claim("roles", List.of("ADMIN"))
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();

        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();

        return Map.of(
                "accessToken", token,
                "tokenType", "Bearer",
                "expiresAt", expiresAt.toString()
        );
    }
}
