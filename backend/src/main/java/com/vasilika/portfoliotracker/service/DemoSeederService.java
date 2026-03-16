package com.vasilika.portfoliotracker.service;

import com.vasilika.portfoliotracker.domain.Project;
import com.vasilika.portfoliotracker.domain.Task;
import com.vasilika.portfoliotracker.domain.Update;
import com.vasilika.portfoliotracker.repo.ProjectRepository;
import com.vasilika.portfoliotracker.repo.TaskRepository;
import com.vasilika.portfoliotracker.repo.UpdateRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class DemoSeederService {

    private final ProjectRepository projects;
    private final TaskRepository tasks;
    private final UpdateRepository updates;

    public DemoSeederService(ProjectRepository projects,
                             TaskRepository tasks,
                             UpdateRepository updates) {
        this.projects = projects;
        this.tasks = tasks;
        this.updates = updates;
    }

    @Transactional
    public void seedDemoData() {

        // Clear previous demo data
        projects.deleteAllByDemoTrue();

        // Get all admin projects
        List<Project> adminProjects = projects.findAllByDemoFalse();

        for (Project admin : adminProjects) {

            Project demoProject = new Project();
            demoProject.setId(UUID.randomUUID());
            demoProject.setDemo(true);
            demoProject.setSlug(admin.getSlug());
            demoProject.setName(admin.getName());
            demoProject.setSummary(admin.getSummary());
            demoProject.setDescription(admin.getDescription());
            demoProject.setTechStack(admin.getTechStack());
            demoProject.setRepoUrl(admin.getRepoUrl());
            demoProject.setLiveUrl(admin.getLiveUrl());
            demoProject.setCreatedAt(Instant.now());
            demoProject.setUpdatedAt(Instant.now());

            Project savedDemoProject = projects.save(demoProject);

            // Map admin task id -> copied demo task
            Map<UUID, Task> demoTaskByAdminTaskId = new HashMap<>();

            // Copy tasks
            List<Task> adminTasks = tasks.findByProject_Id(admin.getId());
            for (Task t : adminTasks) {
                Task demoTask = new Task();
                demoTask.setId(UUID.randomUUID());
                demoTask.setProject(savedDemoProject);
                demoTask.setTitle(t.getTitle());
                demoTask.setDescription(t.getDescription());
                demoTask.setStatus(t.getStatus());
                demoTask.setType(t.getType());
                demoTask.setPriority(t.getPriority());
                demoTask.setTargetVersion(t.getTargetVersion());
                demoTask.setCreatedAt(Instant.now());
                demoTask.setUpdatedAt(Instant.now());

                Task savedDemoTask = tasks.save(demoTask);
                demoTaskByAdminTaskId.put(t.getId(), savedDemoTask);
            }

            // Copy updates
            List<Update> adminUpdates = updates.findByProject_Id(admin.getId());
            for (Update u : adminUpdates) {
                Update demoUpdate = new Update();
                demoUpdate.setId(UUID.randomUUID());
                demoUpdate.setProject(savedDemoProject);
                demoUpdate.setTitle(u.getTitle());
                demoUpdate.setBody(u.getBody());
                demoUpdate.setCreatedAt(Instant.now());

                // Preserve task link by attaching the MATCHING DEMO task
                if (u.getTask() != null) {
                    Task matchingDemoTask = demoTaskByAdminTaskId.get(u.getTask().getId());
                    demoUpdate.setTask(matchingDemoTask);
                }

                updates.save(demoUpdate);
            }
        }
    }
}