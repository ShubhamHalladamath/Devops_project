package com.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class SessionResponse {
    private UUID sessionId;
    private UUID courseId;
    private String qrToken;
    private LocalDateTime expiresAt;
    private Boolean isActive;
}
