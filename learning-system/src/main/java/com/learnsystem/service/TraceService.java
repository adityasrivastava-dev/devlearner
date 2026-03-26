package com.learnsystem.service;

import com.learnsystem.dto.TraceRequest;
import com.learnsystem.model.TraceStep;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TraceService {

    public List<TraceStep> generateTrace(TraceRequest req) {
        return switch (req.getAlgorithm().toUpperCase()) {
            case "BINARY_SEARCH"  -> binarySearchTrace(req);
            case "SLIDING_WINDOW" -> slidingWindowTrace(req);
            case "TWO_POINTER"    -> twoPointerTrace(req);
            default -> throw new IllegalArgumentException("No trace for: " + req.getAlgorithm());
        };
    }

    // ── BINARY SEARCH ─────────────────────────────────────────────────────────

    private static final List<String> BS_CODE = List.of(
        "int binarySearch(int[] arr, int target) {",
        "    int low = 0;",
        "    int high = arr.length - 1;",
        "    while (low <= high) {",
        "        int mid = low + (high - low) / 2;",
        "        if (arr[mid] == target) {",
        "            return mid;",
        "        } else if (arr[mid] < target) {",
        "            low = mid + 1;",
        "        } else {",
        "            high = mid - 1;",
        "        }",
        "    }",
        "    return -1;",
        "}"
    );

    private List<TraceStep> binarySearchTrace(TraceRequest req) {
        int[] arr = resolveArray(req);
        Arrays.sort(arr);
        int target = req.getTarget() != null ? req.getTarget() : arr[arr.length / 2];

        String arrStr = arrToString(arr);
        List<TraceStep> steps = new ArrayList<>();
        LinkedHashMap<String, String> vars = new LinkedHashMap<>();
        int sn = 1;

        // line 1: int low = 0
        vars = copy(vars);
        vars.put("low", "0");
        steps.add(step(sn++, 1, "INIT",
            "Initialize low = 0 (start of array)",
            vars, Set.of("low"), BS_CODE));

        // line 2: int high = arr.length - 1
        vars = copy(vars);
        vars.put("high", String.valueOf(arr.length - 1));
        vars.put("target", String.valueOf(target));
        vars.put("arr", arrStr);
        steps.add(step(sn++, 2, "INIT",
            "Initialize high = " + (arr.length - 1) + " (last index), target = " + target,
            vars, Set.of("high", "target", "arr"), BS_CODE));

        int low = 0, high = arr.length - 1;

        while (low <= high) {
            // line 3: while condition
            vars = copy(vars);
            steps.add(step(sn++, 3, "LOOP_CHECK",
                "Check while condition: low(" + low + ") <= high(" + high + ") → " + (low <= high),
                vars, Set.of(), BS_CODE));

            // line 4: compute mid
            int mid = low + (high - low) / 2;
            vars = copy(vars);
            vars.put("mid", String.valueOf(mid));
            steps.add(step(sn++, 4, "COMPUTE",
                "mid = " + low + " + (" + high + " - " + low + ") / 2 = " + mid
                + "  →  arr[" + mid + "] = " + arr[mid],
                vars, Set.of("mid"), BS_CODE));

            // line 5: compare arr[mid] == target
            vars = copy(vars);
            steps.add(step(sn++, 5, "COMPARE",
                "arr[" + mid + "] = " + arr[mid] + "  ==  target(" + target + ") ?  → "
                + (arr[mid] == target),
                vars, Set.of(), BS_CODE));

            if (arr[mid] == target) {
                // line 6: return mid
                vars = copy(vars);
                vars.put("result", String.valueOf(mid));
                steps.add(step(sn++, 6, "FOUND",
                    "✅  FOUND!  arr[" + mid + "] = " + target + "  →  return index " + mid,
                    vars, Set.of("result"), BS_CODE));
                return steps;
            }

            // line 7: else if arr[mid] < target
            vars = copy(vars);
            steps.add(step(sn++, 7, "COMPARE",
                "arr[" + mid + "] = " + arr[mid] + "  <  target(" + target + ") ?  → "
                + (arr[mid] < target),
                vars, Set.of(), BS_CODE));

            if (arr[mid] < target) {
                // line 8: low = mid + 1
                vars = copy(vars);
                vars.put("low", String.valueOf(mid + 1));
                low = mid + 1;
                steps.add(step(sn++, 8, "GO_RIGHT",
                    "Target is in RIGHT half  →  low = " + mid + " + 1 = " + low
                    + "  (discard left half)",
                    vars, Set.of("low"), BS_CODE));
            } else {
                // line 10: high = mid - 1
                vars = copy(vars);
                vars.put("high", String.valueOf(mid - 1));
                high = mid - 1;
                steps.add(step(sn++, 10, "GO_LEFT",
                    "Target is in LEFT half  →  high = " + mid + " - 1 = " + high
                    + "  (discard right half)",
                    vars, Set.of("high"), BS_CODE));
            }
        }

        // line 13: return -1
        vars = copy(vars);
        vars.put("result", "-1");
        steps.add(step(sn, 13, "NOT_FOUND",
            "❌  low(" + low + ") > high(" + high + ")  →  target not found, return -1",
            vars, Set.of("result"), BS_CODE));

        return steps;
    }

    // ── SLIDING WINDOW (max sum of k elements) ────────────────────────────────

    private static final List<String> SW_CODE = List.of(
        "int maxSumSubarray(int[] arr, int k) {",
        "    int windowSum = 0;",
        "    for (int i = 0; i < k; i++)",
        "        windowSum += arr[i];",
        "    int maxSum = windowSum;",
        "    for (int i = k; i < arr.length; i++) {",
        "        windowSum += arr[i];",
        "        windowSum -= arr[i - k];",
        "        if (windowSum > maxSum)",
        "            maxSum = windowSum;",
        "    }",
        "    return maxSum;",
        "}"
    );

    private List<TraceStep> slidingWindowTrace(TraceRequest req) {
        int[] arr = resolveArray(req);
        int k = (req.getTarget() != null && req.getTarget() > 0) ? req.getTarget() : 3;
        if (k >= arr.length) k = 2;

        List<TraceStep> steps = new ArrayList<>();
        LinkedHashMap<String, String> vars = new LinkedHashMap<>();
        int sn = 1;

        vars = copy(vars);
        vars.put("arr", arrToString(arr));
        vars.put("k", String.valueOf(k));
        vars.put("windowSum", "0");
        steps.add(step(sn++, 1, "INIT", "Initialize windowSum = 0", vars, Set.of("windowSum", "arr", "k"), SW_CODE));

        // Build initial window
        int windowSum = 0;
        for (int i = 0; i < k; i++) {
            windowSum += arr[i];
            vars = copy(vars);
            vars.put("i", String.valueOf(i));
            vars.put("windowSum", String.valueOf(windowSum));
            steps.add(step(sn++, 3, "COMPUTE",
                "Add arr[" + i + "]=" + arr[i] + " to window  →  windowSum = " + windowSum,
                vars, Set.of("windowSum", "i"), SW_CODE));
        }

        int maxSum = windowSum;
        vars = copy(vars);
        vars.put("maxSum", String.valueOf(maxSum));
        steps.add(step(sn++, 4, "INIT",
            "Initial window [0.." + (k-1) + "] sum = " + windowSum + "  →  maxSum = " + maxSum,
            vars, Set.of("maxSum"), SW_CODE));

        // Slide window
        for (int i = k; i < arr.length; i++) {
            windowSum += arr[i];
            windowSum -= arr[i - k];

            vars = copy(vars);
            vars.put("i", String.valueOf(i));
            vars.put("windowSum", String.valueOf(windowSum));
            steps.add(step(sn++, 6, "COMPUTE",
                "Slide: add arr[" + i + "]=" + arr[i]
                + ", remove arr[" + (i-k) + "]=" + arr[i-k]
                + "  →  windowSum = " + windowSum,
                vars, Set.of("windowSum", "i"), SW_CODE));

            if (windowSum > maxSum) {
                maxSum = windowSum;
                vars = copy(vars);
                vars.put("maxSum", String.valueOf(maxSum));
                steps.add(step(sn++, 9, "FOUND",
                    "New max found!  windowSum(" + windowSum + ") > maxSum  →  maxSum = " + maxSum,
                    vars, Set.of("maxSum"), SW_CODE));
            } else {
                vars = copy(vars);
                steps.add(step(sn++, 8, "COMPARE",
                    "windowSum(" + windowSum + ") ≤ maxSum(" + maxSum + ")  →  no update",
                    vars, Set.of(), SW_CODE));
            }
        }

        vars = copy(vars);
        vars.put("result", String.valueOf(maxSum));
        steps.add(step(sn, 11, "NOT_FOUND",
            "✅  Done!  Maximum subarray sum of size " + k + " = " + maxSum,
            vars, Set.of("result"), SW_CODE));

        return steps;
    }

    // ── TWO POINTER (pair that sums to target) ────────────────────────────────

    private static final List<String> TP_CODE = List.of(
        "int[] twoSum(int[] arr, int target) {",
        "    int left = 0;",
        "    int right = arr.length - 1;",
        "    while (left < right) {",
        "        int sum = arr[left] + arr[right];",
        "        if (sum == target) {",
        "            return new int[]{left, right};",
        "        } else if (sum < target) {",
        "            left++;",
        "        } else {",
        "            right--;",
        "        }",
        "    }",
        "    return new int[]{-1, -1};",
        "}"
    );

    private List<TraceStep> twoPointerTrace(TraceRequest req) {
        int[] arr = resolveArray(req);
        Arrays.sort(arr);
        int target = req.getTarget() != null ? req.getTarget() : arr[0] + arr[arr.length - 1];

        List<TraceStep> steps = new ArrayList<>();
        LinkedHashMap<String, String> vars = new LinkedHashMap<>();
        int sn = 1;

        vars = copy(vars);
        vars.put("arr", arrToString(arr));
        vars.put("target", String.valueOf(target));
        vars.put("left", "0");
        steps.add(step(sn++, 1, "INIT", "Initialize left = 0", vars, Set.of("left", "arr", "target"), TP_CODE));

        vars = copy(vars);
        vars.put("right", String.valueOf(arr.length - 1));
        steps.add(step(sn++, 2, "INIT",
            "Initialize right = " + (arr.length - 1) + " (last index)", vars, Set.of("right"), TP_CODE));

        int left = 0, right = arr.length - 1;

        while (left < right) {
            vars = copy(vars);
            steps.add(step(sn++, 3, "LOOP_CHECK",
                "Check: left(" + left + ") < right(" + right + ") → " + (left < right),
                vars, Set.of(), TP_CODE));

            int sum = arr[left] + arr[right];
            vars = copy(vars);
            vars.put("sum", String.valueOf(sum));
            steps.add(step(sn++, 4, "COMPUTE",
                "sum = arr[" + left + "](" + arr[left] + ") + arr[" + right + "](" + arr[right] + ") = " + sum,
                vars, Set.of("sum"), TP_CODE));

            vars = copy(vars);
            steps.add(step(sn++, 5, "COMPARE",
                "sum(" + sum + ") == target(" + target + ") ? → " + (sum == target),
                vars, Set.of(), TP_CODE));

            if (sum == target) {
                vars = copy(vars);
                vars.put("result", "[" + left + ", " + right + "]");
                steps.add(step(sn++, 6, "FOUND",
                    "✅  FOUND!  indices [" + left + ", " + right + "]  →  values ["
                    + arr[left] + " + " + arr[right] + " = " + target + "]",
                    vars, Set.of("result"), TP_CODE));
                return steps;
            }

            if (sum < target) {
                vars = copy(vars);
                vars.put("left", String.valueOf(left + 1));
                left++;
                steps.add(step(sn++, 8, "GO_RIGHT",
                    "sum too small  →  move left pointer right: left = " + left,
                    vars, Set.of("left"), TP_CODE));
            } else {
                vars = copy(vars);
                vars.put("right", String.valueOf(right - 1));
                right--;
                steps.add(step(sn++, 10, "GO_LEFT",
                    "sum too large  →  move right pointer left: right = " + right,
                    vars, Set.of("right"), TP_CODE));
            }
        }

        vars = copy(vars);
        vars.put("result", "[-1, -1]");
        steps.add(step(sn, 13, "NOT_FOUND",
            "❌  No pair found with sum = " + target, vars, Set.of("result"), TP_CODE));

        return steps;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private int[] resolveArray(TraceRequest req) {
        if (req.getArray() != null && !req.getArray().isEmpty()) {
            return req.getArray().stream().mapToInt(Integer::intValue).toArray();
        }
        int size = req.getSize() != null ? Math.min(req.getSize(), 12) : 8;
        Random rnd = new Random(42); // deterministic seed for consistency
        int[] arr = new int[size];
        for (int i = 0; i < size; i++) arr[i] = rnd.nextInt(30) + 1;
        return arr;
    }

    private String arrToString(int[] arr) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.length; i++) {
            sb.append(arr[i]);
            if (i < arr.length - 1) sb.append(", ");
        }
        return sb.append("]").toString();
    }

    private LinkedHashMap<String, String> copy(LinkedHashMap<String, String> src) {
        return new LinkedHashMap<>(src);
    }

    private TraceStep step(int num, int line, String phase, String desc,
                           LinkedHashMap<String, String> vars, Set<String> changed) {
        // codeLines set at call site via overload below
        return step(num, line, phase, desc, vars, changed, BS_CODE);
    }

    private TraceStep step(int num, int line, String phase, String desc,
                           LinkedHashMap<String, String> vars, Set<String> changed,
                           List<String> codeLines) {
        return TraceStep.builder()
                .stepNumber(num)
                .highlightLine(line)
                .phase(phase)
                .description(desc)
                .variables(vars)
                .changedVars(changed)
                .codeLines(codeLines)
                .build();
    }
}
