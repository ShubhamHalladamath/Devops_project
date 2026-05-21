package com.attendance.controller;

import com.attendance.dto.request.UpdateProfileRequest;
import com.attendance.dto.response.AttendanceHistoryResponse;
import com.attendance.dto.response.AttendanceSummaryResponse;
import com.attendance.dto.response.CourseResponse;
import com.attendance.dto.response.StudentResponse;
import com.attendance.security.CustomUserDetails;
import com.attendance.service.AttendanceService;
import com.attendance.service.CourseService;
import com.attendance.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {

    private final StudentService studentService;
    private final CourseService courseService;
    private final AttendanceService attendanceService;

    @GetMapping("/profile")
    public ResponseEntity<StudentResponse> getProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        StudentResponse response = studentService.getStudentProfile(userDetails.getUser().getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<StudentResponse> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        StudentResponse response = studentService.updateProfile(userDetails.getUser().getId(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/courses")
    public ResponseEntity<List<CourseResponse>> getCourses(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<CourseResponse> courses = courseService.getCoursesByStudent(userDetails.getUser().getId());
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/courses/available")
    public ResponseEntity<List<CourseResponse>> getAvailableCourses(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<CourseResponse> courses = courseService.getAvailableCoursesForStudent(userDetails.getUser().getId());
        return ResponseEntity.ok(courses);
    }

    @PostMapping("/courses/{courseId}/register")
    public ResponseEntity<Void> registerForCourse(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID courseId) {
        courseService.studentSelfRegister(userDetails.getUser().getId(), courseId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/attendance/summary")
    public ResponseEntity<List<AttendanceSummaryResponse>> getAttendanceSummary(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<AttendanceSummaryResponse> summary = attendanceService.getStudentAttendanceSummary(userDetails.getUser().getId());
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/attendance/history")
    public ResponseEntity<List<AttendanceHistoryResponse>> getAttendanceHistory(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<AttendanceHistoryResponse> history = attendanceService.getStudentAttendanceHistory(userDetails.getUser().getId());
        return ResponseEntity.ok(history);
    }
}
