package com.learnsystem.repository;

import com.learnsystem.model.InterviewQuestion;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {

    List<InterviewQuestion> findAllByOrderByDisplayOrderAscCreatedAtAsc();

    List<InterviewQuestion> findByCategoryOrderByDisplayOrderAscCreatedAtAsc(String category);

    List<InterviewQuestion> findByCategoryAndDifficultyOrderByDisplayOrderAscCreatedAtAsc(String category, String difficulty);

    List<InterviewQuestion> findByDifficultyOrderByDisplayOrderAscCreatedAtAsc(String difficulty);

    // ── Paginated variants — used by the public list endpoint ─────────────────
    @Query("SELECT q FROM InterviewQuestion q ORDER BY q.displayOrder ASC, q.createdAt ASC")
    List<InterviewQuestion> findAllPaged(Pageable pageable);

    @Query("SELECT q FROM InterviewQuestion q WHERE q.category = :category ORDER BY q.displayOrder ASC, q.createdAt ASC")
    List<InterviewQuestion> findByCategoryPaged(@Param("category") String category, Pageable pageable);

    @Query("SELECT q FROM InterviewQuestion q WHERE q.difficulty = :difficulty ORDER BY q.displayOrder ASC, q.createdAt ASC")
    List<InterviewQuestion> findByDifficultyPaged(@Param("difficulty") String difficulty, Pageable pageable);

    @Query("SELECT q FROM InterviewQuestion q WHERE q.category = :category AND q.difficulty = :difficulty ORDER BY q.displayOrder ASC, q.createdAt ASC")
    List<InterviewQuestion> findByCategoryAndDifficultyPaged(@Param("category") String category, @Param("difficulty") String difficulty, Pageable pageable);

    /** Topic-specific questions (exact title match) */
    @Query("SELECT q FROM InterviewQuestion q WHERE q.category = :category AND q.topicTitle = :topicTitle ORDER BY q.displayOrder ASC, q.createdAt ASC")
    List<InterviewQuestion> findByCategoryAndTopicTitlePaged(@Param("category") String category, @Param("topicTitle") String topicTitle, Pageable pageable);

    /** Category-level questions (topicTitle IS NULL) */
    @Query("SELECT q FROM InterviewQuestion q WHERE q.category = :category AND q.topicTitle IS NULL ORDER BY q.displayOrder ASC, q.createdAt ASC")
    List<InterviewQuestion> findCategoryLevelPaged(@Param("category") String category, Pageable pageable);

    /** Multi-category fetch — for DB-backed practice set generation */
    @Query("SELECT q FROM InterviewQuestion q WHERE q.category IN :categories ORDER BY FUNCTION('RAND')")
    List<InterviewQuestion> findByCategoriesRandom(@Param("categories") List<String> categories, Pageable pageable);

    /** Count how many questions exist for the given categories */
    @Query("SELECT COUNT(q) FROM InterviewQuestion q WHERE q.category IN :categories")
    long countByCategories(@Param("categories") List<String> categories);
}
