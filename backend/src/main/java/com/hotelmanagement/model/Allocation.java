package com.hotelmanagement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Allocation Entity - Represents a hostel room allocation for students
 * Table: allocations
 */
@Entity
@Table(name = "allocations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Allocation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;
    
    @Column(name = "allocation_date", nullable = false)
    private LocalDate allocationDate;
    
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
    
    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, VACATED, PENDING
    
    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear; // 2024-2025
    
    @Column(name = "semester", nullable = false, length = 20)
    private String semester; // ODD, EVEN
    
    @Column(name = "special_requests", columnDefinition = "TEXT")
    private String specialRequests;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
