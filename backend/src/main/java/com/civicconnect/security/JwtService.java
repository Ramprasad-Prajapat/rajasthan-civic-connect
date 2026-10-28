package com.civicconnect.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
/**
 * Service managing JWT generation, parsing, and cryptographic verification using JJWT.
 */
@Service
public class JwtService {

    @Value("${app.jwt.secret:}")
    private String secret;

    @Value("${app.jwt.expiration-minutes:120}")
    private long expirationMinutes;

    private SecretKey key;

    @PostConstruct
    public void init() {
        if (secret == null || secret.trim().length() < 32) {
            throw new IllegalStateException("app.jwt.secret must be configured and at least 32 characters long");
        }
        this.key = Keys.hmacShaKeyFor(secret.trim().getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generates a signed HS256 JWT for an authenticated user.
     */
    public String generateToken(String email, String role, String uid) {
        Instant now = Instant.now();
        Instant expiry = now.plus(expirationMinutes, ChronoUnit.MINUTES);

        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .claim("uid", uid)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    /**
     * Extracts email (subject) from a valid JWT. Returns null if invalid or expired.
     */
    public String extractEmail(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Validates that the token signature and expiration are intact for a user email.
     */
    public boolean isTokenValid(String token, String email) {
        String extracted = extractEmail(token);
        return extracted != null && extracted.equalsIgnoreCase(email);
    }
}
