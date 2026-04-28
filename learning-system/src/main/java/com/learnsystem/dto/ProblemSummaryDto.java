package com.learnsystem.dto;

import com.learnsystem.model.Problem;
import com.learnsystem.model.Topic;

/**
 * Lightweight problem summary returned by GET /api/problems.
 * Never includes solution code or test cases — only what the listing page needs.
 */
public record ProblemSummaryDto(
        Long   id,
        String title,
        String difficulty,
        String pattern,
        Long   topicId,
        String topicTitle,
        String category,
        Integer displayOrder,
        String companies
) {
    /** Convenience factory — builds from a fully-loaded Problem entity. */
    public static ProblemSummaryDto from(Problem p) {
        Topic t = p.getTopic();
        return new ProblemSummaryDto(
                p.getId(),
                p.getTitle(),
                p.getDifficulty() != null ? p.getDifficulty().name() : null,
                p.getPattern(),
                t != null ? t.getId()    : null,
                t != null ? t.getTitle() : null,
                t != null && t.getCategory() != null ? t.getCategory().name() : null,
                p.getDisplayOrder(),
                p.getCompanies()
        );
    }
}
