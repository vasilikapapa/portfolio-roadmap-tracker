package com.vasilika.portfoliotracker.web.dto;

public record ProjectDetailsPagedDto(
    ProjectDto project,
    PageDto<TaskDto> tasks,
    PageDto<UpdateDto> updates
) {}
