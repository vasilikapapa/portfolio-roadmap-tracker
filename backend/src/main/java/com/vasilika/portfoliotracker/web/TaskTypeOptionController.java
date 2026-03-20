package com.vasilika.portfoliotracker.web;

import com.vasilika.portfoliotracker.web.dto.TaskTypeOptionDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public read endpoint for task type dropdown options.
 *
 * NOTE:
 * - This endpoint returns only default/common values.
 * - Frontend may still extend this list dynamically.
 */
@RestController
public class TaskTypeOptionController {

    /**
     * Returns default task type options.
     * No database involved.
     */
    @GetMapping("/api/task-types")
    public List<TaskTypeOptionDto> listTaskTypes() {
        return List.of(
                new TaskTypeOptionDto("FEATURE", "Feature"),
                new TaskTypeOptionDto("BUG", "Bug"),
                new TaskTypeOptionDto("REFACTOR", "Refactor")
        );
    }
}