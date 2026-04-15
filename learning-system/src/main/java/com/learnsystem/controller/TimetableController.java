package com.learnsystem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.model.Timetable;
import com.learnsystem.model.User;
import com.learnsystem.repository.TimetableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/timetable")
@RequiredArgsConstructor
public class TimetableController {

    private final TimetableRepository timetableRepo;
    private final ObjectMapper         objectMapper;

    /* ─────────────────────────────── List ─────────────────────────── */

    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        try {
            List<Map<String, Object>> result = new ArrayList<>();
            for (Timetable t : timetableRepo.findByUserIdOrderByCreatedAtDesc(user.getId())) {
                List<?> completed = objectMapper.readValue(t.getCompletedTasksJson(), List.class);
                List<Map<String, Object>> schedule = objectMapper.readValue(t.getScheduleJson(), List.class);
                int totalTasks = schedule.stream()
                    .filter(d -> !Boolean.TRUE.equals(d.get("isRestDay")))
                    .mapToInt(d -> {
                        Object tasks = d.get("tasks");
                        return tasks instanceof List ? ((List<?>) tasks).size() : 0;
                    }).sum();

                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",             t.getId());
                m.put("name",           t.getName());
                m.put("hoursPerDay",    t.getHoursPerDay());
                m.put("startDate",      t.getStartDate());
                m.put("endDate",        t.getEndDate());
                m.put("totalDays",      t.getTotalDays());
                m.put("totalTopics",    t.getTotalTopics());
                m.put("status",         t.getStatus());
                m.put("createdAt",      t.getCreatedAt());
                m.put("completedCount", completed.size());
                m.put("totalTasks",     totalTasks);
                result.add(m);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("timetable list error", e);
            return ResponseEntity.ok(List.of());
        }
    }

    /* ─────────────────────────────── Get one ──────────────────────── */

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return timetableRepo.findByIdAndUserId(id, user.getId())
            .map(t -> {
                try {
                    Map<String, Object> res = new LinkedHashMap<>();
                    res.put("id",             t.getId());
                    res.put("name",           t.getName());
                    res.put("hoursPerDay",    t.getHoursPerDay());
                    res.put("startDate",      t.getStartDate());
                    res.put("endDate",        t.getEndDate());
                    res.put("totalDays",      t.getTotalDays());
                    res.put("totalTopics",    t.getTotalTopics());
                    res.put("status",         t.getStatus());
                    res.put("createdAt",      t.getCreatedAt());
                    res.put("schedule",       objectMapper.readValue(t.getScheduleJson(),       List.class));
                    res.put("completedTasks", objectMapper.readValue(t.getCompletedTasksJson(), List.class));
                    String notesJson = t.getDayNotesJson();
                    res.put("dayNotes", objectMapper.readValue(
                        (notesJson != null && !notesJson.isBlank()) ? notesJson : "{}", Map.class));
                    return ResponseEntity.ok((Object) res);
                } catch (Exception e) {
                    return ResponseEntity.internalServerError().build();
                }
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /* ─────────────────────────── Today's tasks ────────────────────── */

    @GetMapping("/today")
    public ResponseEntity<?> today(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        try {
            String todayStr = LocalDate.now().toString();
            List<Map<String, Object>> result = new ArrayList<>();
            for (Timetable t : timetableRepo.findByUserIdOrderByCreatedAtDesc(user.getId())) {
                if (!"ACTIVE".equals(t.getStatus())) continue;
                List<Map<String, Object>> schedule   = objectMapper.readValue(t.getScheduleJson(), List.class);
                List<String>             completed   = objectMapper.readValue(t.getCompletedTasksJson(), List.class);
                for (Map<String, Object> day : schedule) {
                    if (todayStr.equals(day.get("date"))) {
                        Map<String, Object> entry = new LinkedHashMap<>();
                        entry.put("timetableId",   t.getId());
                        entry.put("timetableName", t.getName());
                        entry.put("day",           day);
                        entry.put("completedTasks", completed);
                        result.add(entry);
                    }
                }
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    /* ─────────────────────────── Generate + Save ──────────────────── */

    @PostMapping("/generate")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> generate(@RequestBody Map<String, Object> req,
                                       @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        try {
            String    name            = (String)  req.getOrDefault("name", "My Study Plan");
            int       hoursPerDay     = ((Number) req.get("hoursPerDay")).intValue();
            LocalDate startDate       = req.get("startDate") != null
                                        ? LocalDate.parse((String) req.get("startDate"))
                                        : LocalDate.now();
            boolean   includeRestDays = Boolean.TRUE.equals(req.get("includeRestDays"));
            List<Map<String, Object>> topics = (List<Map<String, Object>>) req.get("topics");

            if (topics == null || topics.isEmpty())
                return ResponseEntity.badRequest().body(Map.of("message", "Topics list is required"));
            if (hoursPerDay < 1 || hoursPerDay > 12)
                return ResponseEntity.badRequest().body(Map.of("message", "Hours per day must be 1–12"));

            List<Map<String, Object>> schedule = buildSchedule(topics, hoursPerDay, startDate, includeRestDays);

            Timetable t = new Timetable();
            t.setUserId(user.getId());
            t.setName(name);
            t.setHoursPerDay(hoursPerDay);
            t.setStartDate(startDate);
            t.setTotalTopics(topics.size());
            t.setTotalDays(schedule.size());
            t.setScheduleJson(objectMapper.writeValueAsString(schedule));
            t.setCompletedTasksJson("[]");
            t.setStatus("ACTIVE");
            if (req.get("roadmapId") != null)
                t.setRoadmapId(((Number) req.get("roadmapId")).longValue());
            if (!schedule.isEmpty())
                t.setEndDate(LocalDate.parse((String) schedule.get(schedule.size() - 1).get("date")));

            Timetable saved = timetableRepo.save(t);

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("id",             saved.getId());
            res.put("name",           saved.getName());
            res.put("hoursPerDay",    saved.getHoursPerDay());
            res.put("startDate",      saved.getStartDate());
            res.put("endDate",        saved.getEndDate());
            res.put("totalDays",      saved.getTotalDays());
            res.put("totalTopics",    saved.getTotalTopics());
            res.put("status",         saved.getStatus());
            res.put("schedule",       schedule);
            res.put("completedTasks", List.of());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            log.error("timetable generate error", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /* ─────────────────────────── Toggle task ──────────────────────── */

    @PatchMapping("/{id}/toggle-task")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> toggleTask(@PathVariable Long id,
                                         @RequestBody Map<String, Object> req,
                                         @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return timetableRepo.findByIdAndUserId(id, user.getId())
            .map(t -> {
                try {
                    String key = req.get("dayNumber") + "-" + req.get("taskIndex");
                    List<String> completed = new ArrayList<>(
                        objectMapper.readValue(t.getCompletedTasksJson(), List.class));

                    if (completed.contains(key)) completed.remove(key);
                    else                         completed.add(key);

                    t.setCompletedTasksJson(objectMapper.writeValueAsString(completed));

                    // Auto-complete if all tasks done
                    List<Map<String, Object>> schedule = objectMapper.readValue(t.getScheduleJson(), List.class);
                    int total = schedule.stream()
                        .filter(d -> !Boolean.TRUE.equals(d.get("isRestDay")))
                        .mapToInt(d -> ((List<?>) d.get("tasks")).size())
                        .sum();
                    if (completed.size() >= total) t.setStatus("COMPLETED");

                    timetableRepo.save(t);
                    return ResponseEntity.ok((Object) Map.of(
                        "completedTasks", completed,
                        "status",         t.getStatus()));
                } catch (Exception e) {
                    return ResponseEntity.internalServerError().build();
                }
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /* ─────────────────────────── Save day note ────────────────────── */

    @PatchMapping("/{id}/day-note")
    public ResponseEntity<?> saveDayNote(@PathVariable Long id,
                                          @RequestBody Map<String, Object> req,
                                          @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return timetableRepo.findByIdAndUserId(id, user.getId())
            .map(t -> {
                try {
                    String dayKey  = String.valueOf(req.get("dayNumber"));
                    String noteText = (String) req.getOrDefault("note", "");
                    String notesJson = t.getDayNotesJson();
                    Map<String, Object> notes = new java.util.LinkedHashMap<>(
                        objectMapper.readValue(
                            (notesJson != null && !notesJson.isBlank()) ? notesJson : "{}", Map.class));
                    if (noteText == null || noteText.isBlank()) {
                        notes.remove(dayKey);
                    } else {
                        notes.put(dayKey, noteText);
                    }
                    t.setDayNotesJson(objectMapper.writeValueAsString(notes));
                    timetableRepo.save(t);
                    return ResponseEntity.ok((Object) Map.of("dayNotes", notes));
                } catch (Exception e) {
                    return ResponseEntity.internalServerError().build();
                }
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /* ─────────────────────────────── Delete ───────────────────────── */

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        timetableRepo.deleteByIdAndUserId(id, user.getId());
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    /* ══════════════════════  Schedule builder  ══════════════════════ */

    private List<Map<String, Object>> buildSchedule(List<Map<String, Object>> topics,
                                                     int hoursPerDay,
                                                     LocalDate startDate,
                                                     boolean includeRestDays) {
        int minutesPerDay = hoursPerDay * 60;

        // ── 1. Build flat task queue ──────────────────────────────────
        List<Map<String, Object>> queue = new ArrayList<>();
        for (Map<String, Object> topic : topics) {
            String name    = (String) topic.get("name");
            String phase   = (String) topic.getOrDefault("phase", "");
            Object topicId = topic.get("id");

            queue.add(task(topicId, name, phase, "THEORY",
                           "Study theory, memory anchors & analogies", 45));

            if (hoursPerDay >= 4) {
                queue.add(task(topicId, name, phase, "PRACTICE_EASY",   "Solve 3 easy problems",   60));
                queue.add(task(topicId, name, phase, "PRACTICE_MEDIUM", "Solve 2 medium problems", 70));
                queue.add(task(topicId, name, phase, "PRACTICE_HARD",   "Solve 1 hard problem",    45));
            } else if (hoursPerDay >= 2) {
                queue.add(task(topicId, name, phase, "PRACTICE_EASY",   "Solve 3 easy problems",   60));
                queue.add(task(topicId, name, phase, "PRACTICE_MEDIUM", "Solve 2 medium problems", 70));
            } else {
                queue.add(task(topicId, name, phase, "PRACTICE",        "Practice problems",       45));
            }
            queue.add(task(topicId, name, phase, "REVIEW",
                           "Q&A flashcards + spaced repetition", 20));
        }

        // ── 2. Bin-pack into days ─────────────────────────────────────
        List<Map<String, Object>> days      = new ArrayList<>();
        List<Map<String, Object>> dayTasks  = new ArrayList<>();
        int dayMinutes = 0;
        int dayNum     = 1;
        LocalDate date = startDate;
        int studyDayCount = 0;

        for (Map<String, Object> t : queue) {
            int taskMin = (int) t.get("minutes");

            if (!dayTasks.isEmpty() && dayMinutes + taskMin > minutesPerDay) {
                days.add(studyDay(dayNum, date, dayTasks, dayMinutes));
                dayNum++;
                date = date.plusDays(1);
                studyDayCount++;

                if (includeRestDays && studyDayCount % 7 == 0) {
                    days.add(restDay(dayNum, date));
                    dayNum++;
                    date = date.plusDays(1);
                }

                dayTasks  = new ArrayList<>();
                dayMinutes = 0;
            }

            dayTasks.add(t);
            dayMinutes += taskMin;
        }

        if (!dayTasks.isEmpty()) {
            days.add(studyDay(dayNum, date, dayTasks, dayMinutes));
        }

        return days;
    }

    private Map<String, Object> task(Object topicId, String topicName, String phase,
                                      String type, String description, int minutes) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("topicId",     topicId);
        m.put("topicName",   topicName);
        m.put("phase",       phase);
        m.put("type",        type);
        m.put("description", description);
        m.put("minutes",     minutes);
        return m;
    }

    private Map<String, Object> studyDay(int dayNum, LocalDate date,
                                          List<Map<String, Object>> tasks, int totalMin) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("dayNumber",    dayNum);
        d.put("date",         date.toString());
        d.put("tasks",        new ArrayList<>(tasks));
        d.put("totalMinutes", totalMin);
        d.put("isRestDay",    false);
        return d;
    }

    private Map<String, Object> restDay(int dayNum, LocalDate date) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("dayNumber",    dayNum);
        d.put("date",         date.toString());
        d.put("tasks",        List.of());
        d.put("totalMinutes", 0);
        d.put("isRestDay",    true);
        return d;
    }
}
