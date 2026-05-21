package com.attendance.dto.request;

import com.attendance.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ModifyAttendanceRequest {
    @NotNull(message = "Status cannot be null")
    private AttendanceStatus status;
}
