package com.hotelmanagement.repository;

import com.hotelmanagement.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Room Repository - Data access layer for Room entity
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    
    // Find room by room number
    Optional<Room> findByRoomNumber(String roomNumber);
    
    // Check if room number exists
    boolean existsByRoomNumber(String roomNumber);
    
    // Find rooms by status
    List<Room> findByStatus(String status);
    
    // Find available rooms
    List<Room> findByStatusOrderByRoomNumberAsc(String status);
    
    // Find rooms by type
    List<Room> findByRoomType(String roomType);
    
    // Find rooms by capacity greater than or equal
    List<Room> findByCapacityGreaterThanEqual(Integer capacity);
}
