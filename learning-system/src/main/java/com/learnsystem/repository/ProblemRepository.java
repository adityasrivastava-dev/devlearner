package com.learnsystem.repository;

import com.learnsystem.model.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {

List<Problem> findByTopicIdOrderByDisplayOrder(Long topicId);

List<Problem> findByTopicIdAndDifficulty(Long topicId, Problem.Difficulty difficulty);

/**
 * BUG 1 FIX: JOIN FETCH loads topic in same SQL query.
 *
 * Problem.topic is @ManyToOne(fetch = LAZY). The default findAll()
 * loads problems without their topics. Calling p.getTopic() outside
 * a Hibernate session causes LazyInitializationException.
 *
 * This query does a single SQL JOIN so topic is always populated,
 * no transaction needed at the controller level.
 *
 * SQL emitted: SELECT p.*, t.* FROM problems p JOIN topics t ON p.topic_id = t.id
 */
@Query("SELECT p FROM Problem p JOIN FETCH p.topic")
List<Problem> findAllWithTopicFetched();
}