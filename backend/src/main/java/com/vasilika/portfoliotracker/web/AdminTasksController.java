package com.vasilika.portfoliotracker.web;

import com.vasilika.portfoliotracker.service.admin.ProjectAdminService;
import com.vasilika.portfoliotracker.web.dto.TaskDto;
import com.vasilika.portfoliotracker.web.dto.UpdateTaskRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin/tasks")
public class AdminTasksController {

    private final ProjectAdminService admin;

    public AdminTasksController(ProjectAdminService admin) {
        this.admin = admin;
    }

    @PatchMapping("/{taskId}")
    public TaskDto patch(@PathVariable UUID taskId, @RequestBody @Valid UpdateTaskRequest req) {
        return admin.patchTask(taskId, req);
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<?> delete(@PathVariable UUID taskId) {
        admin.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }
}

