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
import com.vasilika.portfoliotracker.web.dto.CreateProjectRequest;
import com.vasilika.portfoliotracker.web.dto.CreateTaskRequest;
import com.vasilika.portfoliotracker.web.dto.CreateUpdateRequest;
import com.vasilika.portfoliotracker.web.dto.ProjectDetailsDto;
import com.vasilika.portfoliotracker.web.dto.ProjectDto;
import com.vasilika.portfoliotracker.web.dto.TaskDto;
import com.vasilika.portfoliotracker.web.dto.UpdateDto;
import com.vasilika.portfoliotracker.web.dto.UpdateProjectRequest;
import com.vasilika.portfoliotracker.web.dto.UpdateTaskRequest;
import com.vasilika.portfoliotracker.web.dto.UpdateUpdateRequest;
import com.vasilika.portfoliotracker.web.mapper.ProjectMapper;
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
 *
 * Supported operations:
 * - List demo projects
 * - Read demo project details
 * - Create / update / delete demo projects
 * - Create / update / delete demo tasks
 * - Create / update / delete demo updates
 * - Reset all demo data
 */
@RestController
@RequestMapping("/demo/projects")
public class DemoProjectItemsController {

    private final ProjectRepository projects;
    private final TaskRepository tasks;
    private final UpdateRepository updates;
    private final DemoSeederService demoSeeder;
    private final PlanningItemRepository planningItems;

    public DemoProjectItemsController(
            ProjectRepository projects,
            TaskRepository tasks,
            UpdateRepository updates,
            PlanningItemRepository planningItems,
            DemoSeederService demoSeeder
    ) {
        this.projects = projects;
        this.tasks = tasks;
        this.updates = updates;
        this.planningItems = planningItems;
        this.demoSeeder = demoSeeder;
    }

    /**
     * ==========================================================
     * GET /demo/projects
     * ==========================================================
     *
     * Lists all demo projects.
     *
     * Used by:
     * - DemoHomePage
     * - Demo project grid/listing UI
     */
    @GetMapping
    public java.util.List<ProjectDto> listDemoProjects() {
        return projects.findAllByDemoTrueOrderByCreatedAtDesc()
                .stream()
                .map(ProjectMapper::toDto)
                .toList();
    }

    /**
     * ==========================================================
     * GET /demo/projects/{slug}
     * ==========================================================
     *
     * Returns one demo project with:
     * - project details
     * - roadmap tasks
     * - updates timeline
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

        // Tasks:
        // - ordered by status
        // - then by createdAt ascending inside each status
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

        // Updates:
        // - newest first
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
     * ==========================================================
     * POST /demo/projects
     * ==========================================================
     *
     * Creates a new demo project.
     *
     * Body:
     * - slug
     * - name
     * - summary
     * - description
     * - techStack
     * - repoUrl
     * - liveUrl
     *
     * Notes:
     * - slug must be unique in demo namespace
     * - project is always forced to demo=true
     */
    @PostMapping
    public ResponseEntity<ProjectDto> createDemoProject(@Valid @RequestBody CreateProjectRequest req) {
        String slug = req.slug().trim();

        // Demo-only slug uniqueness check
        if (projects.existsBySlugAndDemo(slug, true)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Demo slug already exists: " + slug);
        }

        Project p = new Project();
        p.setId(UUID.randomUUID()); // remove if @GeneratedValue is used
        p.setDemo(true);            // force sandbox mode
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

        return ResponseEntity
                .created(URI.create("/demo/projects/" + saved.getSlug()))
                .body(ProjectMapper.toDto(saved));
    }

    /**
     * ==========================================================
     * PATCH /demo/projects/{projectId}
     * ==========================================================
     *
     * Partially updates an existing demo project.
     *
     * Only non-null fields from the request are applied.
     *
     * Safety:
     * - target project must exist
     * - target project must be a demo project
     * - updated slug must remain unique among demo projects
     */
    @PatchMapping("/{projectId}")
    public ResponseEntity<ProjectDto> demoUpdateProject(
            @PathVariable UUID projectId,
            @Valid @RequestBody UpdateProjectRequest req
    ) {
        Project p = projects.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Project not found: " + projectId
                ));

        // Hard stop if someone tries to update a real project using demo endpoints
        if (!p.isDemo()) {
            return ResponseEntity.notFound().build();
        }

        // Slug update:
        // - only update if provided
        // - only check uniqueness if it actually changed
        if (req.slug() != null && !req.slug().trim().equalsIgnoreCase(p.getSlug())) {
            String newSlug = req.slug().trim();

            if (projects.existsBySlugAndDemo(newSlug, true)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Demo slug already exists: " + newSlug
                );
            }

            p.setSlug(newSlug);
        }

        // Partial field updates
        if (req.name() != null) p.setName(req.name().trim());
        if (req.summary() != null) p.setSummary(req.summary());
        if (req.description() != null) p.setDescription(req.description());
        if (req.techStack() != null) p.setTechStack(req.techStack());
        if (req.repoUrl() != null) p.setRepoUrl(req.repoUrl());
        if (req.liveUrl() != null) p.setLiveUrl(req.liveUrl());

        p.setUpdatedAt(Instant.now());

        Project saved = projects.save(p);
        return ResponseEntity.ok(ProjectMapper.toDto(saved));
    }

    /**
     * ==========================================================
     * DELETE /demo/projects/{projectId}
     * ==========================================================
     *
     * Deletes a demo project.
     *
     * Notes:
     * - only demo projects can be deleted through this controller
     * - tasks/updates are expected to be removed by cascade
     */
    @DeleteMapping("/{projectId}")
    public ResponseEntity<?> deleteDemoProject(@PathVariable UUID projectId) {

        var projectOpt = projects.findById(projectId);
        if (projectOpt.isEmpty() || !projectOpt.get().isDemo()) {
            return ResponseEntity.notFound().build();
        }

        projects.deleteById(projectId);
        return ResponseEntity.noContent().build();
    }

    /**
     * ==========================================================
     * POST /demo/projects/{projectId}/tasks
     * ==========================================================
     *
     * Creates a new task under a demo project.
     */
    @PostMapping("/{projectId}/tasks")
    public ResponseEntity<TaskDto> createDemoTask(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest req
    ) {
        Project project = projects.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Project not found: " + projectId
                ));

        // Prevent demo endpoints from touching real projects
        if (!project.isDemo()) {
            return ResponseEntity.notFound().build();
        }

        Task t = new Task();
        t.setId(UUID.randomUUID()); // remove if @GeneratedValue is used
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
     * ==========================================================
     * PATCH /demo/projects/{projectId}/tasks/{taskId}
     * ==========================================================
     *
     * Partially updates an existing demo task.
     *
     * Supports:
     * - title
     * - description
     * - status
     * - type
     * - priority
     * - targetVersion
     */
    @PatchMapping("/{projectId}/tasks/{taskId}")
    public ResponseEntity<TaskDto> updateDemoTask(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest req
    ) {
        var projectOpt = projects.findById(projectId);
        if (projectOpt.isEmpty() || !projectOpt.get().isDemo()) {
            return ResponseEntity.notFound().build();
        }

        Task t = tasks.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Task not found: " + taskId
                ));

        // Ensure task belongs to the target demo project
        if (!t.getProject().getId().equals(projectId)) {
            return ResponseEntity.notFound().build();
        }

        // Partial field updates
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
     * ==========================================================
     * DELETE /demo/projects/{projectId}/tasks/{taskId}
     * ==========================================================
     *
     * Deletes a demo task.
     */
    @DeleteMapping("/{projectId}/tasks/{taskId}")
    public ResponseEntity<?> deleteDemoTask(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId
    ) {
        var projectOpt = projects.findById(projectId);
        if (projectOpt.isEmpty() || !projectOpt.get().isDemo()) {
            return ResponseEntity.notFound().build();
        }

        var taskOpt = tasks.findById(taskId);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var task = taskOpt.get();

        // Ensure task belongs to the given project
        if (!task.getProject().getId().equals(projectId)) {
            return ResponseEntity.notFound().build();
        }

        tasks.delete(task);
        return ResponseEntity.noContent().build();
    }

    /**
     * ==========================================================
     * POST /demo/projects/{projectId}/updates
     * ==========================================================
     *
     * Creates a new update entry under a demo project.
     */
    @PostMapping("/{projectId}/updates")
    public ResponseEntity<UpdateDto> createDemoUpdate(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateUpdateRequest req
    ) {
        Project project = projects.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Project not found: " + projectId
                ));

        // Prevent demo endpoints from touching real projects
        if (!project.isDemo()) {
            return ResponseEntity.notFound().build();
        }

        Update u = new Update();
        u.setId(UUID.randomUUID());
        u.setProject(project);

        /*
         * Optional task reference:
         * - lets demo users attach an update to a specific roadmap task
         * - task must belong to the same demo project
         */
        if (req.taskId() != null) {
            Task task = tasks.findById(req.taskId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Task not found: " + req.taskId()
                    ));

            if (!task.getProject().getId().equals(projectId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Task does not belong to this project"
                );
            }

            u.setTask(task);
        }

        u.setTitle(req.title());
        u.setBody(req.body());
        u.setCreatedAt(Instant.now());

        Update saved = updates.save(u);

        return ResponseEntity
                .created(URI.create("/demo/projects/" + project.getSlug()))
                .body(UpdateMapper.toDto(saved));
    }

    /**
     * ==========================================================
     * PATCH /demo/projects/{projectId}/updates/{updateId}
     * ==========================================================
     *
     * Partially updates an existing demo update.
     *
     * Supports:
     * - title
     * - body
     */
    @PatchMapping("/{projectId}/updates/{updateId}")
    public ResponseEntity<UpdateDto> updateDemoUpdate(
            @PathVariable UUID projectId,
            @PathVariable UUID updateId,
            @Valid @RequestBody UpdateUpdateRequest req
    ) {
        var projectOpt = projects.findById(projectId);
        if (projectOpt.isEmpty() || !projectOpt.get().isDemo()) {
            return ResponseEntity.notFound().build();
        }

        Update u = updates.findById(updateId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Update not found: " + updateId
                ));

        // Ensure update belongs to the given project
        if (!u.getProject().getId().equals(projectId)) {
            return ResponseEntity.notFound().build();
        }

        /*
         * Update related task.
         *
         * Rules:
         * - null taskId => general project update
         * - non-null taskId => task must exist and belong to this same demo project
         */
        if (req.taskId() != null) {
            Task task = tasks.findById(req.taskId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Task not found: " + req.taskId()
                    ));

            if (!task.getProject().getId().equals(projectId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Task does not belong to this project"
                );
            }

            u.setTask(task);
        } else {
            /*
             * If taskId is null, remove task association
             * and make it a general project update.
             */
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
     * DELETE /demo/projects/{projectId}/updates/{updateId}
     * ==========================================================
     *
     * Deletes a demo update.
     */
    @DeleteMapping("/{projectId}/updates/{updateId}")
    public ResponseEntity<?> deleteDemoUpdate(
            @PathVariable UUID projectId,
            @PathVariable UUID updateId
    ) {
        var projectOpt = projects.findById(projectId);
        if (projectOpt.isEmpty() || !projectOpt.get().isDemo()) {
            return ResponseEntity.notFound().build();
        }

        var updateOpt = updates.findById(updateId);
        if (updateOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var u = updateOpt.get();

        // Ensure update belongs to the given project
        if (!u.getProject().getId().equals(projectId)) {
            return ResponseEntity.notFound().build();
        }

        updates.delete(u);
        return ResponseEntity.noContent().build();
    }

    /**
     * ==========================================================
     * POST /demo/projects/reset
     * ==========================================================
     *
     * Clears all current demo data and re-seeds the sandbox.
     *
     * Useful for:
     * - demo logout cleanup
     * - reset button in demo dashboard
     * - recruiter testing flow
     */
    @PostMapping("/reset")
    public ResponseEntity<?> resetDemo() {
        demoSeeder.seedDemoData();
        return ResponseEntity.noContent().build();
    }
    /**
     * ==========================================================
     * GET /demo/projects/{projectId}/planning
     * ==========================================================
     *
     * Returns the saved planning board for a demo project.
     */
    @GetMapping("/{projectId}/planning")
    public ResponseEntity<java.util.List<PlanningItemDto>> getDemoPlanningBoard(
            @PathVariable UUID projectId
    ) {
        var projectOpt = projects.findById(projectId);
        if (projectOpt.isEmpty() || !projectOpt.get().isDemo()) {
            return ResponseEntity.notFound().build();
        }

        var items = planningItems.findByProject_IdOrderBySortOrderAscCreatedAtAsc(projectId)
                .stream()
                .filter(item -> item.getTask().getStatus() != TaskStatus.DONE)
                .map(PlanningItemMapper::toDto)
                .toList();

        return ResponseEntity.ok(items);
    }

    /**
     * ==========================================================
     * PUT /demo/projects/{projectId}/planning
     * ==========================================================
     *
     * Replaces the full demo planning board.
     */
    @PutMapping("/{projectId}/planning")
    public ResponseEntity<java.util.List<PlanningItemDto>> saveDemoPlanningBoard(
            @PathVariable UUID projectId,
            @Valid @RequestBody SavePlanningBoardRequest req
    ) {
        var projectOpt = projects.findById(projectId);
        if (projectOpt.isEmpty() || !projectOpt.get().isDemo()) {
            return ResponseEntity.notFound().build();
        }

        Project project = projectOpt.get();

        long currentCount = req.items().stream()
                .filter(SavePlanningBoardItemRequest::isCurrent)
                .count();

        if (currentCount > 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only one planning item can be marked as current."
            );
        }

        planningItems.deleteByProject_Id(projectId);

        java.util.List<PlanningItem> savedItems = new java.util.ArrayList<>();

        for (int i = 0; i < req.items().size(); i++) {
            SavePlanningBoardItemRequest incoming = req.items().get(i);

            Task task = tasks.findById(incoming.taskId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Task not found: " + incoming.taskId()
                    ));

            if (!task.getProject().getId().equals(projectId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Task does not belong to this project"
                );
            }

            if (task.getStatus() == TaskStatus.DONE) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "DONE tasks cannot be added to the planning board."
                );
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
     * ==========================================================
     * Helper: enum parsing
     * ==========================================================
     *
     * Safely converts incoming string enum values like:
     * - "backlog"
     * - " BACKLOG "
     * into:
     * - TaskStatus.BACKLOG
     */
    private static <E extends Enum<E>> E parseEnum(Class<E> enumClass, String value) {
        return Enum.valueOf(enumClass, value.trim().toUpperCase(Locale.ROOT));
    }
}