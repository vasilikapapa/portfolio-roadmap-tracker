package com.vasilika.portfoliotracker.repo;

import com.vasilika.portfoliotracker.domain.PlanningItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for project planning board items.
 */
public interface PlanningItemRepository extends JpaRepository<PlanningItem, UUID> {

    /**
     * Returns planning items in queue order.
     */
    List<PlanningItem> findByProject_IdOrderBySortOrderAscCreatedAtAsc(UUID projectId);

    /**
     * Deletes all planning items for one project.
     */
    void deleteByProject_Id(UUID projectId);
}