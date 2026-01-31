package com.vasilika.portfoliotracker.repo;

import com.vasilika.portfoliotracker.domain.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByProject_Id(UUID projectId);
}
