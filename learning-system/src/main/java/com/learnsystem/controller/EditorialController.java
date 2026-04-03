package com.learnsystem.controller;

import com.learnsystem.model.Problem;
import com.learnsystem.model.Submission;
import com.learnsystem.model.User;
import com.learnsystem.repository.ProblemRepository;
import com.learnsystem.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class EditorialController {

private final ProblemRepository    problemRepo;
private final SubmissionRepository submissionRepo;

@GetMapping("/{id}/editorial")
public ResponseEntity<?> getEditorial(
		@PathVariable Long id,
		@AuthenticationPrincipal User user) {

	Problem problem = problemRepo.findById(id).orElse(null);
	if (problem == null) {
		return ResponseEntity.notFound().build();
	}

	// Check user has an accepted submission for this problem
	List<Submission> submissions = submissionRepo
			.findByUserIdAndProblemIdOrderByCreatedAtDesc(user.getId(), id);

	boolean hasSolved = submissions.stream()
			.anyMatch(s -> "ACCEPTED".equalsIgnoreCase(s.getStatus()));

	if (!hasSolved) {
		return ResponseEntity.status(403).body(Map.of(
				"error",   "Editorial locked",
				"message", "Solve the problem first to unlock the editorial."
		));
	}

	// User has solved it — return editorial content
	Map<String, Object> editorial = new LinkedHashMap<>();
	editorial.put("problemId",        problem.getId());
	editorial.put("title",            problem.getTitle());
	editorial.put("solutionCode",     problem.getSolutionCode());
	editorial.put("bruteForce",       null); // problems don't carry these — topic does
	editorial.put("optimizedApproach",null);
	editorial.put("hint3",            problem.getHint3()); // pseudocode recap

	return ResponseEntity.ok(editorial);
}
}