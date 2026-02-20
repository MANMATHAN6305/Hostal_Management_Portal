package com.hotelmanagement.service.impl;

import com.hotelmanagement.dto.AllocationDTO;
import com.hotelmanagement.exception.ResourceNotFoundException;
import com.hotelmanagement.model.Allocation;
import com.hotelmanagement.model.Student;
import com.hotelmanagement.model.Room;
import com.hotelmanagement.repository.AllocationRepository;
import com.hotelmanagement.repository.StudentRepository;
import com.hotelmanagement.repository.RoomRepository;
import com.hotelmanagement.service.AllocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Allocation Service Implementation
 * Handles business logic for Room Allocation operations
 */
@Service
@Transactional
public class AllocationServiceImpl implements AllocationService {

    @Autowired
    private AllocationRepository allocationRepository;
    
    @Autowired
    private RoomRepository roomRepository;
    
    @Autowired
    private StudentRepository studentRepository;

    @Override
    public List<AllocationDTO> getAllAllocations() {
        return allocationRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public AllocationDTO getAllocationById(Long id) {
        Allocation allocation = allocationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Allocation", id));
        return convertToDTO(allocation);
    }

    @Override
    public AllocationDTO createAllocation(AllocationDTO allocationDTO) {
        Room room = roomRepository.findById(allocationDTO.getRoomId())
            .orElseThrow(() -> new ResourceNotFoundException("Room", allocationDTO.getRoomId()));
        
        Student student = studentRepository.findById(allocationDTO.getStudentId())
            .orElseThrow(() -> new ResourceNotFoundException("Student", allocationDTO.getStudentId()));
        
        Allocation allocation = new Allocation();
        allocation.setRoom(room);
        allocation.setStudent(student);
        allocation.setAllocationDate(allocationDTO.getAllocationDate());
        allocation.setEndDate(allocationDTO.getEndDate());
        allocation.setStatus(allocationDTO.getStatus() != null ? allocationDTO.getStatus() : "ACTIVE");
        allocation.setAcademicYear(allocationDTO.getAcademicYear());
        allocation.setSemester(allocationDTO.getSemester());
        allocation.setSpecialRequests(allocationDTO.getSpecialRequests());
        
        Allocation savedAllocation = allocationRepository.save(allocation);
        return convertToDTO(savedAllocation);
    }

    @Override
    public AllocationDTO updateAllocation(Long id, AllocationDTO allocationDTO) {
        Allocation existingAllocation = allocationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Allocation", id));
        
        if (allocationDTO.getRoomId() != null) {
            Room room = roomRepository.findById(allocationDTO.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room", allocationDTO.getRoomId()));
            existingAllocation.setRoom(room);
        }
        
        if (allocationDTO.getStudentId() != null) {
            Student student = studentRepository.findById(allocationDTO.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", allocationDTO.getStudentId()));
            existingAllocation.setStudent(student);
        }
        
        existingAllocation.setAllocationDate(allocationDTO.getAllocationDate());
        existingAllocation.setEndDate(allocationDTO.getEndDate());
        existingAllocation.setStatus(allocationDTO.getStatus());
        existingAllocation.setAcademicYear(allocationDTO.getAcademicYear());
        existingAllocation.setSemester(allocationDTO.getSemester());
        existingAllocation.setSpecialRequests(allocationDTO.getSpecialRequests());
        
        Allocation updatedAllocation = allocationRepository.save(existingAllocation);
        return convertToDTO(updatedAllocation);
    }

    @Override
    public void deleteAllocation(Long id) {
        if (!allocationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Allocation", id);
        }
        allocationRepository.deleteById(id);
    }

    @Override
    public List<AllocationDTO> getAllocationsByStudentId(Long studentId) {
        return allocationRepository.findByStudentId(studentId).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    // Convert Entity to DTO
    private AllocationDTO convertToDTO(Allocation allocation) {
        AllocationDTO dto = new AllocationDTO();
        dto.setId(allocation.getId());
        dto.setRoomId(allocation.getRoom().getId());
        dto.setStudentId(allocation.getStudent().getId());
        dto.setAllocationDate(allocation.getAllocationDate());
        dto.setEndDate(allocation.getEndDate());
        dto.setStatus(allocation.getStatus());
        dto.setAcademicYear(allocation.getAcademicYear());
        dto.setSemester(allocation.getSemester());
        dto.setSpecialRequests(allocation.getSpecialRequests());
        
        // Additional display fields
        dto.setRoomNumber(allocation.getRoom().getRoomNumber());
        dto.setStudentName(allocation.getStudent().getFirstName() + " " + allocation.getStudent().getLastName());
        dto.setBlockName(allocation.getRoom().getBlockName());
        
        return dto;
    }
}
