package com.attendance.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class EnrollStudentRequest {

    @NotNull(message = "Student ID is required")
    private UUID studentId;
}
