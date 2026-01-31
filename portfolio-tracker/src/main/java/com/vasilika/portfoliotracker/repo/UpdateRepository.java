package com.vasilika.portfoliotracker.repo;

import com.vasilika.portfoliotracker.domain.Update;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UpdateRepository extends JpaRepository<Update, UUID> {
    List<Update> findByProject_Id(UUID projectId);
}
