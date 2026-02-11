package com.vasilika.portfoliotracker.web;

import com.vasilika.portfoliotracker.repo.UpdateRepository;
import com.vasilika.portfoliotracker.service.admin.ProjectAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin/updates")
public class AdminUpdatesController {

    private final ProjectAdminService admin;

    public AdminUpdatesController(ProjectAdminService admin) {
        this.admin = admin;
    }

    @DeleteMapping("/{updateId}")
    public ResponseEntity<?> deleteUpdate(@PathVariable UUID updateId) {
        admin.deleteUpdate(updateId);
        return ResponseEntity.noContent().build();
    }
}
