package com.attendance.repository;

import com.attendance.entity.ActiveSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface ActiveSessionRepository extends JpaRepository<ActiveSession, UUID> {
    
    Optional<ActiveSession> findByJwtTokenIdAndIsActiveTrue(String jwtTokenId);

    @Modifying
    @Query("UPDATE ActiveSession a SET a.isActive = false WHERE a.userId = :userId")
    void deactivateAllSessionsForUser(UUID userId);
}
