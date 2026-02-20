package com.hotelmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Allocation DTO - Data Transfer Object for Room Allocation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AllocationDTO {
    
    private Long id;
    private Long roomId;
    private Long studentId;
    private LocalDate allocationDate;
    private LocalDate endDate;
    private String status;
    private String academicYear;
    private String semester;
    private String specialRequests;
    
    // Additional fields for display
    private String roomNumber;
    private String studentName;
    private String blockName;
}
