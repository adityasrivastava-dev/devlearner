package com.learnsystem.repository;

import com.learnsystem.model.QuizSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizSetRepository extends JpaRepository<QuizSet, Long> {

/** All active sets ordered for display */
List<QuizSet> findByActiveTrueOrderByDisplayOrderAscTitleAsc();

/** Filter by category */
List<QuizSet> findByCategoryAndActiveTrueOrderByDisplayOrderAsc(String category);

/** Check if a set with this exact title already exists (for idempotent seeding) */
boolean existsByTitle(String title);
}