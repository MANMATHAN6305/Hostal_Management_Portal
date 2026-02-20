package com.hotelmanagement.service.impl;

import com.hotelmanagement.dto.StudentDTO;
import com.hotelmanagement.exception.ResourceNotFoundException;
import com.hotelmanagement.model.Student;
import com.hotelmanagement.repository.StudentRepository;
import com.hotelmanagement.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Student Service Implementation
 * Handles business logic for Student (hostel resident) operations
 */
@Service
@Transactional
public class StudentServiceImpl implements StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Override
    public List<StudentDTO> getAllStudents() {
        return studentRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public StudentDTO getStudentById(Long id) {
        Student student = studentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Student", id));
        return convertToDTO(student);
    }

    @Override
    public StudentDTO createStudent(StudentDTO studentDTO) {
        Student student = convertToEntity(studentDTO);
        Student savedStudent = studentRepository.save(student);
        return convertToDTO(savedStudent);
    }

    @Override
    public StudentDTO updateStudent(Long id, StudentDTO studentDTO) {
        Student existingStudent = studentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Student", id));
        
        existingStudent.setStudentId(studentDTO.getStudentId());
        existingStudent.setFirstName(studentDTO.getFirstName());
        existingStudent.setLastName(studentDTO.getLastName());
        existingStudent.setEmail(studentDTO.getEmail());
        existingStudent.setPhone(studentDTO.getPhone());
        existingStudent.setAddress(studentDTO.getAddress());
        existingStudent.setDepartment(studentDTO.getDepartment());
        existingStudent.setYear(studentDTO.getYear());
        existingStudent.setDateOfBirth(studentDTO.getDateOfBirth());
        existingStudent.setGuardianName(studentDTO.getGuardianName());
        existingStudent.setGuardianPhone(studentDTO.getGuardianPhone());
        existingStudent.setBloodGroup(studentDTO.getBloodGroup());
        existingStudent.setGender(studentDTO.getGender());
        
        Student updatedStudent = studentRepository.save(existingStudent);
        return convertToDTO(updatedStudent);
    }

    @Override
    public void deleteStudent(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Student", id);
        }
        studentRepository.deleteById(id);
    }

    @Override
    public StudentDTO getStudentByEmail(String email) {
        Student student = studentRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Student not found with email: " + email));
        return convertToDTO(student);
    }

    // Convert Entity to DTO
    private StudentDTO convertToDTO(Student student) {
        return new StudentDTO(
            student.getId(),
            student.getStudentId(),
            student.getFirstName(),
            student.getLastName(),
            student.getEmail(),
            student.getPhone(),
            student.getAddress(),
            student.getDepartment(),
            student.getYear(),
            student.getDateOfBirth(),
            student.getGuardianName(),
            student.getGuardianPhone(),
            student.getBloodGroup(),
            student.getGender()
        );
    }

    // Convert DTO to Entity
    private Student convertToEntity(StudentDTO dto) {
        Student student = new Student();
        student.setStudentId(dto.getStudentId());
        student.setFirstName(dto.getFirstName());
        student.setLastName(dto.getLastName());
        student.setEmail(dto.getEmail());
        student.setPhone(dto.getPhone());
        student.setAddress(dto.getAddress());
        student.setDepartment(dto.getDepartment());
        student.setYear(dto.getYear());
        student.setDateOfBirth(dto.getDateOfBirth());
        student.setGuardianName(dto.getGuardianName());
        student.setGuardianPhone(dto.getGuardianPhone());
        student.setBloodGroup(dto.getBloodGroup());
        student.setGender(dto.getGender());
        return student;
    }
}
