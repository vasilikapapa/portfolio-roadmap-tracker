package com.vasilika.portfoliotracker.web;

import com.vasilika.portfoliotracker.domain.Project;
import com.vasilika.portfoliotracker.domain.Task;
import com.vasilika.portfoliotracker.domain.Update;
import com.vasilika.portfoliotracker.domain.enums.TaskPriority;
import com.vasilika.portfoliotracker.domain.enums.TaskStatus;
import com.vasilika.portfoliotracker.domain.enums.TaskType;
import com.vasilika.portfoliotracker.repo.ProjectRepository;
import com.vasilika.portfoliotracker.repo.TaskRepository;
import com.vasilika.portfoliotracker.repo.UpdateRepository;
import com.vasilika.portfoliotracker.web.dto.CreateProjectRequest;
import com.vasilika.portfoliotracker.web.dto.CreateTaskRequest;
import com.vasilika.portfoliotracker.web.dto.CreateUpdateRequest;
import com.vasilika.portfoliotracker.web.dto.TaskDto;
import com.vasilika.portfoliotracker.web.dto.UpdateDto;
import com.vasilika.portfoliotracker.web.mapper.TaskMapper;
import com.vasilika.portfoliotracker.web.mapper.UpdateMapper;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/admin/projects")
public class AdminProjectItemsController {

    private final ProjectRepository projects;
    private final TaskRepository tasks;
    private final UpdateRepository updates;

    public AdminProjectItemsController(ProjectRepository projects, TaskRepository tasks, UpdateRepository updates) {
        this.projects = projects;
        this.tasks = tasks;
        this.updates = updates;
    }

    /**
     * Create a new project (admin-only).
     *
     * POST /admin/projects
     * Body: { slug, name, summary?, description?, techStack?, repoUrl?, liveUrl? }
     */
    @PostMapping
    public ResponseEntity<Project> createProject(@Valid @RequestBody CreateProjectRequest req) {
        String slug = req.slug().trim();

        // Prevent duplicate slugs (unique key in DB is good too, but this gives a nicer 400)
        if (projects.existsBySlug(slug)) {
            throw new IllegalArgumentException("Slug already exists: " + slug);
        }

        Project p = new Project();
        p.setId(UUID.randomUUID()); // (optional) remove if your entity generates UUID automatically
        p.setSlug(slug);
        p.setName(req.name().trim());
        p.setSummary(req.summary());
        p.setDescription(req.description());
        p.setTechStack(req.techStack());
        p.setRepoUrl(req.repoUrl());
        p.setLiveUrl(req.liveUrl());
        p.setCreatedAt(Instant.now());
        p.setUpdatedAt(Instant.now());

        Project saved = projects.save(p);

        // Location points to the public details endpoint
        return ResponseEntity
                .created(URI.create("/api/projects/" + saved.getSlug()))
                .body(saved);
    }

    /**
     * Create a task under a project (admin-only).
     *
     * POST /admin/projects/{projectId}/tasks
     */
    @PostMapping("/{projectId}/tasks")
    public ResponseEntity<TaskDto> createTask(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest req
    ) {
        Project project = projects.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        Task t = new Task();
        t.setId(UUID.randomUUID()); // (optional) remove if entity generates UUID automatically
        t.setProject(project);
        t.setTitle(req.title());
        t.setDescription(req.description());

        t.setStatus(parseEnum(TaskStatus.class, req.status()));
        t.setType(parseEnum(TaskType.class, req.type()));
        t.setPriority(parseEnum(TaskPriority.class, req.priority()));

        t.setTargetVersion(req.targetVersion());
        t.setCreatedAt(Instant.now());
        t.setUpdatedAt(Instant.now());

        Task saved = tasks.save(t);

        return ResponseEntity
                .created(URI.create("/api/projects/" + project.getSlug()))
                .body(TaskMapper.toDto(saved));
    }

    /**
     * Create an update under a project (admin-only).
     *
     * POST /admin/projects/{projectId}/updates
     */
    @PostMapping("/{projectId}/updates")
    public ResponseEntity<UpdateDto> createUpdate(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateUpdateRequest req
    ) {
        Project project = projects.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        Update u = new Update();
        u.setId(UUID.randomUUID());
        u.setProject(project);
        u.setTitle(req.title());
        u.setBody(req.body());
        u.setCreatedAt(Instant.now());

        Update saved = updates.save(u);

        return ResponseEntity
                .created(URI.create("/api/projects/" + project.getSlug()))
                .body(UpdateMapper.toDto(saved));
    }

    /**
     * Delete a task under a project (admin-only).
     *
     * DELETE /admin/projects/{projectId}/tasks/{taskId}
     */
    @DeleteMapping("/{projectId}/tasks/{taskId}")
    public ResponseEntity<?> deleteTaskFromProject(@PathVariable UUID projectId, @PathVariable UUID taskId) {

        // Ensure task exists
        var taskOpt = tasks.findById(taskId);
        if (taskOpt.isEmpty()) return ResponseEntity.notFound().build();

        // Ensure task belongs to the project (prevents deleting someone else’s task)
        var task = taskOpt.get();
        if (!task.getProject().getId().equals(projectId)) return ResponseEntity.notFound().build();

        tasks.delete(task);
        return ResponseEntity.noContent().build();
    }

    /**
     * Helper for mapping string values to enums safely.
     * (We already handle IllegalArgumentException in your ApiExceptionHandler.)
     */
    private static <E extends Enum<E>> E parseEnum(Class<E> enumClass, String value) {
        return Enum.valueOf(enumClass, value.trim().toUpperCase(Locale.ROOT));
    }
}
