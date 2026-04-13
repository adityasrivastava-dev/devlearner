package com.learnsystem.service;

import com.learnsystem.model.*;
import com.learnsystem.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Phase 2 — Performance Analytics.
 *
 * Called after every submission to:
 *  1. Update UserTopicPerformance (accuracy, solve time, confidence score)
 *  2. Record MistakeRecord for wrong answers
 *  3. Enqueue topic + problem into Spaced Repetition
 *
 * Confidence Score formula (0-100):
 *   accuracy_component   = accuracyRate * 40          (0-40)
 *   speed_component      = max(0, 20 - avgSolveMinutes) * 1  (0-20, capped at 20min)
 *   hint_free_component  = (1 - hintRatio) * 20       (0-20)
 *   recency_component    = max(0, 20 - daysSinceLast)  (0-20, decays over 20 days)
 *   total = sum of above, clamped 0-100
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PerformanceAnalyticsService {

private final UserTopicPerformanceRepository perfRepo;
private final MistakeRecordRepository        mistakeRepo;
private final SpacedRepetitionService        srsService;
private final TopicRepository                topicRepo;

/**
 * Call after every submission (accepted or not).
 * @param userId         the submitting user (null = anonymous, skip)
 * @param problemId      the problem submitted
 * @param topicId        topic this problem belongs to (may be null)
 * @param status         ACCEPTED | WRONG_ANSWER | COMPILE_ERROR | RUNTIME_ERROR | TLE
 * @param solveTimeSecs  seconds from problem open to submit (may be null)
 * @param hintAssisted   whether user used Hint 3
 * @param detectedPattern algorithm pattern detected in code
 * @param correctPattern  algorithm pattern tagged on the problem
 * @param code            submitted code (for MistakeRecord)
 */
@Transactional
public void onSubmission(Long userId, Long problemId, Long topicId,
                         String problemTitle, String status,
                         Long solveTimeSecs, boolean hintAssisted,
                         String detectedPattern, String correctPattern,
                         String code) {
	if (userId == null || topicId == null) return;

	boolean accepted = "ACCEPTED".equals(status);

	// ── 1. Update performance stats ────────────────────────────────────
	String topicTitle    = topicRepo.findById(topicId)
			.map(t -> t.getTitle()).orElse("Unknown");
	String topicCategory = topicRepo.findById(topicId)
			.map(t -> t.getCategory().name()).orElse("DSA");

	UserTopicPerformance perf = perfRepo
			.findByUserIdAndTopicId(userId, topicId)
			.orElseGet(() -> UserTopicPerformance.builder()
					.userId(userId)
					.topicId(topicId)
					.topicTitle(topicTitle)
					.topicCategory(topicCategory)
					.build());

	perf.setAttempts(perf.getAttempts() + 1);
	if (accepted) {
		perf.setAccepted(perf.getAccepted() + 1);

		// Update average solve time
		if (solveTimeSecs != null && solveTimeSecs > 0) {
			long prevTotal = perf.getAvgSolveTimeSecs() * (perf.getAccepted() - 1);
			perf.setAvgSolveTimeSecs((prevTotal + solveTimeSecs) / perf.getAccepted());
		}
	}
	perf.setAccuracyRate(perf.getAttempts() > 0
			? (double) perf.getAccepted() / perf.getAttempts() : 0.0);
	perf.setLastAttempted(LocalDateTime.now());

	// Recompute confidence score
	perf.setConfidenceScore(computeConfidence(perf, hintAssisted));
	perfRepo.save(perf);

	// ── 2. Record mistake if wrong ─────────────────────────────────────
	if (!accepted) {
		MistakeRecord mistake = MistakeRecord.builder()
				.userId(userId)
				.problemId(problemId)
				.problemTitle(problemTitle)
				.topicId(topicId)
				.topicTitle(topicTitle)
				.errorType(status)
				.detectedPattern(detectedPattern)
				.correctPattern(correctPattern)
				.submissionCode(code != null && code.length() > 3000
						? code.substring(0, 3000) + "…" : code)
				.build();
		mistakeRepo.save(mistake);
	}

	// ── 3. Add to Spaced Repetition queue ─────────────────────────────
	if (accepted) {
		srsService.enqueue(userId, "PROBLEM", problemId, problemTitle);
		srsService.enqueue(userId, "TOPIC",   topicId,   topicTitle);
	}

	log.debug("Analytics updated: userId={} topicId={} status={} confidence={}",
			userId, topicId, status, perf.getConfidenceScore());
}

// ── Confidence score calculation ──────────────────────────────────────────

private int computeConfidence(UserTopicPerformance perf, boolean lastHintAssisted) {
	// accuracy component: 0-40
	double accuracy = perf.getAccuracyRate() * 40.0;

	// speed component: 0-20 (faster = better, cap at 20 min)
	double avgMinutes = perf.getAvgSolveTimeSecs() / 60.0;
	double speed = Math.max(0, 20.0 - avgMinutes);
	speed = Math.min(20.0, speed);

	// hint-free component: penalise if last submission was hint-assisted
	double hintFree = lastHintAssisted ? 10.0 : 20.0;

	// recency component: 0-20 (decays if not practised recently)
	double recency = 20.0;
	if (perf.getLastAttempted() != null) {
		long daysSince = ChronoUnit.DAYS.between(
				perf.getLastAttempted().toLocalDate(),
				java.time.LocalDate.now());
		recency = Math.max(0, 20.0 - daysSince);
	}

	int score = (int) Math.round(accuracy + speed + hintFree + recency);
	return Math.max(0, Math.min(100, score));
}

// ── Analytics read endpoints ──────────────────────────────────────────────

public Map<String, Object> getDashboard(Long userId) {
	List<UserTopicPerformance> all   = perfRepo.findByUserIdOrderByConfidenceScoreAsc(userId);
	List<UserTopicPerformance> weak  = perfRepo.findWeakAreas(userId);
	List<UserTopicPerformance> strong= perfRepo.findStrongAreas(userId);

	// Mistake summary
	List<Object[]> errorTypes = mistakeRepo.countByErrorType(userId);
	List<Object[]> confusions = mistakeRepo.findPatternConfusions(userId);

	Map<String, Object> result = new LinkedHashMap<>();
	result.put("totalTopicsTried", all.size());
	result.put("weakAreas",  weak.stream().limit(5).map(this::toPerfDto).toList());
	result.put("strongAreas",strong.stream().limit(5).map(this::toPerfDto).toList());
	result.put("errorBreakdown", errorTypes.stream().map(r -> {
		Map<String, Object> m = new LinkedHashMap<>();
		m.put("type",  r[0] != null ? r[0] : "UNKNOWN");
		m.put("count", r[1] != null ? r[1] : 0);
		return m;
	}).toList());
	result.put("patternConfusions", confusions.stream().limit(5).map(r -> {
		Map<String, Object> m = new LinkedHashMap<>();
		m.put("detected", r[0] != null ? r[0] : "");
		m.put("correct",  r[1] != null ? r[1] : "");
		m.put("count",    r[2] != null ? r[2] : 0);
		return m;
	}).toList());
	return result;
}

public List<Map<String, Object>> getMistakeJournal(Long userId) {
	// Fetch at most 50 rows at the DB level — avoids loading unbounded history into heap
	return mistakeRepo.findRecentByUserId(userId, PageRequest.of(0, 50))
			.stream().map(m -> {
				Map<String, Object> map = new LinkedHashMap<>();
				map.put("id",               m.getId());
				map.put("problemId",        m.getProblemId());
				map.put("problemTitle",     m.getProblemTitle());
				map.put("topicTitle",       m.getTopicTitle());
				map.put("errorType",        m.getErrorType());
				map.put("detectedPattern",  m.getDetectedPattern());
				map.put("correctPattern",   m.getCorrectPattern());
				map.put("createdAt",        m.getCreatedAt() != null ? m.getCreatedAt().toString() : null);
				return map;
			}).toList();
}

private Map<String, Object> toPerfDto(UserTopicPerformance p) {
	Map<String, Object> m = new LinkedHashMap<>();
	m.put("topicId",         p.getTopicId());
	m.put("topicTitle",      p.getTopicTitle());
	m.put("topicCategory",   p.getTopicCategory());
	m.put("confidenceScore", p.getConfidenceScore());
	m.put("accuracyRate",    Math.round(p.getAccuracyRate() * 100));
	m.put("attempts",        p.getAttempts());
	m.put("accepted",        p.getAccepted());
	return m;
}
}