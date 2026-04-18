package com.learnsystem.repository;

import com.learnsystem.model.BehavioralStory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BehavioralStoryRepository extends JpaRepository<BehavioralStory, Long> {
    List<BehavioralStory>   findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<BehavioralStory> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);
}
