package com.learnsystem.repository;

import com.learnsystem.model.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {

    // All sessions for a user in a date range (calendar view)
    List<StudySession> findByUserIdAndScheduledDateBetweenOrderByScheduledDateAscScheduledTimeAsc(
            Long userId, LocalDate start, LocalDate end);

    // Upcoming incomplete sessions
    List<StudySession> findByUserIdAndCompletedFalseAndScheduledDateGreaterThanEqualOrderByScheduledDateAscScheduledTimeAsc(
            Long userId, LocalDate from);

    // All sessions for a user (history)
    List<StudySession> findByUserIdOrderByScheduledDateDescScheduledTimeDesc(Long userId);
}
