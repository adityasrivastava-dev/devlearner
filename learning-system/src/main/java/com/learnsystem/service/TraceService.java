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
        case "LINEAR_SEARCH"  -> linearSearchTrace(req);
        case "BUBBLE_SORT"    -> bubbleSortTrace(req);
        case "SELECTION_SORT" -> selectionSortTrace(req);
        case "INSERTION_SORT" -> insertionSortTrace(req);
        case "FIBONACCI"      -> fibonacciTrace(req);
        case "FACTORIAL"      -> factorialTrace(req);
        case "PREFIX_SUM"     -> prefixSumTrace(req);
        case "TWO_SUM_HASH"   -> twoSumHashTrace(req);
        case "STACK_OPS"      -> stackOpsTrace(req);
        case "QUEUE_OPS"      -> queueOpsTrace(req);
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


// ── LINEAR SEARCH ─────────────────────────────────────────────────────────

private static final List<String> LS_CODE = List.of(
        "int linearSearch(int[] arr, int target) {",
        "    for (int i = 0; i < arr.length; i++) {",
        "        if (arr[i] == target) {",
        "            return i;",
        "        }",
        "    }",
        "    return -1;",
        "}"
);

private List<TraceStep> linearSearchTrace(TraceRequest req) {
    int[] arr = resolveArray(req);
    int target = req.getTarget() != null ? req.getTarget() : arr[arr.length / 3];
    String arrStr = arrToString(arr);
    List<TraceStep> steps = new ArrayList<>();
    LinkedHashMap<String, String> vars = new LinkedHashMap<>();
    int sn = 1;

    vars.put("arr", arrStr);
    vars.put("target", String.valueOf(target));
    steps.add(step(sn++, 0, "INIT", "Start linear search. target = " + target, vars, Set.of("arr","target"), LS_CODE));

    for (int i = 0; i < arr.length; i++) {
        vars = copy(vars);
        vars.put("i", String.valueOf(i));
        steps.add(step(sn++, 1, "LOOP_CHECK", "Loop: i = " + i + " < " + arr.length, vars, Set.of("i"), LS_CODE));

        vars = copy(vars);
        steps.add(step(sn++, 2, "COMPARE", "arr[" + i + "] = " + arr[i] + " == target(" + target + ") ? → " + (arr[i] == target), vars, Set.of(), LS_CODE));

        if (arr[i] == target) {
            vars = copy(vars);
            vars.put("result", String.valueOf(i));
            steps.add(step(sn++, 3, "FOUND", "✅ FOUND at index " + i, vars, Set.of("result"), LS_CODE));
            return steps;
        }
    }

    vars = copy(vars);
    vars.put("result", "-1");
    steps.add(step(sn, 6, "NOT_FOUND", "❌ Target " + target + " not found after checking all " + arr.length + " elements", vars, Set.of("result"), LS_CODE));
    return steps;
}

// ── BUBBLE SORT ────────────────────────────────────────────────────────────

private static final List<String> BUBBLE_CODE = List.of(
        "void bubbleSort(int[] arr) {",
        "    int n = arr.length;",
        "    for (int i = 0; i < n - 1; i++) {",
        "        boolean swapped = false;",
        "        for (int j = 0; j < n - i - 1; j++) {",
        "            if (arr[j] > arr[j + 1]) {",
        "                swap(arr, j, j + 1);",
        "                swapped = true;",
        "            }",
        "        }",
        "        if (!swapped) break;",
        "    }",
        "}"
);

private List<TraceStep> bubbleSortTrace(TraceRequest req) {
    int[] arr = resolveArray(req);
    if (arr.length > 6) arr = Arrays.copyOf(arr, 6);
    List<TraceStep> steps = new ArrayList<>();
    LinkedHashMap<String, String> vars = new LinkedHashMap<>();
    int sn = 1;

    vars.put("arr", arrToString(arr));
    vars.put("n", String.valueOf(arr.length));
    steps.add(step(sn++, 0, "INIT", "Start bubble sort. n = " + arr.length, vars, Set.of("arr","n"), BUBBLE_CODE));

    for (int i = 0; i < arr.length - 1; i++) {
        vars = copy(vars);
        vars.put("i", String.valueOf(i));
        vars.put("swapped", "false");
        steps.add(step(sn++, 2, "LOOP_CHECK", "Outer pass i = " + i, vars, Set.of("i","swapped"), BUBBLE_CODE));

        boolean swapped = false;
        for (int j = 0; j < arr.length - i - 1; j++) {
            vars = copy(vars);
            vars.put("j", String.valueOf(j));
            steps.add(step(sn++, 4, "COMPARE", "Compare arr[" + j + "]=" + arr[j] + " > arr[" + (j+1) + "]=" + arr[j+1] + " ? → " + (arr[j] > arr[j+1]), vars, Set.of("j"), BUBBLE_CODE));

            if (arr[j] > arr[j + 1]) {
                int tmp = arr[j]; arr[j] = arr[j+1]; arr[j+1] = tmp;
                swapped = true;
                vars = copy(vars);
                vars.put("arr", arrToString(arr));
                vars.put("swapped", "true");
                steps.add(step(sn++, 6, "COMPUTE", "Swapped arr[" + j + "] and arr[" + (j+1) + "] → " + arrToString(arr), vars, Set.of("arr","swapped"), BUBBLE_CODE));
            }
        }
        if (!swapped) {
            steps.add(step(sn++, 10, "FOUND", "No swaps this pass — array is sorted! ✅", vars, Set.of(), BUBBLE_CODE));
            return steps;
        }
    }

    vars = copy(vars);
    vars.put("arr", arrToString(arr));
    vars.put("result", "sorted");
    steps.add(step(sn, 12, "FOUND", "✅ Array fully sorted: " + arrToString(arr), vars, Set.of("arr","result"), BUBBLE_CODE));
    return steps;
}

// ── SELECTION SORT ─────────────────────────────────────────────────────────

private static final List<String> SEL_CODE = List.of(
        "void selectionSort(int[] arr) {",
        "    for (int i = 0; i < arr.length - 1; i++) {",
        "        int minIdx = i;",
        "        for (int j = i + 1; j < arr.length; j++) {",
        "            if (arr[j] < arr[minIdx]) {",
        "                minIdx = j;",
        "            }",
        "        }",
        "        swap(arr, i, minIdx);",
        "    }",
        "}"
);

private List<TraceStep> selectionSortTrace(TraceRequest req) {
    int[] arr = resolveArray(req);
    if (arr.length > 6) arr = Arrays.copyOf(arr, 6);
    List<TraceStep> steps = new ArrayList<>();
    LinkedHashMap<String, String> vars = new LinkedHashMap<>();
    int sn = 1;

    vars.put("arr", arrToString(arr));
    steps.add(step(sn++, 0, "INIT", "Start selection sort on " + arrToString(arr), vars, Set.of("arr"), SEL_CODE));

    for (int i = 0; i < arr.length - 1; i++) {
        vars = copy(vars);
        vars.put("i", String.valueOf(i));
        vars.put("minIdx", String.valueOf(i));
        steps.add(step(sn++, 1, "LOOP_CHECK", "Pass i=" + i + ". minIdx = " + i + " (arr[" + i + "]=" + arr[i] + ")", vars, Set.of("i","minIdx"), SEL_CODE));

        int minIdx = i;
        for (int j = i + 1; j < arr.length; j++) {
            vars = copy(vars);
            vars.put("j", String.valueOf(j));
            steps.add(step(sn++, 4, "COMPARE", "arr[" + j + "]=" + arr[j] + " < arr[minIdx=" + minIdx + "]=" + arr[minIdx] + " ? → " + (arr[j] < arr[minIdx]), vars, Set.of("j"), SEL_CODE));

            if (arr[j] < arr[minIdx]) {
                minIdx = j;
                vars = copy(vars);
                vars.put("minIdx", String.valueOf(minIdx));
                steps.add(step(sn++, 5, "COMPUTE", "New minimum at index " + minIdx + " (value=" + arr[minIdx] + ")", vars, Set.of("minIdx"), SEL_CODE));
            }
        }

        int tmp = arr[i]; arr[i] = arr[minIdx]; arr[minIdx] = tmp;
        vars = copy(vars);
        vars.put("arr", arrToString(arr));
        steps.add(step(sn++, 8, "COMPUTE", "Swap i=" + i + " with minIdx=" + minIdx + " → " + arrToString(arr), vars, Set.of("arr"), SEL_CODE));
    }

    vars.put("result", "sorted");
    steps.add(step(sn, 10, "FOUND", "✅ Sorted: " + arrToString(arr), vars, Set.of("result"), SEL_CODE));
    return steps;
}

// ── INSERTION SORT ─────────────────────────────────────────────────────────

private static final List<String> INS_CODE = List.of(
        "void insertionSort(int[] arr) {",
        "    for (int i = 1; i < arr.length; i++) {",
        "        int key = arr[i];",
        "        int j = i - 1;",
        "        while (j >= 0 && arr[j] > key) {",
        "            arr[j + 1] = arr[j];",
        "            j--;",
        "        }",
        "        arr[j + 1] = key;",
        "    }",
        "}"
);

private List<TraceStep> insertionSortTrace(TraceRequest req) {
    int[] arr = resolveArray(req);
    if (arr.length > 7) arr = Arrays.copyOf(arr, 7);
    List<TraceStep> steps = new ArrayList<>();
    LinkedHashMap<String, String> vars = new LinkedHashMap<>();
    int sn = 1;

    vars.put("arr", arrToString(arr));
    steps.add(step(sn++, 0, "INIT", "Start insertion sort: " + arrToString(arr), vars, Set.of("arr"), INS_CODE));

    for (int i = 1; i < arr.length; i++) {
        int key = arr[i];
        vars = copy(vars);
        vars.put("i", String.valueOf(i));
        vars.put("key", String.valueOf(key));
        steps.add(step(sn++, 2, "COMPUTE", "Pick key = arr[" + i + "] = " + key, vars, Set.of("i","key"), INS_CODE));

        int j = i - 1;
        vars = copy(vars);
        vars.put("j", String.valueOf(j));
        steps.add(step(sn++, 3, "INIT", "j = " + j, vars, Set.of("j"), INS_CODE));

        while (j >= 0 && arr[j] > key) {
            vars = copy(vars);
            steps.add(step(sn++, 4, "COMPARE", "arr[" + j + "]=" + arr[j] + " > key(" + key + ") → shift right", vars, Set.of(), INS_CODE));
            arr[j + 1] = arr[j];
            j--;
            vars = copy(vars);
            vars.put("arr", arrToString(arr));
            vars.put("j", String.valueOf(j));
            steps.add(step(sn++, 5, "COMPUTE", "Shifted → arr now: " + arrToString(arr) + ", j=" + j, vars, Set.of("arr","j"), INS_CODE));
        }

        arr[j + 1] = key;
        vars = copy(vars);
        vars.put("arr", arrToString(arr));
        steps.add(step(sn++, 8, "COMPUTE", "Place key=" + key + " at position " + (j+1) + " → " + arrToString(arr), vars, Set.of("arr"), INS_CODE));
    }

    vars.put("result", "sorted");
    steps.add(step(sn, 10, "FOUND", "✅ Sorted: " + arrToString(arr), vars, Set.of("result"), INS_CODE));
    return steps;
}

// ── FIBONACCI ──────────────────────────────────────────────────────────────

private static final List<String> FIB_CODE = List.of(
        "int fibonacci(int n) {",
        "    if (n <= 1) return n;",
        "    int prev2 = 0, prev1 = 1;",
        "    for (int i = 2; i <= n; i++) {",
        "        int curr = prev1 + prev2;",
        "        prev2 = prev1;",
        "        prev1 = curr;",
        "    }",
        "    return prev1;",
        "}"
);

private List<TraceStep> fibonacciTrace(TraceRequest req) {
    int n = req.getTarget() != null ? Math.min(req.getTarget(), 12) : 8;
    List<TraceStep> steps = new ArrayList<>();
    LinkedHashMap<String, String> vars = new LinkedHashMap<>();
    int sn = 1;

    vars.put("n", String.valueOf(n));
    steps.add(step(sn++, 0, "INIT", "Compute Fibonacci(" + n + ") iteratively", vars, Set.of("n"), FIB_CODE));

    if (n <= 1) {
        vars.put("result", String.valueOf(n));
        steps.add(step(sn, 1, "FOUND", "✅ Base case: fib(" + n + ") = " + n, vars, Set.of("result"), FIB_CODE));
        return steps;
    }

    vars = copy(vars);
    vars.put("prev2", "0");
    vars.put("prev1", "1");
    steps.add(step(sn++, 2, "INIT", "Initialize: prev2=0 (fib0), prev1=1 (fib1)", vars, Set.of("prev2","prev1"), FIB_CODE));

    int prev2 = 0, prev1 = 1;
    for (int i = 2; i <= n; i++) {
        vars = copy(vars);
        vars.put("i", String.valueOf(i));
        steps.add(step(sn++, 3, "LOOP_CHECK", "Loop i = " + i + " ≤ " + n, vars, Set.of("i"), FIB_CODE));

        int curr = prev1 + prev2;
        vars = copy(vars);
        vars.put("curr", String.valueOf(curr));
        steps.add(step(sn++, 4, "COMPUTE", "curr = prev1(" + prev1 + ") + prev2(" + prev2 + ") = " + curr, vars, Set.of("curr"), FIB_CODE));

        prev2 = prev1; prev1 = curr;
        vars = copy(vars);
        vars.put("prev2", String.valueOf(prev2));
        vars.put("prev1", String.valueOf(prev1));
        steps.add(step(sn++, 5, "COMPUTE", "Slide: prev2=" + prev2 + ", prev1=" + prev1, vars, Set.of("prev2","prev1"), FIB_CODE));
    }

    vars.put("result", String.valueOf(prev1));
    steps.add(step(sn, 8, "FOUND", "✅ fib(" + n + ") = " + prev1, vars, Set.of("result"), FIB_CODE));
    return steps;
}

// ── FACTORIAL ──────────────────────────────────────────────────────────────

private static final List<String> FACT_CODE = List.of(
        "long factorial(int n) {",
        "    if (n <= 1) return 1;",
        "    long result = 1;",
        "    for (int i = 2; i <= n; i++) {",
        "        result *= i;",
        "    }",
        "    return result;",
        "}"
);

private List<TraceStep> factorialTrace(TraceRequest req) {
    int n = req.getTarget() != null ? Math.min(req.getTarget(), 12) : 6;
    List<TraceStep> steps = new ArrayList<>();
    LinkedHashMap<String, String> vars = new LinkedHashMap<>();
    int sn = 1;

    vars.put("n", String.valueOf(n));
    steps.add(step(sn++, 0, "INIT", "Compute " + n + "! iteratively", vars, Set.of("n"), FACT_CODE));

    if (n <= 1) {
        vars.put("result", "1");
        steps.add(step(sn, 1, "FOUND", "✅ Base case: " + n + "! = 1", vars, Set.of("result"), FACT_CODE));
        return steps;
    }

    vars.put("result", "1");
    steps.add(step(sn++, 2, "INIT", "Initialize result = 1", vars, Set.of("result"), FACT_CODE));

    long result = 1;
    for (int i = 2; i <= n; i++) {
        vars = copy(vars);
        vars.put("i", String.valueOf(i));
        steps.add(step(sn++, 3, "LOOP_CHECK", "i = " + i + " ≤ " + n, vars, Set.of("i"), FACT_CODE));

        result *= i;
        vars = copy(vars);
        vars.put("result", String.valueOf(result));
        steps.add(step(sn++, 4, "COMPUTE", "result = result × " + i + " = " + result, vars, Set.of("result"), FACT_CODE));
    }

    steps.add(step(sn, 6, "FOUND", "✅ " + n + "! = " + result, vars, Set.of("result"), FACT_CODE));
    return steps;
}

// ── PREFIX SUM ─────────────────────────────────────────────────────────────

private static final List<String> PS_CODE = List.of(
        "int[] buildPrefixSum(int[] arr) {",
        "    int[] prefix = new int[arr.length + 1];",
        "    prefix[0] = 0;",
        "    for (int i = 0; i < arr.length; i++) {",
        "        prefix[i+1] = prefix[i] + arr[i];",
        "    }",
        "    return prefix;",
        "}",
        "// Query: sum(l, r) = prefix[r+1] - prefix[l]"
);

private List<TraceStep> prefixSumTrace(TraceRequest req) {
    int[] arr = resolveArray(req);
    if (arr.length > 7) arr = Arrays.copyOf(arr, 7);
    int[] prefix = new int[arr.length + 1];
    List<TraceStep> steps = new ArrayList<>();
    LinkedHashMap<String, String> vars = new LinkedHashMap<>();
    int sn = 1;

    vars.put("arr", arrToString(arr));
    vars.put("prefix", "[0]");
    steps.add(step(sn++, 0, "INIT", "Build prefix sum array. prefix[0] = 0", vars, Set.of("arr","prefix"), PS_CODE));

    for (int i = 0; i < arr.length; i++) {
        prefix[i + 1] = prefix[i] + arr[i];
        vars = copy(vars);
        vars.put("i", String.valueOf(i));
        vars.put("prefix", arrToString(Arrays.copyOf(prefix, i + 2)));
        steps.add(step(sn++, 4, "COMPUTE",
                "prefix[" + (i+1) + "] = prefix[" + i + "](" + prefix[i] + ") + arr[" + i + "](" + arr[i] + ") = " + prefix[i+1],
                vars, Set.of("prefix","i"), PS_CODE));
    }

    vars = copy(vars);
    vars.put("prefix", arrToString(prefix));
    // Demo query
    int l = 1, r = arr.length - 2;
    if (r >= l) {
        int qResult = prefix[r + 1] - prefix[l];
        vars.put("queryResult", "sum(" + l + "," + r + ") = prefix[" + (r+1) + "]-prefix[" + l + "] = " + qResult);
        steps.add(step(sn++, 8, "FOUND", "✅ prefix built: " + arrToString(prefix) + ". Query sum(" + l + "," + r + ")=" + qResult + " in O(1)", vars, Set.of("prefix","queryResult"), PS_CODE));
    } else {
        steps.add(step(sn, 8, "FOUND", "✅ prefix array built: " + arrToString(prefix), vars, Set.of("prefix"), PS_CODE));
    }
    return steps;
}

// ── TWO SUM HASHMAP ────────────────────────────────────────────────────────

private static final List<String> TS_CODE = List.of(
        "int[] twoSum(int[] nums, int target) {",
        "    Map<Integer,Integer> map = new HashMap<>();",
        "    for (int i = 0; i < nums.length; i++) {",
        "        int complement = target - nums[i];",
        "        if (map.containsKey(complement)) {",
        "            return new int[]{map.get(complement), i};",
        "        }",
        "        map.put(nums[i], i);",
        "    }",
        "    return new int[]{-1, -1};",
        "}"
);

private List<TraceStep> twoSumHashTrace(TraceRequest req) {
    int[] arr = resolveArray(req);
    int target = req.getTarget() != null ? req.getTarget() : arr[0] + arr[arr.length - 1];
    List<TraceStep> steps = new ArrayList<>();
    LinkedHashMap<String, String> vars = new LinkedHashMap<>();
    Map<Integer, Integer> map = new LinkedHashMap<>();
    int sn = 1;

    vars.put("nums", arrToString(arr));
    vars.put("target", String.valueOf(target));
    vars.put("map", "{}");
    steps.add(step(sn++, 0, "INIT", "Create empty HashMap. target = " + target, vars, Set.of("nums","target","map"), TS_CODE));

    for (int i = 0; i < arr.length; i++) {
        int comp = target - arr[i];
        vars = copy(vars);
        vars.put("i", String.valueOf(i));
        vars.put("complement", String.valueOf(comp));
        steps.add(step(sn++, 3, "COMPUTE", "i=" + i + "  nums[i]=" + arr[i] + "  complement = " + target + " - " + arr[i] + " = " + comp, vars, Set.of("i","complement"), TS_CODE));

        vars = copy(vars);
        steps.add(step(sn++, 4, "COMPARE", "map.containsKey(" + comp + ") ? map=" + map + " → " + map.containsKey(comp), vars, Set.of(), TS_CODE));

        if (map.containsKey(comp)) {
            vars = copy(vars);
            vars.put("result", "[" + map.get(comp) + ", " + i + "]");
            steps.add(step(sn, 5, "FOUND", "✅ FOUND! indices [" + map.get(comp) + ", " + i + "] → nums[" + map.get(comp) + "](" + comp + ") + nums[" + i + "](" + arr[i] + ") = " + target, vars, Set.of("result"), TS_CODE));
            return steps;
        }

        map.put(arr[i], i);
        vars = copy(vars);
        vars.put("map", map.toString());
        steps.add(step(sn++, 7, "COMPUTE", "Store map.put(" + arr[i] + ", " + i + ") → map=" + map, vars, Set.of("map"), TS_CODE));
    }

    vars.put("result", "[-1,-1]");
    steps.add(step(sn, 9, "NOT_FOUND", "❌ No pair found with sum = " + target, vars, Set.of("result"), TS_CODE));
    return steps;
}

// ── STACK OPERATIONS ───────────────────────────────────────────────────────

private static final List<String> STACK_CODE = List.of(
        "Deque<Integer> stack = new ArrayDeque<>();",
        "// Push operations",
        "stack.push(value);    // O(1)",
        "// Peek (view top)",
        "stack.peek();         // O(1)",
        "// Pop operation",
        "stack.pop();          // O(1)",
        "// Check empty",
        "stack.isEmpty();      // O(1)"
);

private List<TraceStep> stackOpsTrace(TraceRequest req) {
    int[] arr = resolveArray(req);
    if (arr.length > 6) arr = Arrays.copyOf(arr, 6);
    List<TraceStep> steps = new ArrayList<>();
    LinkedHashMap<String, String> vars = new LinkedHashMap<>();
    Deque<Integer> stack = new ArrayDeque<>();
    int sn = 1;

    vars.put("stack", "[]");
    steps.add(step(sn++, 0, "INIT", "Create empty stack (ArrayDeque — LIFO)", vars, Set.of("stack"), STACK_CODE));

    for (int i = 0; i < arr.length; i++) {
        stack.push(arr[i]);
        vars = copy(vars);
        vars.put("pushed", String.valueOf(arr[i]));
        vars.put("stack", stack.toString());
        steps.add(step(sn++, 2, "COMPUTE", "push(" + arr[i] + ") → stack: " + stack + " (size=" + stack.size() + ")", vars, Set.of("pushed","stack"), STACK_CODE));
    }

    vars = copy(vars);
    vars.put("top", String.valueOf(stack.peek()));
    steps.add(step(sn++, 4, "COMPARE", "peek() = " + stack.peek() + " (top element, not removed)", vars, Set.of("top"), STACK_CODE));

    int popCount = Math.min(3, stack.size());
    for (int i = 0; i < popCount; i++) {
        int popped = stack.pop();
        vars = copy(vars);
        vars.put("popped", String.valueOf(popped));
        vars.put("stack", stack.toString());
        steps.add(step(sn++, 6, "COMPUTE", "pop() = " + popped + " → remaining: " + stack, vars, Set.of("popped","stack"), STACK_CODE));
    }

    vars.put("isEmpty", String.valueOf(stack.isEmpty()));
    steps.add(step(sn, 8, "FOUND", "✅ Stack demo complete. isEmpty=" + stack.isEmpty(), vars, Set.of("isEmpty"), STACK_CODE));
    return steps;
}

// ── QUEUE OPERATIONS ───────────────────────────────────────────────────────

private static final List<String> QUEUE_CODE = List.of(
        "Queue<Integer> q = new LinkedList<>();",
        "// Enqueue (add to tail)",
        "q.offer(value);       // O(1)",
        "// Peek (view front)",
        "q.peek();             // O(1)",
        "// Dequeue (remove front)",
        "q.poll();             // O(1)",
        "// FIFO: First In First Out",
        "q.isEmpty();          // O(1)"
);

private List<TraceStep> queueOpsTrace(TraceRequest req) {
    int[] arr = resolveArray(req);
    if (arr.length > 6) arr = Arrays.copyOf(arr, 6);
    List<TraceStep> steps = new ArrayList<>();
    LinkedHashMap<String, String> vars = new LinkedHashMap<>();
    Queue<Integer> queue = new LinkedList<>();
    int sn = 1;

    vars.put("queue", "[]");
    steps.add(step(sn++, 0, "INIT", "Create empty queue (LinkedList — FIFO)", vars, Set.of("queue"), QUEUE_CODE));

    for (int i = 0; i < arr.length; i++) {
        queue.offer(arr[i]);
        vars = copy(vars);
        vars.put("offered", String.valueOf(arr[i]));
        vars.put("queue", queue.toString());
        steps.add(step(sn++, 2, "COMPUTE", "offer(" + arr[i] + ") → queue: " + queue, vars, Set.of("offered","queue"), QUEUE_CODE));
    }

    vars = copy(vars);
    vars.put("front", String.valueOf(queue.peek()));
    steps.add(step(sn++, 4, "COMPARE", "peek() = " + queue.peek() + " (front — first inserted, not removed)", vars, Set.of("front"), QUEUE_CODE));

    int pollCount = Math.min(3, queue.size());
    for (int i = 0; i < pollCount; i++) {
        int polled = queue.poll();
        vars = copy(vars);
        vars.put("polled", String.valueOf(polled));
        vars.put("queue", queue.toString());
        steps.add(step(sn++, 6, "COMPUTE", "poll() = " + polled + " (FIFO order) → remaining: " + queue, vars, Set.of("polled","queue"), QUEUE_CODE));
    }

    vars.put("isEmpty", String.valueOf(queue.isEmpty()));
    steps.add(step(sn, 8, "FOUND", "✅ Queue demo complete. FIFO order preserved.", vars, Set.of("isEmpty"), QUEUE_CODE));
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