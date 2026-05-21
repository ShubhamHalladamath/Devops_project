package com.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class CourseResponse {
    private UUID id;
    private String courseCode;
    private String courseName;
    private String department;
    private Integer semester;
    private UUID teacherId;
}
