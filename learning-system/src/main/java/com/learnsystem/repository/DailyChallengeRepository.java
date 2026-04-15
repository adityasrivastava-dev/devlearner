package com.learnsystem.repository;

import com.learnsystem.model.DailyChallenge;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyChallengeRepository extends JpaRepository<DailyChallenge, Long> {

    Optional<DailyChallenge> findByChallengeDate(LocalDate date);

    @Query("SELECT dc FROM DailyChallenge dc JOIN FETCH dc.problem WHERE dc.challengeDate = :date")
    Optional<DailyChallenge> findWithProblemByChallengeDate(@Param("date") LocalDate date);

    @Query("SELECT dc FROM DailyChallenge dc JOIN FETCH dc.problem ORDER BY dc.challengeDate DESC")
    List<DailyChallenge> findRecentWithProblems(Pageable pageable);

    boolean existsByChallengeDate(LocalDate date);
}
