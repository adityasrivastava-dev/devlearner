package com.learnsystem.repository;

import com.learnsystem.model.Algorithm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlgorithmRepository extends JpaRepository<Algorithm, Long> {

Optional<Algorithm> findBySlug(String slug);

List<Algorithm> findByCategoryOrderByDisplayOrderAscNameAsc(String category);

List<Algorithm> findAllByOrderByDisplayOrderAscNameAsc();

boolean existsBySlug(String slug);

/** Lightweight projections for the list endpoint — excludes heavy TEXT fields */
interface AlgorithmSummary {
    Long getId();
    String getSlug();
    String getName();
    String getCategory();
    String getEmoji();
    Algorithm.Difficulty getDifficulty();
    String getTags();
    String getAnalogy();
    String getTimeComplexityBest();
    String getTimeComplexityAverage();
    String getTimeComplexityWorst();
    String getSpaceComplexity();
    String getStability();
    Integer getDisplayOrder();
}

@Query("SELECT a FROM Algorithm a ORDER BY a.displayOrder ASC, a.name ASC")
List<AlgorithmSummary> findAllSummaries();

@Query("SELECT a FROM Algorithm a WHERE a.category = :category ORDER BY a.displayOrder ASC, a.name ASC")
List<AlgorithmSummary> findSummariesByCategory(@Param("category") String category);

@Modifying
@Query("DELETE FROM Algorithm")
void deleteAllAlgorithms();

@Query(value = """
    SELECT id, name, category, difficulty, analogy, slug
    FROM algorithms
    WHERE MATCH(name, tags) AGAINST(:q IN BOOLEAN MODE)
    LIMIT 8
    """, nativeQuery = true)
List<Object[]> fullTextSearch(@Param("q") String q);
}