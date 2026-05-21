package com.attendance.repository;

import com.attendance.entity.AttendanceRecord;
import com.attendance.entity.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, UUID> {
    
    Optional<AttendanceRecord> findBySessionIdAndStudentId(UUID sessionId, UUID studentId);
    
    Optional<AttendanceRecord> findBySessionIdAndDeviceFingerprint(UUID sessionId, String deviceFingerprint);
    
    List<AttendanceRecord> findBySessionId(UUID sessionId);
    
    Integer countBySessionIdAndStatus(UUID sessionId, AttendanceStatus status);
}
