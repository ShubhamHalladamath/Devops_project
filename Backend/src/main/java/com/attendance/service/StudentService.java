package com.attendance.service;

import com.attendance.dto.request.UpdateProfileRequest;
import com.attendance.dto.response.StudentResponse;
import com.attendance.dto.response.UserResponse;
import com.attendance.entity.Student;
import com.attendance.entity.Users;
import com.attendance.exception.ResourceNotFoundException;
import com.attendance.repository.StudentRepository;
import com.attendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    public Student getStudentByUserId(UUID userId) {
        return studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for user ID: " + userId));
    }

    public StudentResponse getStudentProfile(UUID userId) {
        Student student = getStudentByUserId(userId);
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return StudentResponse.builder()
                .id(student.getId())
                .name(student.getName())
                .rollNumber(student.getRollNumber())
                .department(student.getDepartment())
                .semester(student.getSemester())
                .user(UserResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .build())
                .build();
    }

    @Transactional
    public StudentResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        Student student = getStudentByUserId(userId);

        if (request.getName() != null) {
            student.setName(request.getName());
        }
        if (request.getDepartment() != null) {
            student.setDepartment(request.getDepartment());
        }
        if (request.getSemester() != null) {
            student.setSemester(request.getSemester());
        }

        student = studentRepository.save(student);
        return getStudentProfile(userId);
    }
}
