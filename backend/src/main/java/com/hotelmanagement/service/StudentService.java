package com.hotelmanagement.service;

import com.hotelmanagement.dto.StudentDTO;

import java.util.List;

/**
 * Student Service Interface - Business logic for Student operations
 */
public interface StudentService {
    
    List<StudentDTO> getAllStudents();
    
    StudentDTO getStudentById(Long id);
    
    StudentDTO createStudent(StudentDTO studentDTO);
    
    StudentDTO updateStudent(Long id, StudentDTO studentDTO);
    
    void deleteStudent(Long id);
    
    StudentDTO getStudentByEmail(String email);
}
