package com.vasilika.portfoliotracker.web;


import com.vasilika.portfoliotracker.service.query.ProjectQueryService;
import com.vasilika.portfoliotracker.web.dto.ProjectDetailsDto;
import com.vasilika.portfoliotracker.web.dto.ProjectDetailsPagedDto;
import com.vasilika.portfoliotracker.web.dto.ProjectDto;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/projects")
public class PublicProjectsController {

    private final ProjectQueryService query;

    public PublicProjectsController(ProjectQueryService query) {
        this.query = query;
    }

    @GetMapping
    public java.util.List<ProjectDto> list() {
        return query.listProjects();
    }

    @GetMapping("/{slug}")
    public ProjectDetailsDto details(@PathVariable String slug) {
        return query.getDetails(slug);
    }

    @GetMapping("/{slug}/paged")
    public ProjectDetailsPagedDto detailsPaged(
            @PathVariable String slug,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String priority,
            @RequestParam(defaultValue = "0") int tasksPage,
            @RequestParam(defaultValue = "10") int tasksSize,
            @RequestParam(defaultValue = "0") int updatesPage,
            @RequestParam(defaultValue = "5") int updatesSize
    ) {
        return query.getDetailsPaged(slug, status, type, priority, tasksPage, tasksSize, updatesPage, updatesSize);
    }
}

