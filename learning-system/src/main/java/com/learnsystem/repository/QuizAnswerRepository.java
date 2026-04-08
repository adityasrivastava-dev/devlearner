package com.learnsystem.repository;

import com.learnsystem.model.QuizAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, Long> {

/** All answers for one attempt — used for result review */
List<QuizAnswer> findByAttemptIdOrderById(Long attemptId);

/** Wrong answers for a user across all quizzes — for weak spot detection */
List<QuizAnswer> findByUserIdAndCorrectFalseOrderByIdDesc(Long userId);
}