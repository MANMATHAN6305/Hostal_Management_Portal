package com.hotelmanagement.repository;

import com.hotelmanagement.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Student Repository - Data access layer for Student entity
 * Table: students
 */
@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    
    // Find student by email
    Optional<Student> findByEmail(String email);
    
    // Check if email already exists
    boolean existsByEmail(String email);
    
    // Find student by student ID
    Optional<Student> findByStudentId(String studentId);
    
    // Check if student ID already exists
    boolean existsByStudentId(String studentId);
}
