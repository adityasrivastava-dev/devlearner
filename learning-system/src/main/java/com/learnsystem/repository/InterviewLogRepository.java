package com.learnsystem.repository;

import com.learnsystem.model.InterviewLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InterviewLogRepository extends JpaRepository<InterviewLog, Long> {
    List<InterviewLog> findByUserIdOrderByInterviewDateDesc(Long userId);
}
