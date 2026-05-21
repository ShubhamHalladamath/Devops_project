package com.attendance.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class StartSessionRequest {

    @NotNull(message = "Course ID is required")
    private UUID courseId;
}
