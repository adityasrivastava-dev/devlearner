package com.learnsystem.repository;

import com.learnsystem.model.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {

    List<Topic> findByCategory(Topic.Category category);

    List<Topic> findByTitleContainingIgnoreCase(String keyword);
}
