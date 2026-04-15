package com.learnsystem.repository;

import com.learnsystem.model.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface TimetableRepository extends JpaRepository<Timetable, Long> {

    List<Timetable> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Timetable> findByIdAndUserId(Long id, Long userId);

    @Modifying
    @Transactional
    void deleteByIdAndUserId(Long id, Long userId);
}
