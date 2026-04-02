package com.learnsystem.service;

import com.learnsystem.model.SpacedRepetitionEntry;
import com.learnsystem.repository.SpacedRepetitionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

/**
 * Phase 2 — Spaced Repetition using the SM-2 algorithm.
 *
 * SM-2 quality scale (0-5):
 *   5 = perfect recall, no hesitation
 *   4 = correct with slight hesitation
 *   3 = correct but difficult (incorrect but easy to recall)
 *   2 = wrong, but answer was "obvious" once seen
 *   1 = wrong, and answer was hard to recall
 *   0 = complete blank
 *
 * Quality >= 3 = "pass" (repetitions continues)
 * Quality < 3  = "fail" (repetitions reset to 0, interval back to 1)
 *
 * Interval schedule:
 *   repetitions == 0: 1 day
 *   repetitions == 1: 6 days
 *   repetitions >= 2: interval * easeFactor (rounded)
 *
 * EaseFactor update: EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
 * Minimum EF = 1.3
 *
 * Items are added to the SRS queue:
 *  - On topic completion (first visit through examples)   → "TOPIC"
 *  - On problem solved (ACCEPTED)                         → "PROBLEM"
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SpacedRepetitionService {

private final SpacedRepetitionRepository repo;

// ── Add to queue ──────────────────────────────────────────────────────────

/**
 * Add a topic or problem to the SRS queue for the first time.
 * Idempotent: calling twice for the same item does nothing.
 */
@Transactional
public void enqueue(Long userId, String itemType, Long itemId, String itemTitle) {
	if (repo.findByUserIdAndItemTypeAndItemId(userId, itemType, itemId).isPresent()) {
		return; // already queued
	}
	SpacedRepetitionEntry entry = SpacedRepetitionEntry.builder()
			.userId(userId)
			.itemType(itemType)
			.itemId(itemId)
			.itemTitle(itemTitle)
			.nextReviewDate(LocalDate.now().plusDays(1))
			.intervalDays(1)
			.easeFactor(2.5)
			.repetitions(0)
			.build();
	repo.save(entry);
	log.debug("SRS enqueued: userId={} type={} id={}", userId, itemType, itemId);
}

// ── Process a review ──────────────────────────────────────────────────────

/**
 * Process a review result using SM-2.
 * quality: 0-5 (0=complete blank, 5=perfect)
 *
 * @return the updated entry (with new nextReviewDate)
 */
@Transactional
public SpacedRepetitionEntry review(Long userId, String itemType, Long itemId, int quality) {
	quality = Math.max(0, Math.min(5, quality)); // clamp to 0-5

	SpacedRepetitionEntry entry = repo
			.findByUserIdAndItemTypeAndItemId(userId, itemType, itemId)
			.orElseGet(() -> SpacedRepetitionEntry.builder()
					.userId(userId)
					.itemType(itemType)
					.itemId(itemId)
					.nextReviewDate(LocalDate.now())
					.intervalDays(1)
					.easeFactor(2.5)
					.repetitions(0)
					.build());

	// SM-2 update
	if (quality >= 3) {
		// Correct response
		int newInterval;
		if (entry.getRepetitions() == 0) {
			newInterval = 1;
		} else if (entry.getRepetitions() == 1) {
			newInterval = 6;
		} else {
			newInterval = (int) Math.round(entry.getIntervalDays() * entry.getEaseFactor());
		}
		entry.setIntervalDays(newInterval);
		entry.setRepetitions(entry.getRepetitions() + 1);
	} else {
		// Wrong answer — reset
		entry.setRepetitions(0);
		entry.setIntervalDays(1);
	}

	// Update ease factor
	double ef = entry.getEaseFactor()
			+ (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
	entry.setEaseFactor(Math.max(1.3, ef));

	entry.setNextReviewDate(LocalDate.now().plusDays(entry.getIntervalDays()));
	entry.setLastQuality(quality);
	entry.setLastReviewedAt(LocalDateTime.now());

	return repo.save(entry);
}

// ── Read queue ────────────────────────────────────────────────────────────

/** Items due today or overdue for this user */
public List<SpacedRepetitionEntry> getDueItems(Long userId) {
	return repo.findDueItems(userId, LocalDate.now());
}

/** Count of due items — shown as badge on dashboard */
public long getDueCount(Long userId) {
	return repo.countDueItems(userId, LocalDate.now());
}

/** Full queue with metadata for the SRS dashboard */
public Map<String, Object> getQueueSummary(Long userId) {
	List<SpacedRepetitionEntry> due    = getDueItems(userId);
	List<SpacedRepetitionEntry> all    = repo.findByUserIdOrderByNextReviewDateAsc(userId);
	List<SpacedRepetitionEntry> upcoming = all.stream()
			.filter(e -> e.getNextReviewDate().isAfter(LocalDate.now()))
			.limit(10)
			.toList();

	Map<String, Object> result = new LinkedHashMap<>();
	result.put("dueCount",    due.size());
	result.put("totalQueued", all.size());
	result.put("due",         due.stream().map(this::toDto).toList());
	result.put("upcoming",    upcoming.stream().map(this::toDto).toList());
	return result;
}

private Map<String, Object> toDto(SpacedRepetitionEntry e) {
	Map<String, Object> m = new LinkedHashMap<>();
	m.put("id",             e.getId());
	m.put("itemType",       e.getItemType());
	m.put("itemId",         e.getItemId());
	m.put("itemTitle",      e.getItemTitle());
	m.put("nextReviewDate", e.getNextReviewDate().toString());
	m.put("intervalDays",   e.getIntervalDays());
	m.put("repetitions",    e.getRepetitions());
	m.put("easeFactor",     Math.round(e.getEaseFactor() * 100.0) / 100.0);
	m.put("lastQuality",    e.getLastQuality());
	return m;
}
}