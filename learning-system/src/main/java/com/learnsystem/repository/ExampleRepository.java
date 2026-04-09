package com.learnsystem.repository;

import com.learnsystem.model.Example;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExampleRepository extends JpaRepository<Example, Long> {

List<Example> findByTopicIdOrderByDisplayOrder(Long topicId);

long countByTopicId(Long topicId);
}