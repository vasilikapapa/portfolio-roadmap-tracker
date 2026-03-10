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
import com.vasilika.portfoliotracker.web.dto.*;
import com.vasilika.portfoliotracker.web.mapper.TaskMapper;
import com.vasilika.portfoliotracker.web.mapper.UpdateMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.vasilika.portfoliotracker.domain.PlanningItem;
import com.vasilika.portfoliotracker.repo.PlanningItemRepository;
import com.vasilika.portfoliotracker.web.dto.PlanningItemDto;
import com.vasilika.portfoliotracker.web.dto.SavePlanningBoardItemRequest;
import com.vasilika.portfoliotracker.web.dto.SavePlanningBoardRequest;
import com.vasilika.portfoliotracker.web.mapper.PlanningItemMapper;
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
    private final PlanningItemRepository planningItems;

    public AdminProjectItemsController(ProjectRepository projects, TaskRepository tasks, UpdateRepository updates,  PlanningItemRepository planningItems) {
        this.projects = projects;
        this.tasks = tasks;
        this.updates = updates;
        this.planningItems = planningItems;
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

        // Admin creates REAL projects only (demo = false)
        if (projects.existsBySlugAndDemo(slug, false)) {
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
        p.setDemo(false);

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

        // Optional related task
        if (req.taskId() != null) {
            Task task = tasks.findById(req.taskId())
                    .orElseThrow(() -> new IllegalArgumentException("Task not found: " + req.taskId()));

            if (!task.getProject().getId().equals(projectId)) {
                throw new IllegalArgumentException("Task does not belong to project: " + projectId);
            }

            u.setTask(task);
        }

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
     * Partially update an existing project.
     *
     * PATCH /admin/projects/{projectId}
     *
     * Only non-null fields from the request are applied.
     * Slug uniqueness is enforced.
     */
    @PatchMapping("/{projectId}")
    public ResponseEntity<Project> updateProject(
            @PathVariable UUID projectId,
            @Valid @RequestBody UpdateProjectRequest req
    ) {

        // Fetch project or fail fast
        Project p = projects.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        // Handle slug change safely (must remain unique)
        if (req.slug() != null && !req.slug().trim().equalsIgnoreCase(p.getSlug())) {
            String newSlug = req.slug().trim();

            if (projects.existsBySlugAndDemo(newSlug, false)) {
                throw new IllegalArgumentException("Slug already exists: " + newSlug);
            }

            p.setSlug(newSlug);
        }

        // Apply partial updates
        if (req.name() != null) p.setName(req.name().trim());
        if (req.summary() != null) p.setSummary(req.summary());
        if (req.description() != null) p.setDescription(req.description());
        if (req.techStack() != null) p.setTechStack(req.techStack());
        if (req.repoUrl() != null) p.setRepoUrl(req.repoUrl());
        if (req.liveUrl() != null) p.setLiveUrl(req.liveUrl());

        p.setUpdatedAt(Instant.now());

        return ResponseEntity.ok(projects.save(p));
    }

    /**
     * Delete a project.
     *
     * DELETE /admin/projects/{projectId}
     *
     * Tasks and updates are deleted automatically due to
     * ON DELETE CASCADE foreign key constraint in the database.
     */
    @DeleteMapping("/{projectId}")
    public ResponseEntity<?> deleteProject(@PathVariable UUID projectId) {

        if (!projects.existsById(projectId)) {
            return ResponseEntity.notFound().build();
        }

        projects.deleteById(projectId);

        return ResponseEntity.noContent().build();
    }

    /**
     * Update a task.
     *
     * PATCH /admin/projects/{projectId}/tasks/{taskId}
     *
     * Supports:
     * - Moving task between statuses (Kanban board behavior)
     * - Updating priority, type, targetVersion
     * - Editing title/description
     */
    @PatchMapping("/{projectId}/tasks/{taskId}")
    public ResponseEntity<TaskDto> updateTask(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest req
    ) {

        Task t = tasks.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));

        // Ensure task belongs to this project
        if (!t.getProject().getId().equals(projectId)) {
            return ResponseEntity.notFound().build();
        }

        // Update only provided fields
        if (req.title() != null) t.setTitle(req.title());
        if (req.description() != null) t.setDescription(req.description());

        if (req.status() != null)
            t.setStatus(parseEnum(TaskStatus.class, req.status()));

        if (req.type() != null)
            t.setType(parseEnum(TaskType.class, req.type()));

        if (req.priority() != null)
            t.setPriority(parseEnum(TaskPriority.class, req.priority()));

        if (req.targetVersion() != null)
            t.setTargetVersion(req.targetVersion());

        t.setUpdatedAt(Instant.now());

        Task saved = tasks.save(t);

        return ResponseEntity.ok(TaskMapper.toDto(saved));
    }


    /**
     *
     * PATCH /admin/projects/{projectId}/updates/{updateId}
     *
     *
     * Partially updates an existing demo update.
     *
     * Supports:
     * - title
     * - body
     * -taskId
     */
    @PatchMapping("/{projectId}/updates/{updateId}")
    public ResponseEntity<UpdateDto> updateUpdate(
            @PathVariable UUID projectId,
            @PathVariable UUID updateId,
            @Valid @RequestBody UpdateUpdateRequest req
    ) {
        Update u = updates.findById(updateId)
                .orElseThrow(() -> new IllegalArgumentException("Update not found: " + updateId));

        // Ensure update belongs to the given project
        if (!u.getProject().getId().equals(projectId)) {
            return ResponseEntity.notFound().build();
        }

        /**
         * Update related task.
         *
         * Rules:
         * - null taskId => general project update
         * - non-null taskId => task must exist and belong to this same project
         */
        if (req.taskId() != null) {
            Task task = tasks.findById(req.taskId())
                    .orElseThrow(() -> new IllegalArgumentException("Task not found: " + req.taskId()));

            if (!task.getProject().getId().equals(projectId)) {
                throw new IllegalArgumentException("Task does not belong to project: " + projectId);
            }

            u.setTask(task);
        }

        /**
         * Allow removing task association.
         *
         * Frontend sends null when user chooses
         * "General project update".
         */
        if (req.taskId() == null) {
            u.setTask(null);
        }

        // Partial field updates
        if (req.title() != null) u.setTitle(req.title());
        if (req.body() != null) u.setBody(req.body());

        Update saved = updates.save(u);
        return ResponseEntity.ok(UpdateMapper.toDto(saved));
    }
    /**
     * ==========================================================
     * GET /admin/projects/{projectId}/planning
     * ==========================================================
     *
     * Returns the project's saved planning board.
     *
     * Rules:
     * - items are returned in sort order
     * - DONE tasks are excluded automatically
     */
    @GetMapping("/{projectId}/planning")
    public ResponseEntity<java.util.List<PlanningItemDto>> getPlanningBoard(
            @PathVariable UUID projectId
    ) {
        Project project = projects.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        var items = planningItems.findByProject_IdOrderBySortOrderAscCreatedAtAsc(project.getId())
                .stream()
                .filter(item -> item.getTask().getStatus() != TaskStatus.DONE)
                .map(PlanningItemMapper::toDto)
                .toList();

        return ResponseEntity.ok(items);
    }

    /**
     * ==========================================================
     * PUT /admin/projects/{projectId}/planning
     * ==========================================================
     *
     * Replaces the full planning board for the project.
     *
     * Why replace the whole board?
     * - simpler frontend
     * - easier reorder support
     * - one request saves the whole queue state
     *
     * Rules:
     * - all tasks must belong to the same project
     * - DONE tasks cannot be placed in planning board
     * - at most one item can be marked current
     */
    @PutMapping("/{projectId}/planning")
    public ResponseEntity<java.util.List<PlanningItemDto>> savePlanningBoard(
            @PathVariable UUID projectId,
            @Valid @RequestBody SavePlanningBoardRequest req
    ) {
        Project project = projects.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        long currentCount = req.items().stream()
                .filter(SavePlanningBoardItemRequest::isCurrent)
                .count();

        if (currentCount > 1) {
            throw new IllegalArgumentException("Only one planning item can be marked as current.");
        }

        // Clear old board and recreate it from the incoming ordered list
        planningItems.deleteByProject_Id(projectId);

        java.util.List<PlanningItem> savedItems = new java.util.ArrayList<>();

        for (int i = 0; i < req.items().size(); i++) {
            SavePlanningBoardItemRequest incoming = req.items().get(i);

            Task task = tasks.findById(incoming.taskId())
                    .orElseThrow(() -> new IllegalArgumentException("Task not found: " + incoming.taskId()));

            if (!task.getProject().getId().equals(projectId)) {
                throw new IllegalArgumentException("Task does not belong to project: " + projectId);
            }

            if (task.getStatus() == TaskStatus.DONE) {
                throw new IllegalArgumentException("DONE tasks cannot be added to the planning board.");
            }

            PlanningItem item = new PlanningItem();
            item.setId(UUID.randomUUID());
            item.setProject(project);
            item.setTask(task);
            item.setSortOrder(i);
            item.setCurrent(incoming.isCurrent());
            item.setCreatedAt(Instant.now());
            item.setUpdatedAt(Instant.now());

            savedItems.add(planningItems.save(item));
        }

        var response = savedItems.stream()
                .map(PlanningItemMapper::toDto)
                .toList();

        return ResponseEntity.ok(response);
    }

    /**
     * Helper for mapping string values to enums safely.
     * (We already handle IllegalArgumentException in your ApiExceptionHandler.)
     */
    private static <E extends Enum<E>> E parseEnum(Class<E> enumClass, String value) {
        return Enum.valueOf(enumClass, value.trim().toUpperCase(Locale.ROOT));
    }
}
