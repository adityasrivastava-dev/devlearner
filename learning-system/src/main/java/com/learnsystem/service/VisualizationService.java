package com.learnsystem.service;

import com.learnsystem.dto.VisualizationRequest;
import com.learnsystem.model.VisualizationStep;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

@Service
public class VisualizationService {

    public List<VisualizationStep> generateSteps(VisualizationRequest request) {
        return switch (request.getAlgorithm().toUpperCase()) {
            case "BINARY_SEARCH" -> binarySearchSteps(request);
            default -> throw new IllegalArgumentException("Unknown algorithm: " + request.getAlgorithm());
        };
    }

    // ── Binary Search ─────────────────────────────────────────────────────────

    private List<VisualizationStep> binarySearchSteps(VisualizationRequest request) {
        List<Integer> array = resolveArray(request);
        Collections.sort(array);

        int target = request.getTarget() != null
                ? request.getTarget()
                : array.get(new Random().nextInt(array.size())); // pick a random existing element

        List<VisualizationStep> steps = new ArrayList<>();
        int stepNum = 1;

        int low  = 0;
        int high = array.size() - 1;

        // INIT step
        steps.add(buildStep(stepNum++, "INIT", array, low, high, -1, target, false, null,
                "Start: searching for " + target + " in array of size " + array.size()));

        while (low <= high) {
            int mid = low + (high - low) / 2;

            steps.add(buildStep(stepNum++, "CHECK_MID", array, low, high, mid, target, false, null,
                    "Check middle index " + mid + " → value = " + array.get(mid)));

            if (array.get(mid) == target) {
                steps.add(buildStep(stepNum++, "FOUND", array, low, high, mid, target, true, mid,
                        "✅ Found " + target + " at index " + mid));
                return steps;
            } else if (array.get(mid) < target) {
                steps.add(buildStep(stepNum++, "GO_RIGHT", array, low, high, mid, target, false, null,
                        array.get(mid) + " < " + target + " → move low to " + (mid + 1)));
                low = mid + 1;
            } else {
                steps.add(buildStep(stepNum++, "GO_LEFT", array, low, high, mid, target, false, null,
                        array.get(mid) + " > " + target + " → move high to " + (mid - 1)));
                high = mid - 1;
            }
        }

        steps.add(buildStep(stepNum, "NOT_FOUND", array, low, high, -1, target, false, null,
                "❌ " + target + " not found in array"));
        return steps;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private List<Integer> resolveArray(VisualizationRequest request) {
        if (request.getArray() != null && !request.getArray().isEmpty()) {
            return new ArrayList<>(request.getArray());
        }
        int size = request.getSize() != null ? request.getSize() : 10;
        List<Integer> arr = new ArrayList<>();
        Random rnd = new Random();
        for (int i = 0; i < size; i++) {
            arr.add(rnd.nextInt(100));
        }
        return arr;
    }

    private VisualizationStep buildStep(int stepNum, String action, List<Integer> array,
                                        int low, int high, int mid, int target,
                                        boolean found, Integer foundIndex, String description) {
        VisualizationStep step = new VisualizationStep();
        step.setStepNumber(stepNum);
        step.setAction(action);
        step.setArray(new ArrayList<>(array));
        step.setLow(low);
        step.setHigh(high);
        step.setMid(mid);
        step.setTarget(target);
        step.setFound(found);
        step.setFoundIndex(foundIndex);
        step.setDescription(description);

        List<Integer> highlights = new ArrayList<>();
        if (mid >= 0) highlights.add(mid);
        step.setHighlightIndices(highlights);

        return step;
    }
}
