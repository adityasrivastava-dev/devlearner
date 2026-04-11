package com.learnsystem.repository;

import com.learnsystem.model.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic>     findByCategory(Topic.Category category);
    Optional<Topic> findByTitle(String title);

    List<Topic> findAllByOrderByDisplayOrderAscTitleAsc();
    List<Topic> findByCategoryOrderByDisplayOrderAscTitleAsc(Topic.Category category);

@Modifying
@Query("DELETE FROM Topic")
void deleteAllTopics();
}