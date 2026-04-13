package com.learnsystem.repository;

import com.learnsystem.model.UserNote;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserNoteRepository extends JpaRepository<UserNote, Long> {
List<UserNote> findByUserIdAndTopicIdOrderByUpdatedAtDesc(Long userId, Long topicId);
List<UserNote> findByUserIdOrderByUpdatedAtDesc(Long userId);

/** Capped fetch — prevents unbounded payload when user has many notes */
@Query("SELECT n FROM UserNote n WHERE n.userId = :userId ORDER BY n.updatedAt DESC")
List<UserNote> findRecentByUserId(@Param("userId") Long userId, Pageable pageable);

@Query("SELECT n FROM UserNote n WHERE n.userId = :userId AND n.topicId = :topicId ORDER BY n.updatedAt DESC")
List<UserNote> findRecentByUserIdAndTopicId(@Param("userId") Long userId, @Param("topicId") Long topicId, Pageable pageable);
}