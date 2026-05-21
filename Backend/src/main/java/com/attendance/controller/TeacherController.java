package com.attendance.controller;

import com.attendance.dto.request.UpdateProfileRequest;
import com.attendance.dto.response.CourseResponse;
import com.attendance.dto.response.StudentResponse;
import com.attendance.dto.response.TeacherResponse;
import com.attendance.security.CustomUserDetails;
import com.attendance.service.CourseService;
import com.attendance.service.TeacherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class TeacherController {

    private final TeacherService teacherService;
    private final CourseService courseService;

    @GetMapping("/profile")
    public ResponseEntity<TeacherResponse> getProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        TeacherResponse response = teacherService.getTeacherProfile(userDetails.getUser().getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<TeacherResponse> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        TeacherResponse response = teacherService.updateProfile(userDetails.getUser().getId(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/courses")
    public ResponseEntity<List<CourseResponse>> getCourses(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<CourseResponse> courses = courseService.getCoursesByTeacher(userDetails.getUser().getId());
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/courses/{courseId}/students")
    public ResponseEntity<List<StudentResponse>> getEnrolledStudents(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID courseId) {
        List<StudentResponse> students = courseService.getEnrolledStudents(userDetails.getUser().getId(), courseId);
        return ResponseEntity.ok(students);
    }

    // Note: GET /api/teacher/courses/{courseId}/report is similar to the summary logic.
    // Leaving unimplemented here as per the prompt requirements, which were mainly
    // handled by StudentController and ClassroomController.
}
