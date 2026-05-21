package com.attendance.service;

import com.attendance.dto.request.MarkAttendanceRequest;
import com.attendance.dto.response.AttendanceHistoryResponse;
import com.attendance.dto.response.AttendanceRecordResponse;
import com.attendance.dto.response.AttendanceSummaryResponse;
import com.attendance.entity.*;
import com.attendance.exception.AlreadyMarkedException;
import com.attendance.exception.ProxyDetectedException;
import com.attendance.exception.ResourceNotFoundException;
import com.attendance.exception.SessionExpiredException;
import com.attendance.repository.AttendanceRecordRepository;
import com.attendance.repository.AttendanceSessionRepository;
import com.attendance.repository.CourseEnrollmentRepository;
import com.attendance.repository.CourseRepository;
import com.attendance.repository.StudentRepository;
import com.attendance.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final CourseRepository courseRepository;
    private final StudentService studentService;
    private final StudentRepository studentRepository;
    private final TeacherService teacherService;
    private final JwtUtil jwtUtil;

    @Transactional
    public void markAttendance(UUID studentUserId, String deviceFingerprint, MarkAttendanceRequest request) {
        
        if (!jwtUtil.validateQrToken(request.getQrToken())) {
            throw new SessionExpiredException("QR token is expired or invalid");
        }

        String sessionIdStr = jwtUtil.extractSessionIdFromQr(request.getQrToken());
        UUID sessionId = UUID.fromString(sessionIdStr);

        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!session.getIsActive()) {
            throw new SessionExpiredException("Attendance session is closed");
        }

        Student student = studentService.getStudentByUserId(studentUserId);

        if (!courseEnrollmentRepository.existsByCourseIdAndStudentId(session.getCourseId(), student.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You are not enrolled in this course");
        }

        if (attendanceRecordRepository.findBySessionIdAndStudentId(sessionId, student.getId()).isPresent()) {
            throw new AlreadyMarkedException("Attendance already marked for this session");
        }

        if (attendanceRecordRepository.findBySessionIdAndDeviceFingerprint(sessionId, deviceFingerprint).isPresent()) {
            throw new ProxyDetectedException("Proxy attendance detected from this device");
        }

        String ipAddress = extractIpAddress();

        AttendanceRecord record = AttendanceRecord.builder()
                .sessionId(sessionId)
                .studentId(student.getId())
                .deviceFingerprint(deviceFingerprint)
                .ipAddress(ipAddress)
                .status(AttendanceStatus.PRESENT)
                .build();

        attendanceRecordRepository.save(record);
    }

    public List<AttendanceRecordResponse> getSessionRecords(UUID teacherUserId, UUID sessionId) {
        Teacher teacher = teacherService.getTeacherByUserId(teacherUserId);
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!session.getTeacherId().equals(teacher.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You don't have permission to view this session");
        }

        return attendanceRecordRepository.findBySessionId(sessionId).stream()
                .map(record -> {
                    Student student = studentRepository.findById(record.getStudentId())
                            .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
                    return AttendanceRecordResponse.builder()
                            .studentId(student.getId())
                            .studentName(student.getName())
                            .rollNumber(student.getRollNumber())
                            .status(record.getStatus())
                            .markedAt(record.getMarkedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void modifyAttendance(UUID teacherUserId, UUID sessionId, UUID studentId, AttendanceStatus status) {
        Teacher teacher = teacherService.getTeacherByUserId(teacherUserId);
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!session.getTeacherId().equals(teacher.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You don't have permission to modify this session");
        }

        // Verify student is enrolled
        if (!courseEnrollmentRepository.existsByCourseIdAndStudentId(session.getCourseId(), studentId)) {
            throw new ResourceNotFoundException("Student is not enrolled in this course");
        }

        attendanceRecordRepository.findBySessionIdAndStudentId(sessionId, studentId)
                .ifPresentOrElse(
                        record -> {
                            record.setStatus(status);
                            attendanceRecordRepository.save(record);
                        },
                        () -> {
                            AttendanceRecord newRecord = AttendanceRecord.builder()
                                    .sessionId(sessionId)
                                    .studentId(studentId)
                                    .deviceFingerprint("TEACHER_OVERRIDE") // Bypassing device check
                                    .ipAddress(extractIpAddress())
                                    .status(status)
                                    .build();
                            attendanceRecordRepository.save(newRecord);
                        }
                );
    }

    public List<AttendanceSummaryResponse> getStudentAttendanceSummary(UUID studentUserId) {
        Student student = studentService.getStudentByUserId(studentUserId);
        List<CourseEnrollment> enrollments = courseEnrollmentRepository.findByStudentId(student.getId());

        List<AttendanceSummaryResponse> summaries = new ArrayList<>();

        for (CourseEnrollment enrollment : enrollments) {
            Course course = courseRepository.findById(enrollment.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
            
            Integer totalClasses = attendanceSessionRepository.countByCourseId(course.getId());
            
            int attendedClasses = 0;
            List<AttendanceSession> sessions = attendanceSessionRepository.findByCourseId(course.getId());
            for(AttendanceSession session : sessions) {
                if(attendanceRecordRepository.findBySessionIdAndStudentId(session.getId(), student.getId()).isPresent()) {
                    attendedClasses++;
                }
            }

            double percentage = 0.0;
            if (totalClasses != null && totalClasses > 0) {
                percentage = ((double) attendedClasses / totalClasses) * 100.0;
            }

            summaries.add(AttendanceSummaryResponse.builder()
                    .courseId(course.getId())
                    .courseName(course.getCourseName())
                    .totalClasses(totalClasses == null ? 0 : totalClasses)
                    .attended(attendedClasses)
                    .percentage(Math.round(percentage * 100.0) / 100.0)
                    .build());
        }

        return summaries;
    }

    public List<AttendanceHistoryResponse> getStudentAttendanceHistory(UUID studentUserId) {
        Student student = studentService.getStudentByUserId(studentUserId);
        return generateHistoryForStudent(student, null);
    }

    public List<AttendanceHistoryResponse> getStudentHistoryForCourse(UUID teacherUserId, UUID courseId, UUID studentId) {
        Teacher teacher = teacherService.getTeacherByUserId(teacherUserId);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        
        if (!course.getTeacherId().equals(teacher.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("No permission for this course");
        }

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        return generateHistoryForStudent(student, courseId);
    }

    private List<AttendanceHistoryResponse> generateHistoryForStudent(Student student, UUID filterCourseId) {
        List<AttendanceHistoryResponse> history = new ArrayList<>();
        List<CourseEnrollment> enrollments = courseEnrollmentRepository.findByStudentId(student.getId());

        for (CourseEnrollment enrollment : enrollments) {
            if (filterCourseId != null && !enrollment.getCourseId().equals(filterCourseId)) {
                continue;
            }

            Course course = courseRepository.findById(enrollment.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
            
            List<AttendanceSession> sessions = attendanceSessionRepository.findByCourseId(course.getId());
            for (AttendanceSession session : sessions) {
                AttendanceStatus status = AttendanceStatus.ABSENT;
                attendanceRecordRepository.findBySessionIdAndStudentId(session.getId(), student.getId())
                        .ifPresent(record -> {
                            // If record exists, we use its status (it could be PRESENT, or teacher manually set it to ABSENT)
                            // But usually, an existing record means PRESENT unless overriden. Let's just use the record's status.
                        });
                
                // Better:
                var optionalRecord = attendanceRecordRepository.findBySessionIdAndStudentId(session.getId(), student.getId());
                if(optionalRecord.isPresent()) {
                    status = optionalRecord.get().getStatus();
                }

                history.add(AttendanceHistoryResponse.builder()
                        .sessionId(session.getId())
                        .courseId(course.getId())
                        .courseName(course.getCourseName())
                        .courseCode(course.getCourseCode())
                        .sessionDate(session.getCreatedAt())
                        .status(status)
                        .build());
            }
        }
        
        // Sort by date descending
        history.sort((a, b) -> b.getSessionDate().compareTo(a.getSessionDate()));
        return history;
    }

    private String extractIpAddress() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader == null) {
                return request.getRemoteAddr();
            }
            return xfHeader.split(",")[0];
        } catch (Exception e) {
            return "UNKNOWN";
        }
    }
}
