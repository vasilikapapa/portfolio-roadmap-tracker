package com.vasilika.portfoliotracker.web;

import com.vasilika.portfoliotracker.domain.Project;
import com.vasilika.portfoliotracker.domain.Task;
import com.vasilika.portfoliotracker.domain.Update;
import com.vasilika.portfoliotracker.repo.ProjectRepository;
import com.vasilika.portfoliotracker.repo.TaskRepository;
import com.vasilika.portfoliotracker.repo.UpdateRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/projects")
public class PublicProjectsController {

    private final ProjectRepository projects;
    private final TaskRepository tasks;
    private final UpdateRepository updates;

    public PublicProjectsController(ProjectRepository projects, TaskRepository tasks, UpdateRepository updates) {
        this.projects = projects;
        this.tasks = tasks;
        this.updates = updates;
    }

    @GetMapping
    public List<Project> listProjects() {
        return projects.findAll();
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Map<String, Object>> getProject(@PathVariable String slug) {
        Optional<Project> projectOpt = projects.findBySlug(slug);
        if (projectOpt.isEmpty()) return ResponseEntity.notFound().build();

        Project project = projectOpt.get();
        List<Task> projectTasks = tasks.findByProject_Id(project.getId());
        List<Update> projectUpdates = updates.findByProject_Id(project.getId());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("project", project);
        body.put("tasks", projectTasks);
        body.put("updates", projectUpdates);
        return ResponseEntity.ok(body);
    }
}
