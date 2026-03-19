package com.vasilika.portfoliotracker.web;

import com.vasilika.portfoliotracker.service.TaskTypeOptionService;
import com.vasilika.portfoliotracker.web.dto.TaskTypeOptionDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public read endpoint for task type dropdown options.
 */
@RestController
public class TaskTypeOptionController {

    private final TaskTypeOptionService taskTypeOptionService;

    public TaskTypeOptionController(TaskTypeOptionService taskTypeOptionService) {
        this.taskTypeOptionService = taskTypeOptionService;
    }

    @GetMapping("/api/task-types")
    public List<TaskTypeOptionDto> listTaskTypes() {
        return taskTypeOptionService.listActive()
                .stream()
                .map(type -> new TaskTypeOptionDto(type.getCode(), type.getLabel()))
                .toList();
    }
}