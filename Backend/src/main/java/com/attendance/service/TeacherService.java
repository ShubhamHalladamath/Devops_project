package com.attendance.service;

import com.attendance.dto.request.UpdateProfileRequest;
import com.attendance.dto.response.TeacherResponse;
import com.attendance.dto.response.UserResponse;
import com.attendance.entity.Teacher;
import com.attendance.entity.Users;
import com.attendance.exception.ResourceNotFoundException;
import com.attendance.repository.TeacherRepository;
import com.attendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;

    public Teacher getTeacherByUserId(UUID userId) {
        return teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found for user ID: " + userId));
    }

    public TeacherResponse getTeacherProfile(UUID userId) {
        Teacher teacher = getTeacherByUserId(userId);
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return TeacherResponse.builder()
                .id(teacher.getId())
                .name(teacher.getName())
                .department(teacher.getDepartment())
                .employeeCode(teacher.getEmployeeCode())
                .user(UserResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .build())
                .build();
    }

    @Transactional
    public TeacherResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        Teacher teacher = getTeacherByUserId(userId);
        
        if (request.getName() != null) {
            teacher.setName(request.getName());
        }
        if (request.getDepartment() != null) {
            teacher.setDepartment(request.getDepartment());
        }

        teacher = teacherRepository.save(teacher);
        return getTeacherProfile(userId);
    }
}
