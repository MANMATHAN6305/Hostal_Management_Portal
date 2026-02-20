package com.hotelmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Room DTO - Data Transfer Object for Hostel Room
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomDTO {
    
    private Long id;
    private String roomNumber;
    private String roomType;
    private BigDecimal pricePerNight; // Fee per semester
    private String status;
    private String description;
    private Integer capacity;
    private Integer floorNumber;
    private String blockName;
    private String amenities;
}
