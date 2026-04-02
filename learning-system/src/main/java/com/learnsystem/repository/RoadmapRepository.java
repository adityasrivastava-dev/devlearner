package com.learnsystem.repository;

import com.learnsystem.model.Roadmap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoadmapRepository extends JpaRepository<Roadmap, Long> {

/** All roadmaps for a specific user, newest first */
List<Roadmap> findByUserIdOrderByCreatedAtDesc(Long userId);

/** Backwards-compat: all roadmaps (admin use only) */
List<Roadmap> findAllByOrderByCreatedAtDesc();
}