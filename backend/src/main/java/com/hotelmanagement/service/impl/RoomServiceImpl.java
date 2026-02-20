package com.hotelmanagement.service.impl;

import com.hotelmanagement.dto.RoomDTO;
import com.hotelmanagement.exception.ResourceNotFoundException;
import com.hotelmanagement.model.Room;
import com.hotelmanagement.repository.RoomRepository;
import com.hotelmanagement.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Room Service Implementation
 */
@Service
@Transactional
public class RoomServiceImpl implements RoomService {

    @Autowired
    private RoomRepository roomRepository;

    @Override
    public List<RoomDTO> getAllRooms() {
        return roomRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public RoomDTO getRoomById(Long id) {
        Room room = roomRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Room", id));
        return convertToDTO(room);
    }

    @Override
    public RoomDTO createRoom(RoomDTO roomDTO) {
        Room room = convertToEntity(roomDTO);
        Room savedRoom = roomRepository.save(room);
        return convertToDTO(savedRoom);
    }

    @Override
    public RoomDTO updateRoom(Long id, RoomDTO roomDTO) {
        Room existingRoom = roomRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Room", id));
        
        existingRoom.setRoomNumber(roomDTO.getRoomNumber());
        existingRoom.setRoomType(roomDTO.getRoomType());
        existingRoom.setPricePerNight(roomDTO.getPricePerNight());
        existingRoom.setStatus(roomDTO.getStatus());
        existingRoom.setDescription(roomDTO.getDescription());
        existingRoom.setCapacity(roomDTO.getCapacity());
        existingRoom.setFloorNumber(roomDTO.getFloorNumber());
        existingRoom.setBlockName(roomDTO.getBlockName());
        existingRoom.setAmenities(roomDTO.getAmenities());
        
        Room updatedRoom = roomRepository.save(existingRoom);
        return convertToDTO(updatedRoom);
    }

    @Override
    public void deleteRoom(Long id) {
        if (!roomRepository.existsById(id)) {
            throw new ResourceNotFoundException("Room", id);
        }
        roomRepository.deleteById(id);
    }

    @Override
    public List<RoomDTO> getAvailableRooms() {
        return roomRepository.findByStatus("AVAILABLE").stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    // Convert Entity to DTO
    private RoomDTO convertToDTO(Room room) {
        return new RoomDTO(
            room.getId(),
            room.getRoomNumber(),
            room.getRoomType(),
            room.getPricePerNight(),
            room.getStatus(),
            room.getDescription(),
            room.getCapacity(),
            room.getFloorNumber(),
            room.getBlockName(),
            room.getAmenities()
        );
    }

    // Convert DTO to Entity
    private Room convertToEntity(RoomDTO dto) {
        Room room = new Room();
        room.setRoomNumber(dto.getRoomNumber());
        room.setRoomType(dto.getRoomType());
        room.setPricePerNight(dto.getPricePerNight());
        room.setStatus(dto.getStatus() != null ? dto.getStatus() : "AVAILABLE");
        room.setDescription(dto.getDescription());
        room.setCapacity(dto.getCapacity());
        room.setFloorNumber(dto.getFloorNumber());
        room.setBlockName(dto.getBlockName());
        room.setAmenities(dto.getAmenities());
        return room;
    }
}
