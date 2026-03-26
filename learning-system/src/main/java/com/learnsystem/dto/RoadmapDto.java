package com.learnsystem.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/** Full roadmap with its ordered topic list — returned by GET endpoints */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoadmapDto {

    private Long   id;
    private String name;
    private String description;
    private String icon;
    private String color;
    private String level;
    private Integer estimatedHours;
    private LocalDateTime createdAt;
    private int    totalTopics;
    private List<RoadmapTopicDto> topics;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoadmapTopicDto {
        private Long   roadmapTopicId;
        private Long   topicId;
        private String topicTitle;
        private String topicCategory;
        private String topicDescription;
        private String timeComplexity;
        private Integer orderIndex;
        private String note;
    }
}