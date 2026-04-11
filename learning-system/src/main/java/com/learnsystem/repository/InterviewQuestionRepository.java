package com.learnsystem.repository;

import com.learnsystem.model.InterviewQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {

    List<InterviewQuestion> findAllByOrderByDisplayOrderAscCreatedAtAsc();

    List<InterviewQuestion> findByCategoryOrderByDisplayOrderAscCreatedAtAsc(String category);

    List<InterviewQuestion> findByCategoryAndDifficultyOrderByDisplayOrderAscCreatedAtAsc(String category, String difficulty);

    List<InterviewQuestion> findByDifficultyOrderByDisplayOrderAscCreatedAtAsc(String difficulty);
}
