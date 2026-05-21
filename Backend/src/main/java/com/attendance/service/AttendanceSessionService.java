package com.attendance.service;

import com.attendance.dto.request.StartSessionRequest;
import com.attendance.dto.response.SessionResponse;
import com.attendance.entity.AttendanceSession;
import com.attendance.entity.Course;
import com.attendance.entity.Teacher;
import com.attendance.exception.ResourceNotFoundException;
import com.attendance.repository.AttendanceSessionRepository;
import com.attendance.repository.CourseRepository;
import com.attendance.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceSessionService {

    private final AttendanceSessionRepository sessionRepository;
    private final CourseRepository courseRepository;
    private final TeacherService teacherService;
    private final JwtUtil jwtUtil;

    @Value("${jwt.qr-expiration}")
    private long qrExpirationMs;

    @Transactional
    public SessionResponse startSession(UUID teacherUserId, StartSessionRequest request) {
        Teacher teacher = teacherService.getTeacherByUserId(teacherUserId);
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        if (!course.getTeacherId().equals(teacher.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You don't have permission to start a session for this course");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(qrExpirationMs / 1000);

        AttendanceSession session = AttendanceSession.builder()
                .courseId(course.getId())
                .teacherId(teacher.getId())
                .isActive(true)
                .expiresAt(expiresAt)
                .build();
        
        session = sessionRepository.save(session); // Save first to generate ID

        String qrToken = jwtUtil.generateQrToken(session.getId(), course.getId(), teacher.getId());
        session.setQrToken(qrToken);
        session = sessionRepository.save(session);

        return mapToResponse(session);
    }

    @Transactional
    public SessionResponse refreshSessionToken(UUID teacherUserId, UUID sessionId) {
        Teacher teacher = teacherService.getTeacherByUserId(teacherUserId);
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!session.getTeacherId().equals(teacher.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You don't have permission to modify this session");
        }

        if (!session.getIsActive()) {
            throw new IllegalStateException("Cannot refresh an inactive session");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(qrExpirationMs / 1000);

        String qrToken = jwtUtil.generateQrToken(session.getId(), session.getCourseId(), teacher.getId());
        
        session.setQrToken(qrToken);
        session.setExpiresAt(expiresAt);
        session = sessionRepository.save(session);

        return mapToResponse(session);
    }

    @Transactional
    public void stopSession(UUID teacherUserId, UUID sessionId) {
        Teacher teacher = teacherService.getTeacherByUserId(teacherUserId);
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!session.getTeacherId().equals(teacher.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You don't have permission to modify this session");
        }

        session.setIsActive(false);
        sessionRepository.save(session);
    }

    private SessionResponse mapToResponse(AttendanceSession session) {
        return SessionResponse.builder()
                .sessionId(session.getId())
                .courseId(session.getCourseId())
                .qrToken(session.getQrToken())
                .expiresAt(session.getExpiresAt())
                .isActive(session.getIsActive())
                .build();
    }
}
