package com.learnsystem.repository;

import com.learnsystem.model.UserTopicVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTopicVideoRepository extends JpaRepository<UserTopicVideo, Long> {

    List<UserTopicVideo> findByUserIdAndTopicIdOrderByAddedAtDesc(Long userId, Long topicId);

    List<UserTopicVideo> findByUserIdOrderByAddedAtDesc(Long userId);

    Optional<UserTopicVideo> findByIdAndUserId(Long id, Long userId);
}
