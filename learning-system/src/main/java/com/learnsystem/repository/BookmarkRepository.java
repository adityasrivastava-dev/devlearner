package com.learnsystem.repository;

import com.learnsystem.model.Bookmark;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
List<Bookmark> findByUserIdOrderByCreatedAtDesc(Long userId);
List<Bookmark> findByUserIdAndItemType(Long userId, String itemType);
Optional<Bookmark> findByUserIdAndItemTypeAndItemId(Long userId, String itemType, Long itemId);
boolean existsByUserIdAndItemTypeAndItemId(Long userId, String itemType, Long itemId);
void deleteByUserIdAndItemTypeAndItemId(Long userId, String itemType, Long itemId);

/** Capped fetch — prevents unbounded payload for power users */
@Query("SELECT b FROM Bookmark b WHERE b.userId = :userId ORDER BY b.createdAt DESC")
List<Bookmark> findRecentByUserId(@Param("userId") Long userId, Pageable pageable);
}