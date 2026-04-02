package com.learnsystem.service;

import com.learnsystem.model.User;
import com.learnsystem.repository.SubmissionRepository;
import com.learnsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Handles streak_days and problems_solved updates after an accepted submission.
 *
 * Streak rules:
 *  - If the user's last login date is TODAY  → streak unchanged (already counted today)
 *  - If the user's last login date is YESTERDAY → streak += 1
 *  - Anything older                           → streak resets to 1
 *
 * problems_solved:
 *  - Counts DISTINCT problems the user has ever passed (status = ACCEPTED).
 *  - Re-computed from the submissions table so it's always accurate even if
 *    submissions are deleted or the user submits the same problem multiple times.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserProgressService {

private final UserRepository       userRepo;
private final SubmissionRepository submissionRepo;

/**
 * Call this immediately after a successful (ACCEPTED) submission.
 * Safe to call on every accepted submit — idempotent for the same day.
 */
@Transactional
public void onAccepted(Long userId) {
	if (userId == null) return;   // anonymous submit — skip

	User user = userRepo.findById(userId).orElse(null);
	if (user == null) return;

	// ── 1. Update streak ──────────────────────────────────────────────
	LocalDate today    = LocalDate.now();
	LocalDate lastDate = user.getLastLogin() != null
			? user.getLastLogin().toLocalDate()
			: null;

	if (lastDate == null || lastDate.isBefore(today.minusDays(1))) {
		// First ever submit, or streak broken
		user.setStreakDays(1);
	} else if (lastDate.equals(today.minusDays(1))) {
		// Submitted on consecutive day
		user.setStreakDays(user.getStreakDays() + 1);
	}
	// If lastDate == today: streak already counted, don't change

	// ── 2. Update last_login to now ────────────────────────────────────
	user.setLastLogin(LocalDateTime.now());

	// ── 3. Recount distinct problems solved ───────────────────────────
	long distinctSolved = submissionRepo
			.countDistinctAcceptedProblemsByUserId(userId);
	user.setProblemsSolved((int) distinctSolved);

	userRepo.save(user);
	log.debug("Progress updated: userId={} streak={} solved={}",
			userId, user.getStreakDays(), user.getProblemsSolved());
}
}