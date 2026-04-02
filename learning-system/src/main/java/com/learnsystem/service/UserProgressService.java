package com.learnsystem.service;

import com.learnsystem.repository.SubmissionRepository;
import com.learnsystem.repository.UserRepository;
import com.learnsystem.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles problems_solved count ONLY.
 *
 * Streak logic is fully owned by StreakService.
 * This service exists to recount distinct accepted problems from the
 * submissions table so problems_solved is always accurate.
 *
 * Called from SubmissionController AFTER StreakService so the problems_solved
 * update does not race with the streak/XP update.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserProgressService {

private final UserRepository       userRepo;
private final SubmissionRepository submissionRepo;

/**
 * Recount and persist problems_solved for the user.
 * Safe to call on every submit (ACCEPTED or not) — idempotent.
 */
@Transactional
public void onAccepted(Long userId) {
	if (userId == null) return;

	User user = userRepo.findById(userId).orElse(null);
	if (user == null) return;

	// Recount DISTINCT problems ever solved — always accurate
	long distinctSolved = submissionRepo.countDistinctAcceptedProblemsByUserId(userId);
	user.setProblemsSolved((int) distinctSolved);
	userRepo.save(user);

	log.debug("problems_solved updated: userId={} solved={}", userId, distinctSolved);
}
}