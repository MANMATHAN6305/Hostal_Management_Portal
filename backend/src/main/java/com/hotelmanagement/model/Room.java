package com.hotelmanagement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Room Entity - Represents a hostel room
 */
@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Room {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "room_number", unique = true, nullable = false, length = 10)
    private String roomNumber;
    
    @Column(name = "room_type", nullable = false)
    private String roomType; // SINGLE, DOUBLE, TRIPLE, DORMITORY
    
    @Column(name = "fee_per_semester", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerNight; // Fee per semester
    
    @Column(nullable = false)
    private String status = "AVAILABLE"; // AVAILABLE, OCCUPIED, MAINTENANCE
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private Integer capacity;
    
    @Column(name = "floor_number", nullable = false)
    private Integer floorNumber;
    
    @Column(name = "block_name", nullable = false, length = 50)
    private String blockName; // Block A, Block B, Boys Hostel, Girls Hostel
    
    @Column(length = 500)
    private String amenities; // Bed, Fan, Table, Chair, Cupboard
}
