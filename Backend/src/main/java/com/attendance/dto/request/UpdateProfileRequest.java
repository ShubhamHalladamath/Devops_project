package com.attendance.dto.request;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String name;
    private String department;
    private Integer semester; // Only for Student
}
