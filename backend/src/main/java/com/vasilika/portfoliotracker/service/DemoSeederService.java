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
import java.util.ArrayList;
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

    /**
     * Rebuilds the demo sandbox as a copy of the real portfolio.
     *
     * Performance notes (this runs on every demo login):
     * - Old demo data is removed with ONE bulk delete (DB cascades to tasks/updates).
     * - New rows have no id set, so Hibernate INSERTs them directly instead of
     *   doing a SELECT first, and JDBC batching groups the INSERTs.
     */
    @Transactional
    public void seedDemoData() {

        // Clear previous demo data (single SQL statement)
        projects.bulkDeleteDemoProjects();

        // Get all admin projects
        List<Project> adminProjects = projects.findAllByDemoFalse();

        for (Project admin : adminProjects) {

            Project demoProject = new Project();
            demoProject.setDemo(true);
            demoProject.setSlug(admin.getSlug());
            demoProject.setName(admin.getName());
            demoProject.setSummary(admin.getSummary());
            demoProject.setDescription(admin.getDescription());
            demoProject.setTechStack(admin.getTechStack());
            demoProject.setRepoUrl(admin.getRepoUrl());
            demoProject.setLiveUrl(admin.getLiveUrl());

            Project savedDemoProject = projects.save(demoProject);

            // Map admin task id -> copied demo task
            Map<UUID, Task> demoTaskByAdminTaskId = new HashMap<>();
            List<Task> demoTasks = new ArrayList<>();

            // Copy tasks
            for (Task t : tasks.findByProject_Id(admin.getId())) {
                Task demoTask = new Task();
                demoTask.setProject(savedDemoProject);
                demoTask.setTitle(t.getTitle());
                demoTask.setDescription(t.getDescription());
                demoTask.setStatus(t.getStatus());
                demoTask.setType(t.getType());
                demoTask.setPriority(t.getPriority());
                demoTask.setTargetVersion(t.getTargetVersion());
                demoTask.setCreatedAt(Instant.now());
                demoTask.setUpdatedAt(Instant.now());

                demoTasks.add(demoTask);
                demoTaskByAdminTaskId.put(t.getId(), demoTask);
            }
            tasks.saveAll(demoTasks);

            // Copy updates
            List<Update> demoUpdates = new ArrayList<>();
            for (Update u : updates.findByProject_Id(admin.getId())) {
                Update demoUpdate = new Update();
                demoUpdate.setProject(savedDemoProject);
                demoUpdate.setTitle(u.getTitle());
                demoUpdate.setBody(u.getBody());
                demoUpdate.setCreatedAt(Instant.now());

                // Preserve task link by attaching the MATCHING DEMO task
                // (getTask().getId() reads the FK without loading the task)
                if (u.getTask() != null) {
                    demoUpdate.setTask(demoTaskByAdminTaskId.get(u.getTask().getId()));
                }

                demoUpdates.add(demoUpdate);
            }
            updates.saveAll(demoUpdates);
        }
    }
}
