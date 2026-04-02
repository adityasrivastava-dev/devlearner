package com.learnsystem.repository;

import com.learnsystem.model.SpacedRepetitionEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpacedRepetitionRepository extends JpaRepository<SpacedRepetitionEntry, Long> {

Optional<SpacedRepetitionEntry> findByUserIdAndItemTypeAndItemId(
		Long userId, String itemType, Long itemId);

/** Items due for review today or overdue */
@Query("SELECT e FROM SpacedRepetitionEntry e WHERE e.userId = :uid AND e.nextReviewDate <= :today ORDER BY e.nextReviewDate ASC")
List<SpacedRepetitionEntry> findDueItems(@Param("uid") Long userId, @Param("today") LocalDate today);

/** All items for a user — for the full SRS queue dashboard */
List<SpacedRepetitionEntry> findByUserIdOrderByNextReviewDateAsc(Long userId);

/** Count due items */
@Query("SELECT COUNT(e) FROM SpacedRepetitionEntry e WHERE e.userId = :uid AND e.nextReviewDate <= :today")
long countDueItems(@Param("uid") Long userId, @Param("today") LocalDate today);
}