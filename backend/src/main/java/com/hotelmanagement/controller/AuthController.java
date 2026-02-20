package com.hotelmanagement.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hotelmanagement.dto.LoginRequest;
import com.hotelmanagement.dto.LoginResponse;
import com.hotelmanagement.dto.UserDTO;
import com.hotelmanagement.model.User;
import com.hotelmanagement.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002"})
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return userRepository.findByEmailAndPassword(request.getEmail(), request.getPassword())
                .map(user -> {
                    if (!user.getIsActive()) {
                        return ResponseEntity.ok(new LoginResponse(false, "Account is deactivated", null, null, null, null));
                    }
                    return ResponseEntity.ok(new LoginResponse(
                            true,
                            "Login successful",
                            user.getId(),
                            user.getFullName(),
                            user.getEmail(),
                            user.getRole()
                    ));
                })
                .orElse(ResponseEntity.ok(new LoginResponse(false, "Invalid email or password", null, null, null, null)));
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody UserDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            return ResponseEntity.ok(new LoginResponse(false, "Email already exists", null, null, null, null));
        }

        User user = new User();
        user.setFullName(userDTO.getFullName());
        user.setEmail(userDTO.getEmail());
        user.setPassword(userDTO.getPassword());
        user.setRole(userDTO.getRole() != null ? userDTO.getRole() : "STAFF");
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(new LoginResponse(
                true,
                "Registration successful",
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getRole()
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userRepository.findAll().stream()
                .map(user -> new UserDTO(
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        null, // Don't return password
                        user.getRole(),
                        user.getIsActive()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
}
