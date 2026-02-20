package com.hotelmanagement.service;

import com.hotelmanagement.dto.AllocationDTO;

import java.util.List;

/**
 * Allocation Service Interface - Business logic for Room Allocation operations
 */
public interface AllocationService {
    
    List<AllocationDTO> getAllAllocations();
    
    AllocationDTO getAllocationById(Long id);
    
    AllocationDTO createAllocation(AllocationDTO allocationDTO);
    
    AllocationDTO updateAllocation(Long id, AllocationDTO allocationDTO);
    
    void deleteAllocation(Long id);
    
    List<AllocationDTO> getAllocationsByStudentId(Long studentId);
}
