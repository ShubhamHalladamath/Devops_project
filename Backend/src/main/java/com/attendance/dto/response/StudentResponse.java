package com.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class StudentResponse {
    private UUID id;
    private String name;
    private String rollNumber;
    private String department;
    private Integer semester;
    private UserResponse user;
}
