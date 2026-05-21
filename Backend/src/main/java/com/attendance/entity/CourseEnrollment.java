package com.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "course_enrollment", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"courseId", "studentId"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID courseId;

    @Column(nullable = false)
    private UUID studentId;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime enrolledAt;
}
