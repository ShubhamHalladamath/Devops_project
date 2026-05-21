package com.attendance.repository;

import com.attendance.entity.CourseEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, UUID> {
    List<CourseEnrollment> findByCourseId(UUID courseId);
    List<CourseEnrollment> findByStudentId(UUID studentId);
    Optional<CourseEnrollment> findByCourseIdAndStudentId(UUID courseId, UUID studentId);
    boolean existsByCourseIdAndStudentId(UUID courseId, UUID studentId);
    void deleteByCourseIdAndStudentId(UUID courseId, UUID studentId);
}
