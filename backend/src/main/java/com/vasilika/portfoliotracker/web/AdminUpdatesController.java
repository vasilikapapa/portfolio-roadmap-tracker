package com.vasilika.portfoliotracker.web;

import com.vasilika.portfoliotracker.service.admin.ProjectAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * =========================================
 * Admin Updates Controller
 * =========================================
 *
 * REST controller responsible for managing
 * project updates (dev logs, release notes)
 * from the admin side.
 *
 * Security:
 * - Intended for ADMIN-only access.
 *
 * Base path:
 *   /admin/updates
 */
@RestController
@RequestMapping("/admin/updates")
public class AdminUpdatesController {

    private final ProjectAdminService admin;

    /**
     * Constructor injection of admin service.
     */
    public AdminUpdatesController(ProjectAdminService admin) {
        this.admin = admin;
    }

    /**
     * Deletes a project update by ID.
     *
     * HTTP Method: DELETE
     * Endpoint: /admin/updates/{updateId}
     *
     * Returns:
     * - 204 No Content on successful deletion
     */
    @DeleteMapping("/{updateId}")
    public ResponseEntity<?> deleteUpdate(@PathVariable UUID updateId) {
        admin.deleteUpdate(updateId);
        return ResponseEntity.noContent().build();
    }
}