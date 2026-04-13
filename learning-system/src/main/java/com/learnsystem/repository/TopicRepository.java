package com.learnsystem.repository;

import com.learnsystem.model.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic>     findByCategory(Topic.Category category);
    Optional<Topic> findByTitle(String title);

    List<Topic> findAllByOrderByDisplayOrderAscTitleAsc();
    List<Topic> findByCategoryOrderByDisplayOrderAscTitleAsc(Topic.Category category);

    @Modifying
    @Query("DELETE FROM Topic")
    void deleteAllTopics();

    // ── Lightweight projections for the list endpoint ─────────────────────────
    // Excludes the heavy TEXT content fields (story, analogy, description, etc.)
    // that are only needed when a user opens a specific topic.
    interface TopicSummary {
        Long    getId();
        String  getTitle();
        Topic.Category getCategory();
        String  getSubCategory();
        Integer getDisplayOrder();
        String  getTimeComplexity();
        String  getSpaceComplexity();
    }

    @Query("SELECT t FROM Topic t ORDER BY t.displayOrder ASC, t.title ASC")
    List<TopicSummary> findAllSummaries();

    @Query("SELECT t FROM Topic t WHERE t.category = :category ORDER BY t.displayOrder ASC, t.title ASC")
    List<TopicSummary> findSummariesByCategory(@Param("category") Topic.Category category);
}