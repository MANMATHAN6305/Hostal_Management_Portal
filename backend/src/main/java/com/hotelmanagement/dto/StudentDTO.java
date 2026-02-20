package com.hotelmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Student DTO - Data Transfer Object for Student (hostel resident)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentDTO {
    
    private Long id;
    private String studentId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private String department;
    private Integer year;
    private LocalDate dateOfBirth;
    private String guardianName;
    private String guardianPhone;
    private String bloodGroup;
    private String gender;
}
