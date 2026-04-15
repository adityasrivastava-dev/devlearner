package com.learnsystem.repository;

import com.learnsystem.model.UserEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserEventRepository extends JpaRepository<UserEvent, Long> {

    /** Count events per event type, most frequent first */
    @Query("SELECT ue.eventType, COUNT(ue) FROM UserEvent ue GROUP BY ue.eventType ORDER BY COUNT(ue) DESC")
    List<Object[]> countByEventType();

    /** Count events per type in a date range */
    @Query("SELECT ue.eventType, COUNT(ue) FROM UserEvent ue WHERE ue.occurredAt >= :from GROUP BY ue.eventType ORDER BY COUNT(ue) DESC")
    List<Object[]> countByEventTypeSince(LocalDateTime from);

    /** Recent events for a specific user */
    List<UserEvent> findTop20ByUserIdOrderByOccurredAtDesc(Long userId);

    /** Recent events across all users */
    List<UserEvent> findTop50ByOrderByOccurredAtDesc();
}
