package com.attendance.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String authSecret;

    @Value("${jwt.expiration}")
    private long authExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    @Value("${jwt.qr-secret}")
    private String qrSecret;

    @Value("${jwt.qr-expiration}")
    private long qrExpiration;

    private Key getAuthSigningKey() {
        return Keys.hmacShaKeyFor(authSecret.getBytes());
    }

    private Key getQrSigningKey() {
        return Keys.hmacShaKeyFor(qrSecret.getBytes());
    }

    // --- Auth Token Methods ---

    public String generateToken(UserDetails userDetails, String userId, String role, String deviceId, String jti) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("role", role);
        claims.put("deviceId", deviceId);
        claims.put("jti", jti);

        return createToken(claims, userDetails.getUsername(), authExpiration, getAuthSigningKey());
    }

    public String generateRefreshToken(UserDetails userDetails, String jti) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("jti", jti);
        return createToken(claims, userDetails.getUsername(), refreshExpiration, getAuthSigningKey());
    }

    private String createToken(Map<String, Object> claims, String subject, long expiration, Key key) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token, getAuthSigningKey());
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token, getAuthSigningKey()));
    }

    public String extractUsername(String token) {
        return extractUsername(token, getAuthSigningKey());
    }

    private String extractUsername(String token, Key key) {
        return extractClaim(token, key, Claims::getSubject);
    }

    public String extractDeviceId(String token) {
        return extractClaim(token, getAuthSigningKey(), claims -> claims.get("deviceId", String.class));
    }

    public String extractJti(String token) {
        return extractClaim(token, getAuthSigningKey(), claims -> claims.get("jti", String.class));
    }

    private boolean isTokenExpired(String token, Key key) {
        return extractExpiration(token, key).before(new Date());
    }

    private Date extractExpiration(String token, Key key) {
        return extractClaim(token, key, Claims::getExpiration);
    }

    private <T> T extractClaim(String token, Key key, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token, key);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token, Key key) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }

    // --- QR Token Methods ---

    public String generateQrToken(UUID sessionId, UUID courseId, UUID teacherId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "QR_ATTENDANCE");
        claims.put("sessionId", sessionId.toString());
        claims.put("courseId", courseId.toString());
        claims.put("teacherId", teacherId.toString());

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + qrExpiration))
                .signWith(getQrSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateQrToken(String token) {
        try {
            return !isTokenExpired(token, getQrSigningKey());
        } catch (Exception e) {
            return false;
        }
    }

    public String extractSessionIdFromQr(String token) {
        return extractClaim(token, getQrSigningKey(), claims -> claims.get("sessionId", String.class));
    }
}
