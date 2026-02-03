package com.vasilika.portfoliotracker.web.dto;

import java.util.List;

public record ProjectDetailsDto(
        ProjectDto project,
        List<TaskDto> tasks,
        List<UpdateDto> updates
) {}
