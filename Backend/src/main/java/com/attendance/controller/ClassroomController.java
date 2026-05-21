package com.attendance.controller;

import com.attendance.dto.request.*;
import com.attendance.dto.response.AttendanceHistoryResponse;
import com.attendance.dto.response.AttendanceRecordResponse;
import com.attendance.dto.response.CourseResponse;
import com.attendance.dto.response.SessionResponse;
import com.attendance.dto.response.StudentResponse;
import com.attendance.security.CustomUserDetails;
import com.attendance.service.AttendanceService;
import com.attendance.service.AttendanceSessionService;
import com.attendance.service.CourseService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/classroom")
@RequiredArgsConstructor
public class ClassroomController {

    private final CourseService courseService;
    private final AttendanceSessionService sessionService;
    private final AttendanceService attendanceService;

    // --- Course Endpoints ---

    @PostMapping("/course")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<CourseResponse> createCourse(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateCourseRequest request) {
        CourseResponse response = courseService.createCourse(userDetails.getUser().getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<CourseResponse> getCourse(@PathVariable UUID courseId) {
        CourseResponse response = courseService.getCourse(courseId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/course/{courseId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<CourseResponse> updateCourse(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID courseId,
            @Valid @RequestBody UpdateCourseRequest request) {
        CourseResponse response = courseService.updateCourse(userDetails.getUser().getId(), courseId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/course/{courseId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> deleteCourse(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID courseId) {
        courseService.deleteCourse(userDetails.getUser().getId(), courseId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/course/{courseId}/enroll")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> enrollStudent(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID courseId,
            @Valid @RequestBody EnrollStudentRequest request) {
        courseService.enrollStudent(userDetails.getUser().getId(), courseId, request.getStudentId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/course/{courseId}/enroll/{studentId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> removeStudent(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID courseId,
            @PathVariable UUID studentId) {
        courseService.removeStudent(userDetails.getUser().getId(), courseId, studentId);
        return ResponseEntity.noContent().build();
    }

    // --- Session Endpoints ---

    @PostMapping("/session/start")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<SessionResponse> startSession(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody StartSessionRequest request) {
        SessionResponse response = sessionService.startSession(userDetails.getUser().getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/session/refresh")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<SessionResponse> refreshSession(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, UUID> request) {
        UUID sessionId = request.get("sessionId");
        SessionResponse response = sessionService.refreshSessionToken(userDetails.getUser().getId(), sessionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/session/{sessionId}/stop")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> stopSession(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID sessionId) {
        sessionService.stopSession(userDetails.getUser().getId(), sessionId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/session/{sessionId}/records")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<AttendanceRecordResponse>> getSessionRecords(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID sessionId) {
        List<AttendanceRecordResponse> records = attendanceService.getSessionRecords(userDetails.getUser().getId(), sessionId);
        return ResponseEntity.ok(records);
    }

    @PutMapping("/session/{sessionId}/attendance/{studentId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> modifyAttendance(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID sessionId,
            @PathVariable UUID studentId,
            @Valid @RequestBody ModifyAttendanceRequest request) {
        attendanceService.modifyAttendance(userDetails.getUser().getId(), sessionId, studentId, request.getStatus());
        return ResponseEntity.ok().build();
    }

    // --- Attendance Endpoints ---

    @PostMapping("/attendance/mark")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> markAttendance(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody MarkAttendanceRequest request,
            HttpServletRequest httpServletRequest) {
        
        String deviceFingerprint = httpServletRequest.getHeader("X-Device-ID");
        if (deviceFingerprint == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        attendanceService.markAttendance(userDetails.getUser().getId(), deviceFingerprint, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/course/{courseId}/students")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<StudentResponse>> getCourseStudents(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID courseId) {
        List<StudentResponse> students = courseService.getEnrolledStudents(userDetails.getUser().getId(), courseId);
        return ResponseEntity.ok(students);
    }

    @GetMapping("/course/{courseId}/student/{studentId}/history")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<AttendanceHistoryResponse>> getStudentHistoryForCourse(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID courseId,
            @PathVariable UUID studentId) {
        List<AttendanceHistoryResponse> history = attendanceService.getStudentHistoryForCourse(
                userDetails.getUser().getId(), courseId, studentId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/teacher/courses")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<CourseResponse>> getTeacherCourses(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<CourseResponse> courses = courseService.getCoursesByTeacher(userDetails.getUser().getId());
        return ResponseEntity.ok(courses);
    }
}
