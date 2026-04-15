package com.learnsystem.repository;

import com.learnsystem.model.SystemDesignCanvas;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemDesignCanvasRepository extends JpaRepository<SystemDesignCanvas, Long> {

    List<SystemDesignCanvas> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<SystemDesignCanvas> findByIdAndUserId(Long id, Long userId);

    void deleteByIdAndUserId(Long id, Long userId);
}
