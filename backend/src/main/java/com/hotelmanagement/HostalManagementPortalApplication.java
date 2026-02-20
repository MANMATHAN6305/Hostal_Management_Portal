package com.hotelmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * College Hostel Management Portal - Main Application
 * Spring Boot Application Entry Point
 * 
 * Database Tables:
 * - students: Student records
 * - rooms: Hostel room records
 * - allocations: Room allocation records
 * - users: Login/authentication records
 */
@SpringBootApplication
public class HostalManagementPortalApplication {

    public static void main(String[] args) {
        System.out.println("Starting College Hostel Management Portal...");
        SpringApplication.run(HostalManagementPortalApplication.class, args);
    }
}

