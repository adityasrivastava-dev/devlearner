package com.learnsystem.repository;

import com.learnsystem.model.TopicRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TopicRatingRepository extends JpaRepository<TopicRating, Long> {

    Optional<TopicRating> findByUserIdAndTopicId(Long userId, Long topicId);

    @Query("SELECT AVG(r.rating) FROM TopicRating r WHERE r.topicId = :topicId")
    Double getAverageRating(@Param("topicId") Long topicId);

    @Query("SELECT COUNT(r) FROM TopicRating r WHERE r.topicId = :topicId")
    Long getRatingCount(@Param("topicId") Long topicId);
}
