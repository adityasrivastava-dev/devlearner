package com.learnsystem.service;

import com.learnsystem.model.*;
import com.learnsystem.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizService {

private final QuizSetRepository      setRepo;
private final QuizQuestionRepository questionRepo;
private final QuizAttemptRepository  attemptRepo;
private final QuizAnswerRepository   answerRepo;

// ── Get all quiz sets ─────────────────────────────────────────────────────
public List<Map<String, Object>> getSets(String category) {
	List<QuizSet> sets = (category != null && !category.isBlank() && !category.equals("ALL"))
			? setRepo.findByCategoryAndActiveTrueOrderByDisplayOrderAsc(category)
			: setRepo.findByActiveTrueOrderByDisplayOrderAscTitleAsc();

	return sets.stream().map(this::setToDto).toList();
}

// ── Get one quiz set with its questions (shuffled options, hide correct) ──
public Map<String, Object> getSetForPlay(Long setId) {
	QuizSet set = setRepo.findById(setId)
			.orElseThrow(() -> new RuntimeException("Quiz set not found: " + setId));

	List<QuizQuestion> questions = questionRepo.findBySetIdOrderByOrderIndex(setId);

	// Shuffle question order for variety
	List<QuizQuestion> shuffled = new ArrayList<>(questions);
	Collections.shuffle(shuffled);

	List<Map<String, Object>> qDtos = shuffled.stream()
			.map(this::questionToPlayDto)
			.toList();

	Map<String, Object> result = new LinkedHashMap<>();
	result.put("set", setToDto(set));
	result.put("questions", qDtos);
	result.put("totalQuestions", qDtos.size());
	return result;
}

// ── Submit a completed quiz attempt ───────────────────────────────────────
@Transactional
public Map<String, Object> submitAttempt(Long userId, Long setId,
                                         List<Map<String, Object>> answers,
                                         Long timeTakenSecs) {

	QuizSet set = setRepo.findById(setId)
			.orElseThrow(() -> new RuntimeException("Quiz set not found: " + setId));

	// Load all questions for this set (need correct answers)
	List<QuizQuestion> questions = questionRepo.findBySetIdOrderByOrderIndex(setId);
	Map<Long, QuizQuestion> questionMap = new HashMap<>();
	for (QuizQuestion q : questions) questionMap.put(q.getId(), q);

	// Score the answers
	int correct = 0;
	List<QuizAnswer> answerEntities = new ArrayList<>();

	for (Map<String, Object> ans : answers) {
		Long questionId = ans.get("questionId") instanceof Number n
				? n.longValue() : null;
		String selected = (String) ans.get("selectedOption");
		Long qTimeSecs  = ans.get("timeTakenSecs") instanceof Number n
				? n.longValue() : null;

		if (questionId == null) continue;

		QuizQuestion q = questionMap.get(questionId);
		if (q == null) continue;

		boolean isCorrect = selected != null
				&& selected.equalsIgnoreCase(q.getCorrectOption());
		if (isCorrect) correct++;

		answerEntities.add(QuizAnswer.builder()
				.userId(userId)
				.questionId(questionId)
				.selectedOption(selected)
				.correct(isCorrect)
				.timeTakenSecs(qTimeSecs)
				.build());
	}

	// Save attempt
	QuizAttempt attempt = QuizAttempt.builder()
			.userId(userId)
			.setId(setId)
			.score(correct)
			.totalQuestions(questions.size())
			.timeTakenSecs(timeTakenSecs)
			.build();
	attempt = attemptRepo.save(attempt);

	// Link answers to attempt and save
	final Long attemptId = attempt.getId();
	answerEntities.forEach(a -> a.setAttemptId(attemptId));
	answerRepo.saveAll(answerEntities);

	// Build result with explanations for review
	int totalQ   = questions.size();
	double pct   = totalQ > 0 ? Math.round((double) correct / totalQ * 100.0) : 0;

	List<Map<String, Object>> review = buildReview(answerEntities, questionMap);

	// Personal best check
	int attemptCount = attemptRepo.countByUserIdAndSetId(userId, setId);
	boolean isPersonalBest = attemptCount == 1; // first attempt always PB
	if (!isPersonalBest) {
		int prevBest = attemptRepo
				.findByUserIdAndSetIdOrderByScoreDesc(userId, setId)
				.stream().mapToInt(QuizAttempt::getScore)
				.findFirst().orElse(0);
		isPersonalBest = correct >= prevBest;
	}

	Map<String, Object> result = new LinkedHashMap<>();
	result.put("attemptId",      attemptId);
	result.put("score",          correct);
	result.put("totalQuestions", totalQ);
	result.put("percentage",     pct);
	result.put("timeTakenSecs",  timeTakenSecs);
	result.put("isPersonalBest", isPersonalBest);
	result.put("attemptNumber",  attemptCount);
	result.put("review",         review);
	result.put("setTitle",       set.getTitle());
	return result;
}

// ── Get user's quiz history ───────────────────────────────────────────────
public List<Map<String, Object>> getHistory(Long userId) {
	return attemptRepo.findByUserIdOrderByCompletedAtDesc(userId)
			.stream().map(a -> {
				Map<String, Object> m = new LinkedHashMap<>();
				m.put("attemptId",      a.getId());
				m.put("setId",          a.getSetId());
				m.put("score",          a.getScore());
				m.put("totalQuestions", a.getTotalQuestions());
				m.put("percentage",
						a.getTotalQuestions() > 0
								? Math.round((double) a.getScore() / a.getTotalQuestions() * 100.0)
								: 0);
				m.put("timeTakenSecs",  a.getTimeTakenSecs());
				m.put("completedAt",    a.getCompletedAt() != null
						? a.getCompletedAt().toString() : null);
				// Enrich with set title
				setRepo.findById(a.getSetId()).ifPresent(s -> {
					m.put("setTitle",    s.getTitle());
					m.put("setCategory", s.getCategory());
					m.put("setIcon",     s.getIcon());
				});
				return m;
			}).toList();
}

// ── Seed a quiz set (admin) ───────────────────────────────────────────────
@Transactional
public Map<String, Object> seedSet(Map<String, Object> payload) {
	String title = (String) payload.get("title");
	if (title == null || title.isBlank())
		throw new IllegalArgumentException("title is required");

	// Idempotent: if set already exists, skip
	if (setRepo.existsByTitle(title)) {
		return Map.of("skipped", true, "reason", "Set already exists: " + title);
	}

	QuizSet set = QuizSet.builder()
			.title(title)
			.description((String) payload.getOrDefault("description", ""))
			.category(((String) payload.getOrDefault("category", "JAVA")).toUpperCase())
			.difficulty(((String) payload.getOrDefault("difficulty", "INTERMEDIATE")).toUpperCase())
			.icon((String) payload.getOrDefault("icon", "📝"))
			.displayOrder(payload.get("displayOrder") instanceof Number n ? n.intValue() : 0)
			.timeLimitSecs(payload.get("timeLimitSecs") instanceof Number n ? n.intValue() : 0)
			.build();
	set = setRepo.save(set);
	final Long setId = set.getId();

	@SuppressWarnings("unchecked")
	List<Map<String, Object>> rawQuestions =
			(List<Map<String, Object>>) payload.getOrDefault("questions", List.of());

	int order = 0;
	for (Map<String, Object> q : rawQuestions) {
		QuizQuestion question = QuizQuestion.builder()
				.setId(setId)
				.orderIndex(order++)
				.questionText((String) q.get("questionText"))
				.optionA((String) q.get("optionA"))
				.optionB((String) q.get("optionB"))
				.optionC((String) q.getOrDefault("optionC", null))
				.optionD((String) q.getOrDefault("optionD", null))
				.correctOption(((String) q.get("correctOption")).toUpperCase())
				.explanation((String) q.getOrDefault("explanation", ""))
				.codeSnippet((String) q.getOrDefault("codeSnippet", null))
				.difficulty(((String) q.getOrDefault("difficulty", "MEDIUM")).toUpperCase())
				.tags((String) q.getOrDefault("tags", null))
				.build();
		questionRepo.save(question);
	}

	// Update denormalized count
	set.setQuestionCount(rawQuestions.size());
	setRepo.save(set);

	log.info("Quiz set seeded: '{}' with {} questions", title, rawQuestions.size());
	return Map.of("created", true, "setId", setId,
			"title", title, "questionCount", rawQuestions.size());
}

// ── DTOs ─────────────────────────────────────────────────────────────────
private Map<String, Object> setToDto(QuizSet s) {
	Map<String, Object> m = new LinkedHashMap<>();
	m.put("id",            s.getId());
	m.put("title",         s.getTitle());
	m.put("description",   s.getDescription());
	m.put("category",      s.getCategory());
	m.put("difficulty",    s.getDifficulty());
	m.put("icon",          s.getIcon());
	m.put("questionCount", s.getQuestionCount());
	m.put("timeLimitSecs", s.getTimeLimitSecs());
	m.put("displayOrder",  s.getDisplayOrder());
	return m;
}

/** Question DTO for play — does NOT include correctOption */
private Map<String, Object> questionToPlayDto(QuizQuestion q) {
	Map<String, Object> m = new LinkedHashMap<>();
	m.put("id",           q.getId());
	m.put("orderIndex",   q.getOrderIndex());
	m.put("questionText", q.getQuestionText());
	m.put("optionA",      q.getOptionA());
	m.put("optionB",      q.getOptionB());
	m.put("optionC",      q.getOptionC());
	m.put("optionD",      q.getOptionD());
	m.put("codeSnippet",  q.getCodeSnippet());
	m.put("difficulty",   q.getDifficulty());
	// correctOption deliberately omitted — sent only in results
	return m;
}

/** Build review with correct answers + explanations */
private List<Map<String, Object>> buildReview(
		List<QuizAnswer> answers, Map<Long, QuizQuestion> questionMap) {
	return answers.stream().map(a -> {
		QuizQuestion q = questionMap.get(a.getQuestionId());
		Map<String, Object> m = new LinkedHashMap<>();
		m.put("questionId",      a.getQuestionId());
		m.put("questionText",    q != null ? q.getQuestionText() : "");
		m.put("optionA",         q != null ? q.getOptionA() : "");
		m.put("optionB",         q != null ? q.getOptionB() : "");
		m.put("optionC",         q != null ? q.getOptionC() : null);
		m.put("optionD",         q != null ? q.getOptionD() : null);
		m.put("codeSnippet",     q != null ? q.getCodeSnippet() : null);
		m.put("selectedOption",  a.getSelectedOption());
		m.put("correctOption",   q != null ? q.getCorrectOption() : "");
		m.put("correct",         a.isCorrect());
		m.put("explanation",     q != null ? q.getExplanation() : "");
		m.put("timeTakenSecs",   a.getTimeTakenSecs());
		return m;
	}).toList();
}
}