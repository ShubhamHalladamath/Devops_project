package com.attendance.repository;

import com.attendance.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, UUID> {
    List<AttendanceSession> findByCourseId(UUID courseId);
    Integer countByCourseId(UUID courseId);
}
