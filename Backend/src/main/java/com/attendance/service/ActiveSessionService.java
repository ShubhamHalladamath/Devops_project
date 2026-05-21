package com.attendance.service;

import com.attendance.entity.ActiveSession;
import com.attendance.repository.ActiveSessionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActiveSessionService {

    private final ActiveSessionRepository activeSessionRepository;

    @Transactional
    public void deactivateAllSessionsForUser(UUID userId) {
        activeSessionRepository.deactivateAllSessionsForUser(userId);
    }

    @Transactional
    public void createSession(UUID userId, String deviceId, String jwtTokenId) {
        ActiveSession session = ActiveSession.builder()
                .userId(userId)
                .deviceId(deviceId)
                .jwtTokenId(jwtTokenId)
                .isActive(true)
                .build();
        activeSessionRepository.save(session);
    }

    @Transactional
    public void deactivateSession(String jwtTokenId) {
        Optional<ActiveSession> sessionOpt = activeSessionRepository.findByJwtTokenIdAndIsActiveTrue(jwtTokenId);
        sessionOpt.ifPresent(session -> {
            session.setIsActive(false);
            activeSessionRepository.save(session);
        });
    }
}
