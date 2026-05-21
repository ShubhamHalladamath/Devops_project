package com.attendance.dto.response;

import com.attendance.entity.AttendanceStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AttendanceRecordResponse {
    private UUID studentId;
    private String studentName;
    private String rollNumber;
    private AttendanceStatus status;
    private LocalDateTime markedAt;
}
