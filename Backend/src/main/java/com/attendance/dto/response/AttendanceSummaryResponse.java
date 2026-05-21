package com.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AttendanceSummaryResponse {
    private UUID courseId;
    private String courseName;
    private Integer totalClasses;
    private Integer attended;
    private Double percentage;
}
