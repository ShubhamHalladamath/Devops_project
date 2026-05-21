package com.attendance.service;

import com.attendance.dto.request.CreateCourseRequest;
import com.attendance.dto.request.UpdateCourseRequest;
import com.attendance.dto.response.CourseResponse;
import com.attendance.dto.response.StudentResponse;
import com.attendance.entity.Course;
import com.attendance.entity.CourseEnrollment;
import com.attendance.entity.Student;
import com.attendance.entity.Teacher;
import com.attendance.exception.ResourceNotFoundException;
import com.attendance.repository.CourseEnrollmentRepository;
import com.attendance.repository.CourseRepository;
import com.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final TeacherService teacherService;
    private final StudentService studentService;
    private final StudentRepository studentRepository;

    @Transactional
    public CourseResponse createCourse(UUID teacherUserId, CreateCourseRequest request) {
        Teacher teacher = teacherService.getTeacherByUserId(teacherUserId);

        if (courseRepository.existsByCourseCode(request.getCourseCode())) {
            throw new IllegalArgumentException("Course code already exists");
        }

        Course course = Course.builder()
                .teacherId(teacher.getId())
                .courseCode(request.getCourseCode())
                .courseName(request.getCourseName())
                .department(request.getDepartment())
                .semester(request.getSemester())
                .build();

        course = courseRepository.save(course);
        return mapToResponse(course);
    }

    public CourseResponse getCourse(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        return mapToResponse(course);
    }

    public List<CourseResponse> getCoursesByTeacher(UUID teacherUserId) {
        Teacher teacher = teacherService.getTeacherByUserId(teacherUserId);
        return courseRepository.findByTeacherId(teacher.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CourseResponse> getCoursesByStudent(UUID studentUserId) {
        Student student = studentService.getStudentByUserId(studentUserId);
        List<UUID> courseIds = enrollmentRepository.findByStudentId(student.getId()).stream()
                .map(CourseEnrollment::getCourseId)
                .collect(Collectors.toList());

        return courseRepository.findAllById(courseIds).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CourseResponse> getAvailableCoursesForStudent(UUID studentUserId) {
        Student student = studentService.getStudentByUserId(studentUserId);
        List<UUID> enrolledCourseIds = enrollmentRepository.findByStudentId(student.getId()).stream()
                .map(CourseEnrollment::getCourseId)
                .collect(Collectors.toList());

        return courseRepository.findAll().stream()
                .filter(course -> !enrolledCourseIds.contains(course.getId()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void studentSelfRegister(UUID studentUserId, UUID courseId) {
        Student student = studentService.getStudentByUserId(studentUserId);
        
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found");
        }

        if (enrollmentRepository.existsByCourseIdAndStudentId(courseId, student.getId())) {
            throw new IllegalArgumentException("You are already enrolled in this course");
        }

        CourseEnrollment enrollment = CourseEnrollment.builder()
                .courseId(courseId)
                .studentId(student.getId())
                .build();
        enrollmentRepository.save(enrollment);
    }

    @Transactional
    public CourseResponse updateCourse(UUID teacherUserId, UUID courseId, UpdateCourseRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        Teacher teacher = teacherService.getTeacherByUserId(teacherUserId);

        if (!course.getTeacherId().equals(teacher.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You don't have permission to update this course");
        }

        course.setCourseName(request.getCourseName());
        course.setDepartment(request.getDepartment());
        course.setSemester(request.getSemester());

        course = courseRepository.save(course);
        return mapToResponse(course);
    }

    @Transactional
    public void deleteCourse(UUID teacherUserId, UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        Teacher teacher = teacherService.getTeacherByUserId(teacherUserId);

        if (!course.getTeacherId().equals(teacher.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You don't have permission to delete this course");
        }

        courseRepository.delete(course);
    }

    @Transactional
    public void enrollStudent(UUID teacherUserId, UUID courseId, UUID studentId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        Teacher teacher = teacherService.getTeacherByUserId(teacherUserId);

        if (!course.getTeacherId().equals(teacher.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You don't have permission to modify this course");
        }

        if (!studentRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student not found");
        }

        if (enrollmentRepository.existsByCourseIdAndStudentId(courseId, studentId)) {
            throw new IllegalArgumentException("Student is already enrolled in this course");
        }

        CourseEnrollment enrollment = CourseEnrollment.builder()
                .courseId(courseId)
                .studentId(studentId)
                .build();
        enrollmentRepository.save(enrollment);
    }

    @Transactional
    public void removeStudent(UUID teacherUserId, UUID courseId, UUID studentId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        Teacher teacher = teacherService.getTeacherByUserId(teacherUserId);

        if (!course.getTeacherId().equals(teacher.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You don't have permission to modify this course");
        }

        enrollmentRepository.deleteByCourseIdAndStudentId(courseId, studentId);
    }

    public List<StudentResponse> getEnrolledStudents(UUID teacherUserId, UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        Teacher teacher = teacherService.getTeacherByUserId(teacherUserId);

        if (!course.getTeacherId().equals(teacher.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You don't have permission to view this course");
        }

        List<UUID> studentIds = enrollmentRepository.findByCourseId(courseId).stream()
                .map(CourseEnrollment::getStudentId)
                .collect(Collectors.toList());

        return studentRepository.findAllById(studentIds).stream()
                .map(student -> studentService.getStudentProfile(student.getUserId()))
                .collect(Collectors.toList());
    }

    private CourseResponse mapToResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .courseCode(course.getCourseCode())
                .courseName(course.getCourseName())
                .department(course.getDepartment())
                .semester(course.getSemester())
                .teacherId(course.getTeacherId())
                .build();
    }
}
