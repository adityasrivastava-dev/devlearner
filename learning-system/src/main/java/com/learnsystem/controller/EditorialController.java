package com.learnsystem.controller;

import com.learnsystem.model.Problem;
import com.learnsystem.model.Submission;
import com.learnsystem.model.User;
import com.learnsystem.repository.ProblemRepository;
import com.learnsystem.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * GET /api/problems/{id}/editorial
 *
 * Returns editorial (solution code + approach) for a problem.
 * ONLY accessible after the authenticated user has at least one ACCEPTED submission.
 *
 * This endpoint exists to prevent users from reading solutionCode via DevTools
 * on the regular /api/topics/:id/problems response (Bug 7 fix).
 */
@Slf4j
@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class EditorialController {

private final ProblemRepository    problemRepo;
private final SubmissionRepository submissionRepo;

@GetMapping("/{id}/editorial")
@Transactional(readOnly = true)
public ResponseEntity<?> getEditorial(
		@PathVariable Long id,
		@AuthenticationPrincipal User user) {

	if (user == null) {
		return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
	}

	Problem problem = problemRepo.findById(id).orElse(null);
	if (problem == null) {
		return ResponseEntity.notFound().build();
	}

	// Check unlock conditions for this problem
	List<Submission> submissions = submissionRepo
			.findByUserIdAndProblemIdOrderByCreatedAtDesc(user.getId(), id);

	boolean hasSolved      = submissions.stream().anyMatch(s -> "ACCEPTED".equalsIgnoreCase(s.getStatus()));
	long    failedAttempts = submissions.stream().filter(s -> !"ACCEPTED".equalsIgnoreCase(s.getStatus())).count();

	// Unlock after: ACCEPTED, OR 2+ failed attempts (struggle unlock)
	boolean unlocked = hasSolved || failedAttempts >= 2;

	if (!unlocked) {
		log.warn("Editorial locked: problemId={} userId={} failedAttempts={}", id, user.getId(), failedAttempts);
		return ResponseEntity.status(403).body(Map.of(
				"error",        "Editorial locked",
				"message",      "Solve the problem or make 2 attempts to unlock the editorial.",
				"failedAttempts", failedAttempts,
				"attemptsNeeded", 2
		));
	}
	log.info("Editorial accessed: problemId={} userId={}", id, user.getId());

	// Resolve brute force and optimized approach:
	// 1. Use per-problem fields if set (most specific)
	// 2. Fall back to topic-level fields (general approach for the topic)
	String bruteForce = problem.getBruteForce();
	String optimizedApproach = problem.getOptimizedApproach();
	try {
		if ((bruteForce == null || optimizedApproach == null) && problem.getTopic() != null) {
			if (bruteForce        == null) bruteForce        = problem.getTopic().getBruteForce();
			if (optimizedApproach == null) optimizedApproach = problem.getTopic().getOptimizedApproach();
		}
	} catch (Exception ignored) {
		// Lazy load failed — topic fields stay null, not critical
	}

	Map<String, Object> editorial = new LinkedHashMap<>();
	editorial.put("problemId",        problem.getId());
	editorial.put("title",            problem.getTitle());
	editorial.put("solutionCode",     problem.getSolutionCode());
	editorial.put("bruteForce",       bruteForce);
	editorial.put("optimizedApproach",optimizedApproach);
	editorial.put("hint3",            problem.getHint3());
	editorial.put("editorial",        problem.getEditorial());  // per-problem explanation

	return ResponseEntity.ok(editorial);
}
}