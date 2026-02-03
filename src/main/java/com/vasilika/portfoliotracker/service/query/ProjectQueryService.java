package com.vasilika.portfoliotracker.service.query;

import com.vasilika.portfoliotracker.domain.enums.TaskPriority;
import com.vasilika.portfoliotracker.domain.enums.TaskStatus;
import com.vasilika.portfoliotracker.domain.enums.TaskType;
import com.vasilika.portfoliotracker.repo.ProjectRepository;
import com.vasilika.portfoliotracker.repo.TaskRepository;
import com.vasilika.portfoliotracker.repo.UpdateRepository;
import com.vasilika.portfoliotracker.web.dto.*;
import com.vasilika.portfoliotracker.web.mapper.ProjectMapper;
import com.vasilika.portfoliotracker.web.mapper.TaskMapper;
import com.vasilika.portfoliotracker.web.mapper.UpdateMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class ProjectQueryService {

    private final ProjectRepository projects;
    private final TaskRepository tasks;
    private final UpdateRepository updates;

    public ProjectQueryService(ProjectRepository projects, TaskRepository tasks, UpdateRepository updates) {
        this.projects = projects;
        this.tasks = tasks;
        this.updates = updates;
    }

    public java.util.List<ProjectDto> listProjects() {
        return projects.findAll().stream().map(ProjectMapper::toDto).toList();
    }

    public ProjectDetailsDto getDetails(String slug) {
        var project = projects.findBySlug(slug).orElseThrow();

        var taskDtos = tasks.findByProject_Id(project.getId()).stream()
                .sorted((a, b) -> {
                    int sa = a.getStatus().ordinal();
                    int sb = b.getStatus().ordinal();
                    if (sa != sb) return Integer.compare(sa, sb);
                    return a.getCreatedAt().compareTo(b.getCreatedAt());
                })
                .map(TaskMapper::toDto)
                .toList();

        var updateDtos = updates.findByProject_IdOrderByCreatedAtDesc(project.getId()).stream()
                .map(UpdateMapper::toDto)
                .toList();

        return new ProjectDetailsDto(ProjectMapper.toDto(project), taskDtos, updateDtos);
    }

    public ProjectDetailsPagedDto getDetailsPaged(
            String slug,
            String status,
            String type,
            String priority,
            int tasksPage,
            int tasksSize,
            int updatesPage,
            int updatesSize
    ) {
        var project = projects.findBySlug(slug).orElseThrow();

        TaskStatus st = status == null ? null : parseEnum(TaskStatus.class, status);
        TaskType ty = type == null ? null : parseEnum(TaskType.class, type);
        TaskPriority pr = priority == null ? null : parseEnum(TaskPriority.class, priority);

        Pageable tp = PageRequest.of(tasksPage, tasksSize);
        var taskPage = tasks.findPagedForProject(project.getId(), st, ty, pr, tp);

        Pageable up = PageRequest.of(updatesPage, updatesSize);
        var updatePage = updates.findByProject_IdOrderByCreatedAtDesc(project.getId(), up);

        var tasksDto = new PageDto<>(
                taskPage.getContent().stream().map(TaskMapper::toDto).toList(),
                taskPage.getNumber(),
                taskPage.getSize(),
                taskPage.getTotalElements(),
                taskPage.getTotalPages(),
                taskPage.hasNext()
        );

        var updatesDto = new PageDto<>(
                updatePage.getContent().stream().map(UpdateMapper::toDto).toList(),
                updatePage.getNumber(),
                updatePage.getSize(),
                updatePage.getTotalElements(),
                updatePage.getTotalPages(),
                updatePage.hasNext()
        );

        return new ProjectDetailsPagedDto(ProjectMapper.toDto(project), tasksDto, updatesDto);
    }

    private static <E extends Enum<E>> E parseEnum(Class<E> enumClass, String value) {
        return Enum.valueOf(enumClass, value.trim().toUpperCase(Locale.ROOT));
    }
}
