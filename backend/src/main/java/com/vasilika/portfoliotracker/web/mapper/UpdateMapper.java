package com.vasilika.portfoliotracker.web.mapper;

import com.vasilika.portfoliotracker.domain.Update;
import com.vasilika.portfoliotracker.web.dto.UpdateDto;

public class UpdateMapper {
    private UpdateMapper() {}

    public static UpdateDto toDto(Update u) {
        return new UpdateDto(
                u.getId(),
                u.getProject().getId(),
                u.getTitle(),
                u.getBody(),
                u.getCreatedAt()
        );
    }
}
