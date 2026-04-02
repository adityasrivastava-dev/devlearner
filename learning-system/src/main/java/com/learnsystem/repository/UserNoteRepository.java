package com.learnsystem.repository;

import com.learnsystem.model.UserNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserNoteRepository extends JpaRepository<UserNote, Long> {
List<UserNote> findByUserIdAndTopicIdOrderByUpdatedAtDesc(Long userId, Long topicId);
List<UserNote> findByUserIdOrderByUpdatedAtDesc(Long userId);
}