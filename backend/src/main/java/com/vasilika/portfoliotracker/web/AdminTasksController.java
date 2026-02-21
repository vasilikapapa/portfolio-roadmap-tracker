package com.vasilika.portfoliotracker.web;

import com.vasilika.portfoliotracker.service.admin.ProjectAdminService;
import com.vasilika.portfoliotracker.web.dto.TaskDto;
import com.vasilika.portfoliotracker.web.dto.UpdateTaskRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * =========================================
 * Admin Tasks Controller
 * =========================================
 *
 * REST controller responsible for
 * administrative task operations.
 *
 * Secured via Spring Security:
 * - Accessible only to users with ADMIN role.
 *
 * Base path:
 *   /admin/tasks
 */
@RestController
@RequestMapping("/admin/tasks")
public class AdminTasksController {

    private final ProjectAdminService admin;

    /**
     * Constructor injection of admin service.
     */
    public AdminTasksController(ProjectAdminService admin) {
        this.admin = admin;
    }

    /**
     * Partially updates a task.
     *
     * HTTP Method: PATCH
     * Endpoint: /admin/tasks/{taskId}
     *
     * Accepts:
     * - UpdateTaskRequest (validated)
     *
     * Returns:
     * - Updated TaskDto
     */
    @PatchMapping("/{taskId}")
    public TaskDto patch(
            @PathVariable UUID taskId,
            @RequestBody @Valid UpdateTaskRequest req
    ) {
        return admin.patchTask(taskId, req);
    }

    /**
     * Deletes a task by ID.
     *
     * HTTP Method: DELETE
     * Endpoint: /admin/tasks/{taskId}
     *
     * Returns:
     * - 204 No Content on success
     */
    @DeleteMapping("/{taskId}")
    public ResponseEntity<?> delete(@PathVariable UUID taskId) {
        admin.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }
}