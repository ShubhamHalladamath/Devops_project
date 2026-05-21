package com.attendance.dto.response;

import com.attendance.entity.Role;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String refreshToken;
    private Role role;
    private UUID userId;
}
