package com.learnsystem.service;

import com.learnsystem.model.User;
import com.learnsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Phase 2 — Streak Engine.
 *
 * Rules (from master plan):
 *  - Solve 1 problem or complete 1 quick win = streak maintained
 *  - 7-day streak  = 1 pause day earned (max 3 banked)
 *  - 14-day streak = 1 additional pause day earned
 *  - Pause day protects streak for that day (cannot be stacked)
 *  - Miss exactly 1 day → offer streak recovery challenge (solve 2 problems in 24h)
 *  - 1 recovery per 30 days
 *  - Streak resets if missed day > 1 OR no recovery available
 *
 * XP awards:
 *  - First solve on a problem: +10 XP
 *  - Wrong answer attempt:      +1 XP (you tried)
 *  - 7-day streak milestone:   +50 XP
 *  - New level:                +100 XP
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StreakService {

private final UserRepository userRepo;

private static final int[] PAUSE_DAY_MILESTONES = {7, 14};
private static final int MAX_PAUSE_DAYS = 3;

// XP required for each level
private static final int[] LEVEL_THRESHOLDS = {0, 100, 300, 700, 1500, 3000};
private static final String[] LEVEL_NAMES = {
		"Beginner", "Learner", "Practitioner", "Engineer", "Senior", "Architect"
};

// ── Core streak update (called after every accepted submission) ────────────

@Transactional
public Map<String, Object> onDailyActivity(Long userId, int xpEarned) {
	if (userId == null) return Map.of();
	User user = userRepo.findById(userId).orElse(null);
	if (user == null) return Map.of();

	LocalDate today    = LocalDate.now();
	LocalDate lastActive = user.getLastActiveDate();

	Map<String, Object> result = new LinkedHashMap<>();
	result.put("streakKept", false);
	result.put("streakBroken", false);
	result.put("pauseDayUsed", false);
	result.put("pauseDayEarned", false);
	result.put("recoveryAvailable", false);
	result.put("levelUp", false);

	if (lastActive == null) {
		// First ever activity
		user.setStreakDays(1);
		result.put("streakKept", true);
	} else if (lastActive.equals(today)) {
		// Already active today — no change to streak
		result.put("streakKept", true);
	} else if (lastActive.equals(today.minusDays(1))) {
		// Consecutive day — extend streak
		user.setStreakDays(user.getStreakDays() + 1);
		result.put("streakKept", true);
		result.put("newStreak", user.getStreakDays());

		// Check pause day milestones
		for (int milestone : PAUSE_DAY_MILESTONES) {
			if (user.getStreakDays() == milestone && user.getPauseDaysBanked() < MAX_PAUSE_DAYS) {
				user.setPauseDaysBanked(user.getPauseDaysBanked() + 1);
				result.put("pauseDayEarned", true);
				result.put("pauseDaysBanked", user.getPauseDaysBanked());
				xpEarned += 50; // streak milestone bonus
			}
		}
	} else {
		// Missed a day or more
		long daysMissed = lastActive.until(today).getDays();
		if (daysMissed == 2) {
			// Missed exactly 1 day — check if recovery is available
			boolean canRecover = user.getLastRecoveryUsed() == null ||
					user.getLastRecoveryUsed().until(today).getDays() >= 30;
			result.put("recoveryAvailable", canRecover);
			result.put("missedDays", 1);
			// Streak broken for now — recovery will restore it if user completes challenge
			user.setStreakDays(0);
			result.put("streakBroken", true);
		} else {
			// Missed 2+ days — reset
			user.setStreakDays(1);
			result.put("streakBroken", true);
			result.put("missedDays", daysMissed - 1);
		}
	}

	user.setLastActiveDate(today);

	// XP + level
	if (xpEarned > 0) {
		int oldXp = user.getXp();
		user.setXp(oldXp + xpEarned);
		String newLevel = computeLevel(user.getXp());
		if (!newLevel.equals(user.getLevel())) {
			user.setLevel(newLevel);
			result.put("levelUp", true);
			result.put("newLevel", newLevel);
			user.setXp(user.getXp() + 100); // level-up bonus
		}
	}

	result.put("streakDays",    user.getStreakDays());
	result.put("xp",            user.getXp());
	result.put("level",         user.getLevel());
	result.put("pauseDaysBanked", user.getPauseDaysBanked());

	userRepo.save(user);
	return result;
}

// ── Pause day activation ───────────────────────────────────────────────────

@Transactional
public Map<String, Object> usePauseDay(Long userId) {
	User user = userRepo.findById(userId)
			.orElseThrow(() -> new IllegalArgumentException("User not found"));

	if (user.getPauseDaysBanked() <= 0) {
		return Map.of("success", false, "message", "No pause days banked");
	}
	if (user.getLastActiveDate() != null &&
			user.getLastActiveDate().equals(LocalDate.now())) {
		return Map.of("success", false, "message", "Already active today — no need to use a pause day");
	}

	user.setPauseDaysBanked(user.getPauseDaysBanked() - 1);
	user.setLastActiveDate(LocalDate.now()); // treats today as active
	userRepo.save(user);
	log.info("Pause day used: userId={} remaining={}", userId, user.getPauseDaysBanked());
	return Map.of(
			"success", true,
			"message", "Pause day used — streak protected for today ✓",
			"pauseDaysBanked", user.getPauseDaysBanked(),
			"streakDays", user.getStreakDays()
	);
}

// ── Streak recovery ────────────────────────────────────────────────────────

@Transactional
public Map<String, Object> applyRecovery(Long userId) {
	User user = userRepo.findById(userId)
			.orElseThrow(() -> new IllegalArgumentException("User not found"));

	LocalDate today = LocalDate.now();
	boolean canRecover = user.getLastRecoveryUsed() == null ||
			user.getLastRecoveryUsed().until(today).getDays() >= 30;

	if (!canRecover) {
		return Map.of("success", false,
				"message", "Streak recovery already used this month");
	}

	user.setLastRecoveryUsed(today);
	user.setLastActiveDate(today);
	user.setStreakDays(user.getStreakDays() > 0 ? user.getStreakDays() : 1);
	userRepo.save(user);
	log.info("Streak recovery applied: userId={} streak={}", userId, user.getStreakDays());
	return Map.of(
			"success", true,
			"message", "Streak restored ✓ (1 recovery per 30 days)",
			"streakDays", user.getStreakDays()
	);
}

// ── Streak status (for dashboard) ─────────────────────────────────────────

public Map<String, Object> getStatus(Long userId) {
	User user = userRepo.findById(userId).orElseThrow();
	LocalDate today = LocalDate.now();
	LocalDate lastActive = user.getLastActiveDate();

	boolean activeToday = lastActive != null && lastActive.equals(today);
	boolean missedYesterday = lastActive != null &&
			lastActive.equals(today.minusDays(1)) == false &&
			lastActive.until(today).getDays() == 2;
	boolean recoveryAvailable = missedYesterday &&
			(user.getLastRecoveryUsed() == null ||
					user.getLastRecoveryUsed().until(today).getDays() >= 30);

	Map<String, Object> m = new LinkedHashMap<>();
	m.put("streakDays",         user.getStreakDays());
	m.put("pauseDaysBanked",    user.getPauseDaysBanked());
	m.put("activeToday",        activeToday);
	m.put("recoveryAvailable",  recoveryAvailable);
	m.put("xp",                 user.getXp());
	m.put("level",              user.getLevel());
	m.put("nextLevelXp",        nextLevelXp(user.getXp()));
	m.put("lastActiveDate",     lastActive != null ? lastActive.toString() : null);
	return m;
}

// ── Scheduled: nightly streak check ──────────────────────────────────────
// Runs at midnight — marks users who missed the day (streak already broken
// when they next submit; this is informational only, not destructive)
@Scheduled(cron = "0 0 0 * * *")
public void nightlyStreakCheck() {
	log.info("Nightly streak check running…");
	// No destructive action needed — streak is lazily checked on next activity
}

// ── Helpers ───────────────────────────────────────────────────────────────

private String computeLevel(int xp) {
	for (int i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
		if (xp >= LEVEL_THRESHOLDS[i]) return LEVEL_NAMES[i];
	}
	return LEVEL_NAMES[0];
}

private int nextLevelXp(int xp) {
	for (int threshold : LEVEL_THRESHOLDS) {
		if (xp < threshold) return threshold;
	}
	return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
}
}