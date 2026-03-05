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
import com.vasilika.portfoliotracker.service.DemoSeederService;
import com.vasilika.portfoliotracker.web.dto.*;
import com.vasilika.portfoliotracker.web.mapper.ProjectMapper;
import com.vasilika.portfoliotracker.web.mapper.TaskMapper;
import com.vasilika.portfoliotracker.web.mapper.UpdateMapper;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * ==========================================================
 * DemoProjectItemsController (DEMO SANDBOX)
 * ==========================================================
 *
 * Base path:
 *   /demo/projects
 *
 * Rules:
 * - All projects created here are demo-only (Project.demo = true)
 * - All operations here MUST only affect demo projects
 * - This prevents any demo account from touching real admin data
 */
@RestController
@RequestMapping("/demo/projects")
public class DemoProjectItemsController {

    private final ProjectRepository projects;
    private final TaskRepository tasks;
    private final UpdateRepository updates;
    private final DemoSeederService demoSeeder;

    public DemoProjectItemsController(
            ProjectRepository projects,
            TaskRepository tasks,
            UpdateRepository updates,
            DemoSeederService demoSeeder
    ) {
        this.projects = projects;
        this.tasks = tasks;
        this.updates = updates;
        this.demoSeeder = demoSeeder;
    }

    /**
     * List DEMO projects.
     *
     * GET /demo/projects
     *
     * Used by:
     * - DemoHomePage / demo projects list UI
     *
     * NOTE:
     * - If demo is empty, we seed it from admin projects so recruiters see something immediately.
     */
    @GetMapping
    public List<ProjectDto> listDemoProjects() {

        return projects.findAllByDemoTrueOrderByCreatedAtDesc()
                .stream()
                .map(ProjectMapper::toDto)
                .toList();
    }

    /**
     * Get DEMO project details by slug (project + tasks + updates).
     *
     * GET /demo/projects/{slug}
     *
     * Used by:
     * - DemoProjectDetailsPage
     */
    @GetMapping("/{slug}")
    public ProjectDetailsDto getDemoProjectDetails(@PathVariable String slug) {

        Project project = projects.findBySlugAndDemo(slug, true)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Demo project not found: " + slug
                ));

        // Tasks
        var taskDtos = tasks.findByProject_Id(project.getId())
                .stream()
                .sorted((a, b) -> {
                    int sa = a.getStatus().ordinal();
                    int sb = b.getStatus().ordinal();
                    if (sa != sb) return Integer.compare(sa, sb);
                    return a.getCreatedAt().compareTo(b.getCreatedAt());
                })
                .map(TaskMapper::toDto)
                .toList();

        // Updates newest first
        var updateDtos = updates.findByProject_IdOrderByCreatedAtDesc(project.getId())
                .stream()
                .map(UpdateMapper::toDto)
                .toList();

        return new ProjectDetailsDto(
                ProjectMapper.toDto(project),
                taskDtos,
                updateDtos
        );
    }

    /**
     * Create a new DEMO project.
     *
     * POST /demo/projects
     * Body: { slug, name, summary?, description?, techStack?, repoUrl?, liveUrl? }
     *
     * Important:
     * - slug uniqueness is enforced INSIDE demo namespace
     */
    @PostMapping
    public ResponseEntity<ProjectDto> createDemoProject(@Valid @RequestBody CreateProjectRequest req) {
        String slug = req.slug().trim();

        //Demo-only uniqueness check
        if (projects.existsBySlugAndDemo(slug, true)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Demo slug already exists: " + slug);
        }

        Project p = new Project();
        // Remove these setId calls if your entity uses @GeneratedValue
        p.setId(UUID.randomUUID());

        p.setDemo(true);            // ✅ force sandbox
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

        // Location can point to demo view (frontend uses /demo/projects/:slug)
        return ResponseEntity
                .created(URI.create("/demo/projects/" + saved.getSlug()))
                .body(ProjectMapper.toDto(saved));
    }

    /**
     * Create a task under a DEMO project.
     *
     * POST /demo/projects/{projectId}/tasks
     */
    @PostMapping("/{projectId}/tasks")
    public ResponseEntity<TaskDto> createDemoTask(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest req
    ) {
        Project project = projects.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found: " + projectId));

        // ✅ Hard stop if someone tries to use demo endpoints on real projectId
        if (!project.isDemo()) return ResponseEntity.notFound().build();

        Task t = new Task();
        t.setId(UUID.randomUUID());
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
                .created(URI.create("/demo/projects/" + project.getSlug()))
                .body(TaskMapper.toDto(saved));
    }

    /**
     * Create an update under a DEMO project.
     *
     * POST /demo/projects/{projectId}/updates
     */
    @PostMapping("/{projectId}/updates")
    public ResponseEntity<UpdateDto> createDemoUpdate(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateUpdateRequest req
    ) {
        Project project = projects.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found: " + projectId));

        // ✅ Sandbox protection
        if (!project.isDemo()) return ResponseEntity.notFound().build();

        Update u = new Update();
        u.setId(UUID.randomUUID());
        u.setProject(project);
        u.setTitle(req.title());
        u.setBody(req.body());
        u.setCreatedAt(Instant.now());

        Update saved = updates.save(u);

        return ResponseEntity
                .created(URI.create("/demo/projects/" + project.getSlug()))
                .body(UpdateMapper.toDto(saved));
    }

    /**
     * Delete a task from a DEMO project.
     *
     * DELETE /demo/projects/{projectId}/tasks/{taskId}
     */
    @DeleteMapping("/{projectId}/tasks/{taskId}")
    public ResponseEntity<?> deleteDemoTask(@PathVariable UUID projectId, @PathVariable UUID taskId) {

        var projectOpt = projects.findById(projectId);
        if (projectOpt.isEmpty() || !projectOpt.get().isDemo()) return ResponseEntity.notFound().build();

        var taskOpt = tasks.findById(taskId);
        if (taskOpt.isEmpty()) return ResponseEntity.notFound().build();

        var task = taskOpt.get();

        // ensure task belongs to this project
        if (!task.getProject().getId().equals(projectId)) return ResponseEntity.notFound().build();

        tasks.delete(task);
        return ResponseEntity.noContent().build();
    }

    /**
     * Update a DEMO task (status, type, priority, title/description, etc).
     *
     * PATCH /demo/projects/{projectId}/tasks/{taskId}
     */
    @PatchMapping("/{projectId}/tasks/{taskId}")
    public ResponseEntity<TaskDto> updateDemoTask(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest req
    ) {
        var projectOpt = projects.findById(projectId);
        if (projectOpt.isEmpty() || !projectOpt.get().isDemo()) return ResponseEntity.notFound().build();

        Task t = tasks.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found: " + taskId));

        if (!t.getProject().getId().equals(projectId)) return ResponseEntity.notFound().build();

        if (req.title() != null) t.setTitle(req.title());
        if (req.description() != null) t.setDescription(req.description());
        if (req.status() != null) t.setStatus(parseEnum(TaskStatus.class, req.status()));
        if (req.type() != null) t.setType(parseEnum(TaskType.class, req.type()));
        if (req.priority() != null) t.setPriority(parseEnum(TaskPriority.class, req.priority()));
        if (req.targetVersion() != null) t.setTargetVersion(req.targetVersion());

        t.setUpdatedAt(Instant.now());

        return ResponseEntity.ok(TaskMapper.toDto(tasks.save(t)));
    }

    /**
     * Delete a DEMO update.
     *
     * DELETE /demo/projects/{projectId}/updates/{updateId}
     */
    @DeleteMapping("/{projectId}/updates/{updateId}")
    public ResponseEntity<?> deleteDemoUpdate(@PathVariable UUID projectId, @PathVariable UUID updateId) {

        var projectOpt = projects.findById(projectId);
        if (projectOpt.isEmpty() || !projectOpt.get().isDemo()) return ResponseEntity.notFound().build();

        var updateOpt = updates.findById(updateId);
        if (updateOpt.isEmpty()) return ResponseEntity.notFound().build();

        var u = updateOpt.get();
        if (!u.getProject().getId().equals(projectId)) return ResponseEntity.notFound().build();

        updates.delete(u);
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete a DEMO project.
     *
     * DELETE /demo/projects/{projectId}
     *
     * Tasks/updates removed via DB cascade
     */
    @DeleteMapping("/{projectId}")
    public ResponseEntity<?> deleteDemoProject(@PathVariable UUID projectId) {

        var projectOpt = projects.findById(projectId);
        if (projectOpt.isEmpty() || !projectOpt.get().isDemo()) return ResponseEntity.notFound().build();

        projects.deleteById(projectId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Clear ALL demo data.
     *
     * POST /demo/reset
     *
     * Deletes all projects where demo = true.
     * Tasks/updates cascade automatically.
     */
    @PostMapping("/reset")
    public ResponseEntity<?> resetDemo() {

        projects.deleteAllByDemoTrue();

        return ResponseEntity.noContent().build();
    }
    /**
     * Helper: map strings to enums safely.
     */
    private static <E extends Enum<E>> E parseEnum(Class<E> enumClass, String value) {
        return Enum.valueOf(enumClass, value.trim().toUpperCase(Locale.ROOT));
    }


}