package com.hotelmanagement.service;

import com.hotelmanagement.dto.RoomDTO;

import java.util.List;

/**
 * Room Service Interface
 */
public interface RoomService {
    
    List<RoomDTO> getAllRooms();
    
    RoomDTO getRoomById(Long id);
    
    RoomDTO createRoom(RoomDTO roomDTO);
    
    RoomDTO updateRoom(Long id, RoomDTO roomDTO);
    
    void deleteRoom(Long id);
    
    List<RoomDTO> getAvailableRooms();
}
