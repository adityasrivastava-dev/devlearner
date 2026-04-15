package com.learnsystem.repository;

import com.learnsystem.model.AppScreenshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface AppScreenshotRepository extends JpaRepository<AppScreenshot, Long> {

    Optional<AppScreenshot> findBySlideKey(String slideKey);

    List<AppScreenshot> findAll();

    @Modifying
    @Transactional
    void deleteBySlideKey(String slideKey);
}
