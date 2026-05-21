package com.attendance.service;

import com.attendance.dto.request.LoginRequest;
import com.attendance.dto.request.RegisterRequest;
import com.attendance.dto.response.AuthResponse;
import com.attendance.entity.Role;
import com.attendance.entity.Student;
import com.attendance.entity.Teacher;
import com.attendance.entity.Users;
import com.attendance.exception.UserAlreadyExistsException;
import com.attendance.repository.StudentRepository;
import com.attendance.repository.TeacherRepository;
import com.attendance.repository.UserRepository;
import com.attendance.security.CustomUserDetails;
import com.attendance.security.JwtUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final ActiveSessionService activeSessionService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists");
        }

        Users user = Users.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();
        
        user = userRepository.save(user);

        if (request.getRole() == Role.TEACHER) {
            if (teacherRepository.existsByEmployeeCode(request.getEmployeeCode())) {
                throw new UserAlreadyExistsException("Employee code already exists");
            }
            Teacher teacher = Teacher.builder()
                    .userId(user.getId())
                    .name(request.getName())
                    .department(request.getDepartment())
                    .employeeCode(request.getEmployeeCode())
                    .build();
            teacherRepository.save(teacher);
        } else if (request.getRole() == Role.STUDENT) {
            if (studentRepository.existsByRollNumber(request.getRollNumber())) {
                throw new UserAlreadyExistsException("Roll number already exists");
            }
            Student student = Student.builder()
                    .userId(user.getId())
                    .name(request.getName())
                    .rollNumber(request.getRollNumber())
                    .department(request.getDepartment())
                    .semester(request.getSemester())
                    .build();
            studentRepository.save(student);
        }

        return generateAuthResponse(user, "device-registration");
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Users user = userDetails.getUser();

        // Deactivate old sessions
        activeSessionService.deactivateAllSessionsForUser(user.getId());

        return generateAuthResponse(user, request.getDeviceId());
    }

    private AuthResponse generateAuthResponse(Users user, String deviceId) {
        String jti = UUID.randomUUID().toString();
        CustomUserDetails userDetails = new CustomUserDetails(user);
        
        String token = jwtUtil.generateToken(userDetails, user.getId().toString(), user.getRole().name(), deviceId, jti);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails, jti);

        activeSessionService.createSession(user.getId(), deviceId, jti);

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .role(user.getRole())
                .userId(user.getId())
                .build();
    }

    @Transactional
    public void logout(String jwtTokenId) {
        activeSessionService.deactivateSession(jwtTokenId);
    }
}
