package com.vasilika.portfoliotracker.repo;

import com.vasilika.portfoliotracker.domain.TaskTypeOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for configurable task types.
 */
public interface TaskTypeOptionRepository extends JpaRepository<TaskTypeOption, UUID> {

    Optional<TaskTypeOption> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    List<TaskTypeOption> findAllByActiveTrueOrderBySortOrderAscLabelAsc();
}