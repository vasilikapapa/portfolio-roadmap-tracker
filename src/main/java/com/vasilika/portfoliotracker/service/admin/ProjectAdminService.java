package com.vasilika.portfoliotracker.service.admin;

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
import com.vasilika.portfoliotracker.web.dto.ProjectDto;
import com.vasilika.portfoliotracker.web.dto.TaskDto;
import com.vasilika.portfoliotracker.web.dto.UpdateDto;
import com.vasilika.portfoliotracker.web.dto.UpdateTaskRequest;
import com.vasilika.portfoliotracker.web.mapper.ProjectMapper;
import com.vasilika.portfoliotracker.web.mapper.TaskMapper;
import com.vasilika.portfoliotracker.web.mapper.UpdateMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class ProjectAdminService {

    private final ProjectRepository projects;
    private final TaskRepository tasks;
    private final UpdateRepository updates;

    public ProjectAdminService(ProjectRepository projects, TaskRepository tasks, UpdateRepository updates) {
        this.projects = projects;
        this.tasks = tasks;
        this.updates = updates;
    }

    @Transactional
    public ProjectDto createProject(CreateProjectRequest req) {
        var p = new Project();
        p.setSlug(req.slug());
        p.setName(req.name());
        p.setSummary(req.summary());
        p.setDescription(req.description());
        p.setTechStack(req.techStack());
        p.setRepoUrl(req.repoUrl());
        p.setLiveUrl(req.liveUrl());


        var saved = projects.save(p);
        return ProjectMapper.toDto(saved);
    }

    @Transactional
    public TaskDto createTask(UUID projectId, CreateTaskRequest req) {
        var project = projects.findById(projectId).orElseThrow();

        var t = new Task();
        t.setProject(project);
        t.setTitle(req.title());
        t.setDescription(req.description());
        t.setStatus(parseEnum(TaskStatus.class, req.status()));
        t.setType(parseEnum(TaskType.class, req.type()));
        t.setPriority(parseEnum(TaskPriority.class, req.priority()));
        t.setTargetVersion(req.targetVersion());
        t.setCreatedAt(Instant.now());
        t.setUpdatedAt(Instant.now());

        var saved = tasks.save(t);
        return TaskMapper.toDto(saved);
    }

    @Transactional
    public UpdateDto createUpdate(UUID projectId, CreateUpdateRequest req) {
        var project = projects.findById(projectId).orElseThrow();

        var u = new Update();
        u.setProject(project);
        u.setTitle(req.title());
        u.setBody(req.body());
        u.setCreatedAt(Instant.now());

        var saved = updates.save(u);
        return UpdateMapper.toDto(saved);
    }

    @Transactional
    public TaskDto patchTask(UUID taskId, UpdateTaskRequest req) {
        var t = tasks.findById(taskId).orElseThrow();

        if (req.title() != null) t.setTitle(req.title());
        if (req.description() != null) t.setDescription(req.description());
        if (req.targetVersion() != null) t.setTargetVersion(req.targetVersion());

        if (req.status() != null) t.setStatus(parseEnum(TaskStatus.class, req.status()));
        if (req.type() != null) t.setType(parseEnum(TaskType.class, req.type()));
        if (req.priority() != null) t.setPriority(parseEnum(TaskPriority.class, req.priority()));

        t.setUpdatedAt(Instant.now());

        var saved = tasks.save(t);
        return TaskMapper.toDto(saved);
    }

    @Transactional
    public void deleteTask(UUID taskId) {
        if (!tasks.existsById(taskId)) throw new java.util.NoSuchElementException();
        tasks.deleteById(taskId);
    }

    @Transactional
    public void deleteUpdate(UUID updateId) {
        if (!updates.existsById(updateId)) throw new java.util.NoSuchElementException();
        updates.deleteById(updateId);
    }

    private static <E extends Enum<E>> E parseEnum(Class<E> enumClass, String value) {
        return Enum.valueOf(enumClass, value.trim().toUpperCase(Locale.ROOT));
    }
}
