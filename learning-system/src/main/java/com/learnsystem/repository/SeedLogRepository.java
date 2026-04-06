package com.learnsystem.repository;

import com.learnsystem.model.SeedLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SeedLogRepository extends JpaRepository<SeedLog, String> {
}
