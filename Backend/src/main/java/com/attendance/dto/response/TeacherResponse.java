package com.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class TeacherResponse {
    private UUID id;
    private String name;
    private String department;
    private String employeeCode;
    private UserResponse user;
}
