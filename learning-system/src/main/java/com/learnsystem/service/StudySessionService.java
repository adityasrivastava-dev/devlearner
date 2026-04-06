package com.learnsystem.service;

import com.learnsystem.model.StudySession;
import com.learnsystem.repository.StudySessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StudySessionService {

    private final StudySessionRepository repo;

    // ── Create ─────────────────────────────────────────────────────────────

    public StudySession create(Long userId, Map<String, Object> body) {
        StudySession session = StudySession.builder()
                .userId(userId)
                .title((String) body.getOrDefault("title", "Study Session"))
                .scheduledDate(LocalDate.parse((String) body.get("scheduledDate")))
                .scheduledTime(body.containsKey("scheduledTime") && body.get("scheduledTime") != null
                        ? java.time.LocalTime.parse((String) body.get("scheduledTime")) : null)
                .durationMinutes(body.get("durationMinutes") instanceof Number n ? n.intValue() : 0)
                .notes((String) body.get("notes"))
                .topicId(body.get("topicId") instanceof Number n ? n.longValue() : null)
                .problemId(body.get("problemId") instanceof Number n ? n.longValue() : null)
                .completed(false)
                .build();
        return repo.save(session);
    }

    // ── Read ───────────────────────────────────────────────────────────────

    /** Calendar range query — used by the study planner calendar view */
    public List<StudySession> getByDateRange(Long userId, LocalDate start, LocalDate end) {
        return repo.findByUserIdAndScheduledDateBetweenOrderByScheduledDateAscScheduledTimeAsc(
                userId, start, end);
    }

    /** Upcoming incomplete sessions from today onward */
    public List<StudySession> getUpcoming(Long userId) {
        return repo.findByUserIdAndCompletedFalseAndScheduledDateGreaterThanEqualOrderByScheduledDateAscScheduledTimeAsc(
                userId, LocalDate.now());
    }

    /** Full history */
    public List<StudySession> getAll(Long userId) {
        return repo.findByUserIdOrderByScheduledDateDescScheduledTimeDesc(userId);
    }

    // ── Update ─────────────────────────────────────────────────────────────

    public StudySession update(Long sessionId, Long userId, Map<String, Object> body) {
        StudySession session = getOwned(sessionId, userId);

        if (body.containsKey("title"))           session.setTitle((String) body.get("title"));
        if (body.containsKey("scheduledDate"))   session.setScheduledDate(LocalDate.parse((String) body.get("scheduledDate")));
        if (body.containsKey("scheduledTime"))   session.setScheduledTime(
                body.get("scheduledTime") != null ? java.time.LocalTime.parse((String) body.get("scheduledTime")) : null);
        if (body.containsKey("durationMinutes")) session.setDurationMinutes(
                body.get("durationMinutes") instanceof Number n ? n.intValue() : 0);
        if (body.containsKey("notes"))           session.setNotes((String) body.get("notes"));
        if (body.containsKey("topicId"))         session.setTopicId(
                body.get("topicId") instanceof Number n ? n.longValue() : null);
        if (body.containsKey("problemId"))       session.setProblemId(
                body.get("problemId") instanceof Number n ? n.longValue() : null);

        return repo.save(session);
    }

    /** Mark a session as completed */
    public StudySession complete(Long sessionId, Long userId) {
        StudySession session = getOwned(sessionId, userId);
        session.setCompleted(true);
        session.setCompletedAt(LocalDateTime.now());
        return repo.save(session);
    }

    // ── Delete ─────────────────────────────────────────────────────────────

    public void delete(Long sessionId, Long userId) {
        StudySession session = getOwned(sessionId, userId);
        repo.delete(session);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private StudySession getOwned(Long sessionId, Long userId) {
        return repo.findById(sessionId)
                .filter(s -> s.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Session not found or access denied"));
    }
}
