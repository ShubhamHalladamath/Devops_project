package com.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "attendance_record", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"sessionId", "studentId"}),
        @UniqueConstraint(columnNames = {"sessionId", "deviceFingerprint"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID sessionId;

    @Column(nullable = false)
    private UUID studentId;

    @Column(nullable = false)
    private String deviceFingerprint;

    private String ipAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceStatus status;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime markedAt;
}
