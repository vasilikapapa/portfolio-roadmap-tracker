package com.vasilika.portfoliotracker.repo;

import com.vasilika.portfoliotracker.domain.Update;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


import java.util.List;
import java.util.UUID;

public interface UpdateRepository extends JpaRepository<Update, UUID> {
    List<Update> findByProject_Id(UUID projectId);
    // newest first
    List<Update> findByProject_IdOrderByCreatedAtDesc(UUID projectId);

    Page<Update> findByProject_IdOrderByCreatedAtDesc(UUID projectId, Pageable pageable);


}
