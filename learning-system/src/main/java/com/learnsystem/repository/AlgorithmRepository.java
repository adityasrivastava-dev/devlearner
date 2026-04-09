package com.learnsystem.repository;

import com.learnsystem.model.Algorithm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlgorithmRepository extends JpaRepository<Algorithm, Long> {

Optional<Algorithm> findBySlug(String slug);

List<Algorithm> findByCategoryOrderByDisplayOrderAscNameAsc(String category);

List<Algorithm> findAllByOrderByDisplayOrderAscNameAsc();

boolean existsBySlug(String slug);

@Modifying
@Query("DELETE FROM Algorithm")
void deleteAllAlgorithms();
}