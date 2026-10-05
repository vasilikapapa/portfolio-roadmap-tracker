package com.vasilika.portfoliotracker.repo;

import com.vasilika.portfoliotracker.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;
import java.util.List;


/**
 * ProjectRepository
 *
 * Data access layer for {@link Project} entities.
 *
 * Extends {@link JpaRepository} to provide:
 * - Basic CRUD operations
 * - Pagination and sorting
 * - Integration with Spring Data JPA query generation
 */
public interface ProjectRepository extends JpaRepository<Project, UUID> {


        // Public/admin (real portfolio)
        Optional<Project> findBySlug(String slug);
        boolean existsBySlug(String slug);

        // Demo sandbox support
        boolean existsBySlugAndDemo(String slug, boolean demo);
        Optional<Project> findBySlugAndDemo(String slug, boolean demo);

        // Public listing should return only NON-demo projects
        List<Project> findAllByDemoFalseOrderByCreatedAtDesc();

        // Demo listing
        List<Project> findAllByDemoTrueOrderByCreatedAtDesc();

        long countByDemoTrue();
        List<Project> findAllByDemoTrue();

        void deleteAllByDemoTrue();

        /**
         * Single bulk DELETE for all demo projects.
         * Tasks, updates and planning items are removed by ON DELETE CASCADE in the DB,
         * instead of loading and deleting every row one by one.
         */
        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query("delete from Project p where p.demo = true")
        int bulkDeleteDemoProjects();

        List<Project> findAllByDemoFalse();
}
