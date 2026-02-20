package com.hotelmanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hotelmanagement.dto.AllocationDTO;
import com.hotelmanagement.service.AllocationService;

/**
 * Allocation Controller - Handle room allocation API endpoints Manages hostel
 * room allocations for students
 *
 * API Endpoints: GET /api/allocations - Get all allocations GET
 * /api/allocations/{id} - Get allocation by ID POST /api/allocations - Create
 * new allocation PUT /api/allocations/{id} - Update allocation DELETE
 * /api/allocations/{id} - Delete allocation
 */
@RestController
@RequestMapping("/api/allocations")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002"})
public class AllocationController {

    @Autowired
    private AllocationService allocationService;

    @GetMapping
    public ResponseEntity<List<AllocationDTO>> getAllAllocations() {
        return ResponseEntity.ok(allocationService.getAllAllocations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AllocationDTO> getAllocationById(@PathVariable Long id) {
        return ResponseEntity.ok(allocationService.getAllocationById(id));
    }

    @PostMapping
    public ResponseEntity<AllocationDTO> createAllocation(@RequestBody AllocationDTO allocationDTO) {
        return ResponseEntity.ok(allocationService.createAllocation(allocationDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AllocationDTO> updateAllocation(@PathVariable Long id, @RequestBody AllocationDTO allocationDTO) {
        return ResponseEntity.ok(allocationService.updateAllocation(id, allocationDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAllocation(@PathVariable Long id) {
        allocationService.deleteAllocation(id);
        return ResponseEntity.noContent().build();
    }
}
