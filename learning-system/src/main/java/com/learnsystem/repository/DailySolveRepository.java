package com.learnsystem.repository;

import com.learnsystem.model.DailySolve;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailySolveRepository extends JpaRepository<DailySolve, Long> {

    Optional<DailySolve> findByUserIdAndChallengeDate(Long userId, LocalDate date);

    boolean existsByUserIdAndChallengeDate(Long userId, LocalDate date);

    /** Leaderboard: fastest solvers first, then earliest solve time as tiebreaker */
    @Query("SELECT ds FROM DailySolve ds WHERE ds.challengeDate = :date " +
           "ORDER BY ds.timeToSolveMs ASC, ds.solvedAt ASC")
    List<DailySolve> findLeaderboardForDate(@Param("date") LocalDate date, Pageable pageable);

    long countByChallengeDate(LocalDate date);

    /** How many days has a user participated total */
    long countByUserId(Long userId);
}
