package com.learnsystem.repository;

import com.learnsystem.model.MockInterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MockInterviewRepository extends JpaRepository<MockInterviewSession, Long> {
    List<MockInterviewSession> findByUserIdOrderByStartedAtDesc(Long userId);
    Optional<MockInterviewSession> findByIdAndUserId(Long id, Long userId);
}
