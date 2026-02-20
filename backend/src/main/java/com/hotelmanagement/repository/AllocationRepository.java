package com.hotelmanagement.repository;

import com.hotelmanagement.model.Allocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Allocation Repository - Data access layer for Allocation entity
 * Table: allocations
 */
@Repository
public interface AllocationRepository extends JpaRepository<Allocation, Long> {
    
    // Find allocations by student ID
    List<Allocation> findByStudentId(Long studentId);
    
    // Find allocations by room ID
    List<Allocation> findByRoomId(Long roomId);
    
    // Find allocations by status
    List<Allocation> findByStatus(String status);
    
    // Find allocations by allocation date
    List<Allocation> findByAllocationDate(LocalDate allocationDate);
    
    // Find allocations between dates
    List<Allocation> findByAllocationDateBetween(LocalDate startDate, LocalDate endDate);
    
    // Check if room is allocated for given dates
    @Query("SELECT a FROM Allocation a WHERE a.room.id = :roomId " +
           "AND a.status NOT IN ('VACATED', 'CANCELLED') " +
           "AND ((a.allocationDate <= :endDate AND a.endDate >= :allocationDate))")
    List<Allocation> findConflictingAllocations(
        @Param("roomId") Long roomId,
        @Param("allocationDate") LocalDate allocationDate,
        @Param("endDate") LocalDate endDate
    );
    
    // Find active allocations
    @Query("SELECT a FROM Allocation a WHERE a.status = 'ACTIVE' ORDER BY a.allocationDate ASC")
    List<Allocation> findActiveAllocations();
    
    // Find allocations by academic year
    List<Allocation> findByAcademicYear(String academicYear);
    
    // Find allocations by semester
    List<Allocation> findBySemester(String semester);
}
