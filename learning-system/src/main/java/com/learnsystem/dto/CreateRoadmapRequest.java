package com.learnsystem.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

@Data
public class CreateRoadmapRequest {

    @NotBlank
    private String name;
    private String description;
    private String icon;
    private String color;
    private String level;
    private Integer estimatedHours;

    /** Ordered list of topic IDs to add immediately on creation */
    private List<Long> topicIds;
}