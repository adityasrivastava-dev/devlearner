package com.learnsystem.repository;

import com.learnsystem.model.PageView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PageViewRepository extends JpaRepository<PageView, Long> {

    /** Count visits per page path, most-visited first */
    @Query("SELECT pv.pagePath, COUNT(pv) FROM PageView pv GROUP BY pv.pagePath ORDER BY COUNT(pv) DESC")
    List<Object[]> countByPagePath();

    /** Count visits per page in a date range */
    @Query("SELECT pv.pagePath, COUNT(pv) FROM PageView pv WHERE pv.viewedAt >= :from GROUP BY pv.pagePath ORDER BY COUNT(pv) DESC")
    List<Object[]> countByPagePathSince(LocalDateTime from);

    /** Daily unique users per page in last N days */
    @Query("SELECT pv.pagePath, COUNT(DISTINCT pv.userId) FROM PageView pv WHERE pv.viewedAt >= :from GROUP BY pv.pagePath ORDER BY COUNT(DISTINCT pv.userId) DESC")
    List<Object[]> uniqueUsersByPageSince(LocalDateTime from);

    /** Total visits per day */
    @Query("SELECT DATE(pv.viewedAt), COUNT(pv) FROM PageView pv WHERE pv.viewedAt >= :from GROUP BY DATE(pv.viewedAt) ORDER BY DATE(pv.viewedAt)")
    List<Object[]> dailyVisitsSince(LocalDateTime from);

    /** Recent page views (for activity feed) */
    List<PageView> findTop50ByOrderByViewedAtDesc();
}
