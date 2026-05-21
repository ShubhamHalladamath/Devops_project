package com.attendance.dto.response;

import com.attendance.entity.AttendanceStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AttendanceHistoryResponse {
    private UUID sessionId;
    private UUID courseId;
    private String courseName;
    private String courseCode;
    private LocalDateTime sessionDate;
    private AttendanceStatus status;
}
