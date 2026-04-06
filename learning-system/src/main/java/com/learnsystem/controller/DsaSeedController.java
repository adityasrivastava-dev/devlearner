package com.learnsystem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.model.Example;
import com.learnsystem.model.Problem;
import com.learnsystem.model.Topic;
import com.learnsystem.repository.ExampleRepository;
import com.learnsystem.repository.ProblemRepository;
import com.learnsystem.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * POST /api/admin/seed-dsa
 *
 * Seeds high-quality DSA topics: Arrays, Binary Search, Two Pointers, Sliding Window.
 * Each topic includes:
 *  - Story-based theory (story, analogy, memoryAnchor, firstPrinciples)
 *  - 3 code examples with pseudocode and real Java code
 *  - 5 practice problems with proper test cases, 3-level hints, starter/solution code
 *
 * Skips topics that already exist (by title) to be safe for re-runs.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class DsaSeedController {

    private final TopicRepository   topicRepo;
    private final ExampleRepository exampleRepo;
    private final ProblemRepository problemRepo;
    private final ObjectMapper      mapper;

    @PostMapping("/seed-dsa")
    @Transactional
    public ResponseEntity<Map<String, Object>> seedDsa() {
        int topics = 0, examples = 0, problems = 0;
        List<String> skipped = new ArrayList<>();
        List<String> seeded  = new ArrayList<>();

        for (TopicData td : buildTopics()) {
            if (topicRepo.findByTitle(td.topic.getTitle()).isPresent()) {
                skipped.add(td.topic.getTitle());
                continue;
            }
            Topic saved = topicRepo.save(td.topic);
            for (Example ex : td.examples) { ex.setTopic(saved); exampleRepo.save(ex); examples++; }
            for (Problem p  : td.problems)  { p.setTopic(saved);  problemRepo.save(p);  problems++; }
            seeded.add(saved.getTitle());
            topics++;
        }

        return ResponseEntity.ok(Map.of(
            "topicsSeeded",   topics,
            "examplesSeeded", examples,
            "problemsSeeded", problems,
            "seeded",  seeded,
            "skipped", skipped
        ));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DATA
    // ══════════════════════════════════════════════════════════════════════════

    private List<TopicData> buildTopics() {
        return List.of(
            buildArrays(),
            buildBinarySearch(),
            buildTwoPointers(),
            buildSlidingWindow()
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ARRAYS
    // ─────────────────────────────────────────────────────────────────────────
    private TopicData buildArrays() {
        Topic t = new Topic();
        t.setTitle("Arrays");
        t.setCategory(Topic.Category.DSA);
        t.setDescription("An array is a contiguous block of memory holding elements of the same type, accessed by index in O(1) time.");
        t.setTimeComplexity("Access O(1) · Search O(n) · Insert/Delete O(n)");
        t.setSpaceComplexity("O(n)");
        t.setMemoryAnchor("Array = numbered mailboxes in a row. Box #0 is the first, box #n-1 is the last. Jump to any box instantly.");
        t.setStory("Imagine a hotel with numbered rooms. The receptionist hands you a master key that can open room 0, room 1, room 2… all the way to room n-1. You don't walk through every corridor — you teleport directly to the room number you need. That's an array. The rooms are your elements, the room numbers are indices, and the teleportation is O(1) random access. The catch? The hotel is built all at once. You can't add a new room in the middle without demolishing and rebuilding the whole wing.");
        t.setAnalogy("Think of an egg carton. 12 compartments, each pre-numbered. You reach directly into compartment 7 without checking 0 through 6. But if you want to insert a new egg between compartments 3 and 4, every egg from 4 onward must physically shift right — that's why insertion is O(n).");
        t.setFirstPrinciples("An array stores elements at contiguous memory addresses. If the base address is 1000 and each int is 4 bytes, element [i] is at address 1000 + (i × 4). The CPU computes this in a single operation — hence O(1) access. Traversal is O(n) because you visit each element once. Insertion at index i is O(n) because all elements from i to n-1 must shift right by one position to make room.");
        t.setBruteForce("For most array problems, the brute force is a nested loop: for every element, check every other element. This gives O(n²) time but O(1) space. Example: find a pair with target sum — check all pairs (i, j) where i < j.");
        t.setOptimizedApproach("Most O(n²) array problems reduce to O(n) using a HashMap (trade space for time) or O(n log n) using sorting. For Two Sum: store seen elements in a HashSet — one pass instead of two nested loops. For majority element: Boyer-Moore voting algorithm runs in O(n) with O(1) space.");
        t.setWhenToUse("Use arrays when you need: O(1) random access by index, cache-friendly sequential traversal, fixed-size data. Avoid when you need frequent insertions/deletions in the middle (use LinkedList) or unknown size at compile time (use ArrayList/dynamic array).");

        List<Example> exs = List.of(
            example(1, "Traverse and Print",
                "Iterate through all elements and print each one. The foundation of every array algorithm.",
                """
                // Traverse array left to right
                int[] arr = {10, 20, 30, 40, 50};
                for (int i = 0; i < arr.length; i++) {
                    System.out.println("arr[" + i + "] = " + arr[i]);
                }
                // Enhanced for-each (when you don't need the index)
                for (int val : arr) {
                    System.out.print(val + " ");
                }
                """,
                """
                TRAVERSE(arr, n):
                  for i from 0 to n-1:
                    print arr[i]
                """,
                "arr[i] accesses element at index i directly — O(1). The loop runs n times total — O(n).",
                "Reading sensor data, processing log entries line by line, rendering a list of UI items."),

            example(2, "Find Maximum Element",
                "Scan once, tracking the largest value seen so far. Classic single-pass pattern.",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

                        int max = arr[0]; // assume first is max
                        for (int i = 1; i < n; i++) {
                            if (arr[i] > max) max = arr[i];
                        }
                        System.out.println(max);
                    }
                }
                """,
                """
                FIND_MAX(arr, n):
                  max = arr[0]
                  for i from 1 to n-1:
                    if arr[i] > max:
                      max = arr[i]
                  return max
                """,
                "Initialize max with the first element (not Integer.MIN_VALUE) to handle all-negative arrays correctly.",
                "Finding the hottest day in a weather dataset, max stock price in a trading window."),

            example(3, "Reverse an Array In-Place",
                "Use two pointers — one at each end — swapping and moving inward. No extra space needed.",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

                        int left = 0, right = n - 1;
                        while (left < right) {
                            int temp = arr[left];
                            arr[left] = arr[right];
                            arr[right] = temp;
                            left++;
                            right--;
                        }
                        StringBuilder sb = new StringBuilder();
                        for (int i = 0; i < n; i++) {
                            if (i > 0) sb.append(' ');
                            sb.append(arr[i]);
                        }
                        System.out.println(sb);
                    }
                }
                """,
                """
                REVERSE(arr, n):
                  left = 0, right = n-1
                  while left < right:
                    swap arr[left] and arr[right]
                    left++, right--
                """,
                "Two pointers converging toward the center — each pair is swapped once. O(n/2) = O(n) time, O(1) space.",
                "Reversing a string (char array), undoing a stack operation, palindrome checking.")
        );

        List<Problem> probs = List.of(
            problem(1, "Find Max/Min in Array",
                "Given an array of n integers, find and print the maximum and minimum element.",
                "First line: n (number of elements). Second line: n space-separated integers.",
                "Print max and min on one line separated by a space.",
                "5\n3 1 4 1 5", "5 1",
                tcs(tc("5\n3 1 4 1 5","5 1"), tc("1\n42","42 42"), tc("4\n-3 -1 -4 -2","-1 -4"), tc("6\n7 2 9 4 6 1","9 1")),
                "EASY", "Two Variables", null,
                "Scan once, tracking both max and min.",
                "Declare max = arr[0] and min = arr[0]. Loop from index 1 and update both in the same pass.",
                """
                max = arr[0], min = arr[0]
                for i from 1 to n-1:
                  if arr[i] > max: max = arr[i]
                  if arr[i] < min: min = arr[i]
                print max + " " + min
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        // Your solution here
                    }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt();
                        int max = Integer.MIN_VALUE, min = Integer.MAX_VALUE;
                        for (int i = 0; i < n; i++) {
                            int v = sc.nextInt();
                            if (v > max) max = v;
                            if (v < min) min = v;
                        }
                        System.out.println(max + " " + min);
                    }
                }
                """,
                "1 ≤ n ≤ 10⁵ · -10⁹ ≤ arr[i] ≤ 10⁹",
                "Initialize max to Integer.MIN_VALUE and min to Integer.MAX_VALUE, then update in a single pass.",
                "Single-pass O(n) solution: maintain two variables max and min. For each element, update both if needed. No sorting required."),

            problem(2, "Reverse an Array",
                "Given an array of n integers, reverse it in-place and print the result.",
                "First line: n. Second line: n space-separated integers.",
                "Print the reversed array on one line.",
                "5\n1 2 3 4 5", "5 4 3 2 1",
                tcs(tc("5\n1 2 3 4 5","5 4 3 2 1"), tc("1\n7","7"), tc("4\n4 3 2 1","1 2 3 4"), tc("6\n1 2 3 4 5 6","6 5 4 3 2 1")),
                "EASY", "Two Pointers", null,
                "Use two pointers — one at start, one at end — and swap them while they haven't crossed.",
                "left starts at 0, right starts at n-1. Swap arr[left] and arr[right], then move both inward.",
                """
                left = 0, right = n-1
                while left < right:
                  swap arr[left], arr[right]
                  left++, right--
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        // Reverse in-place here
                    }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        int left = 0, right = n - 1;
                        while (left < right) {
                            int tmp = arr[left]; arr[left] = arr[right]; arr[right] = tmp;
                            left++; right--;
                        }
                        StringBuilder sb = new StringBuilder();
                        for (int i = 0; i < n; i++) { if (i > 0) sb.append(' '); sb.append(arr[i]); }
                        System.out.println(sb);
                    }
                }
                """,
                "1 ≤ n ≤ 10⁵ · -10⁹ ≤ arr[i] ≤ 10⁹",
                null, null),

            problem(3, "Second Largest Element",
                "Find the second largest distinct element in an array. If no second largest exists, print -1.",
                "First line: n. Second line: n space-separated integers.",
                "Print the second largest distinct element, or -1.",
                "5\n12 35 1 10 34", "34",
                tcs(tc("5\n12 35 1 10 34","34"), tc("3\n5 5 5","-1"), tc("4\n1 2 3 4","3"), tc("2\n10 20","10")),
                "EASY", "Two Variables",
                "n can have duplicates. Initialize both largest and secondLargest to Integer.MIN_VALUE.",
                "Use two variables: largest and secondLargest. For each element, if it's greater than largest, update secondLargest = largest then largest = element. Else if it's greater than secondLargest and not equal to largest, update secondLargest.",
                "Track top-2 distinct values in one pass. Second largest is less than max but greater than all others. Check that secondLargest != Integer.MIN_VALUE to detect if it was ever updated.",
                """
                largest = secondLargest = Integer.MIN_VALUE
                for each v in arr:
                  if v > largest:
                    secondLargest = largest
                    largest = v
                  else if v > secondLargest and v != largest:
                    secondLargest = v
                print secondLargest == MIN_VALUE ? -1 : secondLargest
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        // Find second largest distinct element
                    }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt();
                        int largest = Integer.MIN_VALUE, second = Integer.MIN_VALUE;
                        for (int i = 0; i < n; i++) {
                            int v = sc.nextInt();
                            if (v > largest) { second = largest; largest = v; }
                            else if (v > second && v != largest) second = v;
                        }
                        System.out.println(second == Integer.MIN_VALUE ? -1 : second);
                    }
                }
                """,
                "1 ≤ n ≤ 10⁵ · -10⁹ ≤ arr[i] ≤ 10⁹",
                null, null),

            problem(4, "Left Rotate Array by K",
                "Rotate an array of n elements to the left by k positions.",
                "First line: n k. Second line: n space-separated integers.",
                "Print the rotated array.",
                "5 2\n1 2 3 4 5", "3 4 5 1 2",
                tcs(tc("5 2\n1 2 3 4 5","3 4 5 1 2"), tc("3 0\n1 2 3","1 2 3"), tc("4 4\n1 2 3 4","1 2 3 4"), tc("5 7\n1 2 3 4 5","3 4 5 1 2")),
                "MEDIUM", "Reversal Algorithm",
                "k can be larger than n. Use k = k % n to handle that.",
                "The reversal algorithm: reverse first k elements, reverse remaining n-k elements, then reverse the entire array.",
                """
                k = k % n (handle k > n)
                reverse(arr, 0, k-1)
                reverse(arr, k, n-1)
                reverse(arr, 0, n-1)
                """,
                """
                import java.util.Scanner;
                public class Main {
                    static void reverse(int[] arr, int l, int r) {
                        while (l < r) { int t=arr[l]; arr[l]=arr[r]; arr[r]=t; l++; r--; }
                    }
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), k = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        // Rotate left by k positions
                    }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    static void reverse(int[] arr, int l, int r) {
                        while (l < r) { int t=arr[l]; arr[l]=arr[r]; arr[r]=t; l++; r--; }
                    }
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), k = sc.nextInt() % n;
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        reverse(arr, 0, k-1);
                        reverse(arr, k, n-1);
                        reverse(arr, 0, n-1);
                        StringBuilder sb = new StringBuilder();
                        for (int i = 0; i < n; i++) { if (i > 0) sb.append(' '); sb.append(arr[i]); }
                        System.out.println(sb);
                    }
                }
                """,
                "1 ≤ n ≤ 10⁵ · 0 ≤ k ≤ 10⁹",
                null, null),

            problem(5, "Two Sum — Find Pair with Target",
                "Given an array and a target sum, find two indices i and j (i < j) such that arr[i] + arr[j] == target. Print the 1-based indices or -1 if no pair exists.",
                "First line: n target. Second line: n integers.",
                "Print i and j (1-based), or -1.",
                "5 9\n2 7 11 15 3", "1 2",
                tcs(tc("5 9\n2 7 11 15 3","1 2"), tc("4 6\n1 2 3 4","2 3"), tc("3 10\n1 2 3","-1"), tc("4 4\n0 4 2 2","2 4")),
                "MEDIUM", "HashMap",
                "Brute force: two nested loops O(n²). Think about how to reduce to one pass.",
                "Use a HashMap: for each element, check if (target - element) already exists in the map. If yes, you've found your pair. If not, store the element with its index.",
                """
                map = new HashMap<value, index>
                for i from 0 to n-1:
                  complement = target - arr[i]
                  if map contains complement:
                    print map.get(complement)+1, i+1
                    return
                  map.put(arr[i], i)
                print -1
                """,
                """
                import java.util.*;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), target = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        // Find pair with target sum using HashMap
                    }
                }
                """,
                """
                import java.util.*;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), target = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        Map<Integer,Integer> seen = new HashMap<>();
                        for (int i = 0; i < n; i++) {
                            int comp = target - arr[i];
                            if (seen.containsKey(comp)) {
                                System.out.println((seen.get(comp)+1) + " " + (i+1));
                                return;
                            }
                            seen.put(arr[i], i);
                        }
                        System.out.println(-1);
                    }
                }
                """,
                "2 ≤ n ≤ 10⁵ · -10⁹ ≤ arr[i] ≤ 10⁹ · Exactly one or zero valid pairs",
                null, null)
        );
        return new TopicData(t, exs, probs);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BINARY SEARCH
    // ─────────────────────────────────────────────────────────────────────────
    private TopicData buildBinarySearch() {
        Topic t = new Topic();
        t.setTitle("Binary Search");
        t.setCategory(Topic.Category.DSA);
        t.setDescription("Binary search eliminates half the search space with each comparison, achieving O(log n) on sorted data.");
        t.setTimeComplexity("O(log n)");
        t.setSpaceComplexity("O(1) iterative · O(log n) recursive");
        t.setMemoryAnchor("Binary Search = Guess the middle, throw away half. Like guessing 1-100: first guess 50. Too high? Guess 25. Too low? Guess 37. Done in ≤7 guesses.");
        t.setStory("You're at a library with 1 million books sorted alphabetically. You need 'The Pragmatic Programmer'. Would you start at book #1 and scan every title? No — you'd open to the middle, see 'M...', and since 'P' comes after 'M', you'd jump to the 3/4 mark. Still not right? Jump to 7/8. In at most 20 jumps, you'd find any book in a million. That's binary search — each guess cuts the problem in half.");
        t.setAnalogy("Imagine a thermostat guess game: I'm thinking of a temperature between 0°C and 100°C. Your first guess: 50°. I say 'higher'. You guess 75°. I say 'lower'. You guess 62°... You'll land on the answer in at most 7 guesses for 100 values, 17 for 100,000 values. Each wrong answer is still information — it halves your search space.");
        t.setFirstPrinciples("Binary search requires a monotonic condition — the array must be sorted (or you can define a predicate that goes from false to false to TRUE to TRUE). With sorted data, if arr[mid] < target, then target must be in the right half — we can permanently discard the left. If arr[mid] > target, discard the right. This halving recurrence T(n) = T(n/2) + O(1) solves to O(log n) by the master theorem.");
        t.setBruteForce("Linear search: scan every element from left to right. O(n) time. Works on unsorted data. For n=10⁶, that's up to 1,000,000 comparisons.");
        t.setOptimizedApproach("Binary search: maintain lo and hi pointers. Compute mid = lo + (hi-lo)/2 (avoids integer overflow vs (lo+hi)/2). Compare arr[mid] with target and shrink the search space. At most ⌈log₂(n)⌉ comparisons. For n=10⁶ that's just 20 comparisons.");
        t.setWhenToUse("Use binary search when: data is sorted (or you can define a monotonic condition), you need O(log n) search. Common patterns: search in sorted array, find first/last occurrence, find minimum in rotated array, binary search on answer (parametric search).");

        List<Example> exs = List.of(
            example(1, "Classic Binary Search",
                "Find target in a sorted array. Return its index, or -1 if not found.",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), target = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

                        int lo = 0, hi = n - 1;
                        while (lo <= hi) {
                            int mid = lo + (hi - lo) / 2; // safe from overflow
                            if      (arr[mid] == target) { System.out.println(mid); return; }
                            else if (arr[mid] <  target) lo = mid + 1;
                            else                          hi = mid - 1;
                        }
                        System.out.println(-1);
                    }
                }
                """,
                """
                BINARY_SEARCH(arr, n, target):
                  lo = 0, hi = n-1
                  while lo <= hi:
                    mid = lo + (hi-lo)/2
                    if arr[mid] == target: return mid
                    if arr[mid] < target:  lo = mid+1
                    else:                  hi = mid-1
                  return -1
                """,
                "mid = lo + (hi-lo)/2 instead of (lo+hi)/2 prevents integer overflow when lo and hi are large.",
                "Database index lookups, dictionary word lookup, git bisect for finding the commit that introduced a bug."),

            example(2, "Find First Occurrence",
                "Find the first (leftmost) index of target in a sorted array with duplicates. Return -1 if not found.",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), target = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

                        int lo = 0, hi = n - 1, result = -1;
                        while (lo <= hi) {
                            int mid = lo + (hi - lo) / 2;
                            if (arr[mid] == target) {
                                result = mid;  // found it, but keep looking left
                                hi = mid - 1;  // don't stop — look for an earlier occurrence
                            } else if (arr[mid] < target) {
                                lo = mid + 1;
                            } else {
                                hi = mid - 1;
                            }
                        }
                        System.out.println(result);
                    }
                }
                """,
                """
                FIRST_OCCURRENCE(arr, n, target):
                  lo=0, hi=n-1, result=-1
                  while lo<=hi:
                    mid = lo+(hi-lo)/2
                    if arr[mid]==target: result=mid; hi=mid-1  // record and keep searching left
                    elif arr[mid]<target: lo=mid+1
                    else: hi=mid-1
                  return result
                """,
                "When arr[mid] == target, DON'T return immediately. Save the index and continue searching the left half to find an earlier occurrence.",
                "Counting occurrences of a word in a sorted log file, finding a price range in sorted pricing tiers."),

            example(3, "Binary Search on Answer (Parametric)",
                "Find the minimum number of days to make m bouquets from n flowers, each bouquet needing k adjacent bloomed flowers.",
                """
                import java.util.Scanner;
                public class Main {
                    static boolean canMake(int[] days, int m, int k, int waitDays) {
                        int bouquets = 0, adj = 0;
                        for (int d : days) {
                            if (d <= waitDays) { adj++; if (adj == k) { bouquets++; adj = 0; } }
                            else adj = 0;
                        }
                        return bouquets >= m;
                    }
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), m = sc.nextInt(), k = sc.nextInt();
                        int[] days = new int[n];
                        for (int i = 0; i < n; i++) days[i] = sc.nextInt();
                        if ((long)m * k > n) { System.out.println(-1); return; }
                        int lo = 1, hi = 0;
                        for (int d : days) hi = Math.max(hi, d);
                        while (lo < hi) {
                            int mid = lo + (hi - lo) / 2;
                            if (canMake(days, m, k, mid)) hi = mid;
                            else lo = mid + 1;
                        }
                        System.out.println(lo);
                    }
                }
                """,
                """
                BINARY_SEARCH_ON_ANSWER:
                  lo = min possible answer
                  hi = max possible answer
                  while lo < hi:
                    mid = lo + (hi-lo)/2
                    if canAchieve(mid):
                      hi = mid   // mid is valid, try smaller
                    else:
                      lo = mid+1 // too small, need more
                  return lo
                """,
                "The key insight: 'If I can make m bouquets in X days, I can also do it in X+1 days.' This monotonic property enables binary search on the ANSWER, not the array.",
                "Minimizing the maximum load across servers, finding the minimum capacity for a shipping problem (classic LeetCode pattern).")
        );

        List<Problem> probs = List.of(
            problem(1, "Search in Sorted Array",
                "Given a sorted array of n distinct integers and a target, return its 0-based index or -1 if not found.",
                "First line: n target. Second line: n sorted integers.",
                "Print the 0-based index, or -1.",
                "6 7\n1 3 5 7 9 11", "3",
                tcs(tc("6 7\n1 3 5 7 9 11","3"), tc("5 6\n1 2 3 4 5","-1"), tc("1 1\n1","0"), tc("5 5\n1 3 5 7 9","2")),
                "EASY", "Binary Search", null,
                "Keep two pointers: lo=0, hi=n-1. Compute mid and compare with target.",
                "If arr[mid]==target return mid. If arr[mid]<target, target is in right half so lo=mid+1. Else hi=mid-1.",
                "Standard template: lo=0, hi=n-1, while(lo<=hi). mid = lo+(hi-lo)/2.",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), target = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        // Binary search here
                    }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), target = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        int lo = 0, hi = n - 1;
                        while (lo <= hi) {
                            int mid = lo + (hi-lo)/2;
                            if (arr[mid]==target) { System.out.println(mid); return; }
                            if (arr[mid]<target) lo=mid+1; else hi=mid-1;
                        }
                        System.out.println(-1);
                    }
                }
                """,
                "1 ≤ n ≤ 10⁶ · Array is sorted in ascending order · All elements distinct",
                null, null),

            problem(2, "Count Occurrences in Sorted Array",
                "Count how many times target appears in a sorted array.",
                "First line: n target. Second line: n sorted integers.",
                "Print the count.",
                "7 3\n1 2 3 3 3 4 5", "3",
                tcs(tc("7 3\n1 2 3 3 3 4 5","3"), tc("5 9\n1 2 3 4 5","0"), tc("4 2\n2 2 2 2","4"), tc("6 1\n1 1 2 3 4 5","2")),
                "EASY", "Binary Search",
                "Find first occurrence, find last occurrence, then last - first + 1.",
                "Use binary search twice: once to find the leftmost index where arr[mid]==target (keep going left when found), once for the rightmost (keep going right).",
                "firstOcc: when arr[mid]==target, record and hi=mid-1. lastOcc: when arr[mid]==target, record and lo=mid+1. Answer = last - first + 1.",
                """
                import java.util.Scanner;
                public class Main {
                    static int first(int[] arr, int n, int t) {
                        int lo=0, hi=n-1, res=-1;
                        while(lo<=hi){int m=lo+(hi-lo)/2; if(arr[m]==t){res=m;hi=m-1;}else if(arr[m]<t)lo=m+1;else hi=m-1;}
                        return res;
                    }
                    static int last(int[] arr, int n, int t) {
                        int lo=0, hi=n-1, res=-1;
                        // Complete this
                        return res;
                    }
                    public static void main(String[] args) { /* use first() and last() */ }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    static int first(int[] a, int n, int t){int lo=0,hi=n-1,r=-1;while(lo<=hi){int m=lo+(hi-lo)/2;if(a[m]==t){r=m;hi=m-1;}else if(a[m]<t)lo=m+1;else hi=m-1;}return r;}
                    static int last(int[] a, int n, int t){int lo=0,hi=n-1,r=-1;while(lo<=hi){int m=lo+(hi-lo)/2;if(a[m]==t){r=m;lo=m+1;}else if(a[m]<t)lo=m+1;else hi=m-1;}return r;}
                    public static void main(String[] args){
                        Scanner sc=new Scanner(System.in);
                        int n=sc.nextInt(),t=sc.nextInt();
                        int[] a=new int[n];
                        for(int i=0;i<n;i++)a[i]=sc.nextInt();
                        int f=first(a,n,t),l=last(a,n,t);
                        System.out.println(f==-1?0:l-f+1);
                    }
                }
                """,
                "1 ≤ n ≤ 10⁶ · Sorted ascending",
                null, null),

            problem(3, "Find Square Root (Floor)",
                "Given a non-negative integer x, compute the floor of its square root without using Math.sqrt().",
                "Single integer x.",
                "Print floor(sqrt(x)).",
                "8", "2",
                tcs(tc("8","2"), tc("4","2"), tc("0","0"), tc("1","1"), tc("99","9")),
                "EASY", "Binary Search",
                "Binary search on the answer: search in range [0, x]. Find the largest mid where mid*mid <= x.",
                "lo=0, hi=x. If x>=1, hi=x/2+1 is tighter. Find largest mid such that mid*mid <= x.",
                "Use long arithmetic to avoid overflow: (long)mid*mid <= x. When this holds, record mid as answer and go right (lo=mid+1). When it doesn't, go left (hi=mid-1).",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        long x = sc.nextLong();
                        // Binary search on [0, x]
                    }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        long x = sc.nextLong();
                        if (x==0||x==1){System.out.println(x);return;}
                        long lo=1, hi=x/2, ans=1;
                        while(lo<=hi){long mid=lo+(hi-lo)/2;if(mid*mid<=x){ans=mid;lo=mid+1;}else hi=mid-1;}
                        System.out.println(ans);
                    }
                }
                """,
                "0 ≤ x ≤ 2³¹-1",
                null, null),

            problem(4, "Find Minimum in Rotated Sorted Array",
                "A sorted array was rotated at some pivot. Find the minimum element. No duplicates.",
                "First line: n. Second line: n integers.",
                "Print the minimum.",
                "5\n4 5 6 7 0", "0",
                tcs(tc("5\n4 5 6 7 0","0"), tc("4\n3 4 5 1","1"), tc("3\n1 2 3","1"), tc("5\n5 1 2 3 4","1")),
                "MEDIUM", "Binary Search",
                "The unsorted half always contains the minimum. Use arr[mid] vs arr[hi] to decide which half is sorted.",
                "If arr[mid] > arr[hi], the minimum is in the right half (lo=mid+1). Otherwise it's in the left half including mid (hi=mid). Loop while lo<hi.",
                "When lo==hi the loop exits and arr[lo] is the minimum.",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        // Find min in rotated sorted array
                    }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc=new Scanner(System.in);
                        int n=sc.nextInt(); int[] a=new int[n];
                        for(int i=0;i<n;i++)a[i]=sc.nextInt();
                        int lo=0, hi=n-1;
                        while(lo<hi){int mid=lo+(hi-lo)/2; if(a[mid]>a[hi])lo=mid+1; else hi=mid;}
                        System.out.println(a[lo]);
                    }
                }
                """,
                "1 ≤ n ≤ 10⁵ · All elements distinct",
                null, null),

            problem(5, "Koko Eating Bananas",
                "Koko has n piles of bananas. She has h hours to eat all of them. Find the minimum eating speed k (bananas/hour) such that she can finish in h hours. She eats at most k bananas from one pile per hour.",
                "First line: n h. Second line: n pile sizes.",
                "Print the minimum k.",
                "4 8\n3 6 7 11", "4",
                tcs(tc("4 8\n3 6 7 11","4"), tc("5 5\n30 11 23 4 20","30"), tc("4 6\n3 6 7 11","4"), tc("3 3\n1 1 1","1")),
                "MEDIUM", "Binary Search on Answer",
                "Binary search on k. The answer lies between 1 and max(piles).",
                "For a given speed k, hours needed = sum of ceil(pile[i]/k) for all piles. Binary search: if hours<=h, try smaller k (hi=mid). Else lo=mid+1.",
                "ceil(pile/k) = (pile + k - 1) / k using integer arithmetic. Binary search template: lo=1, hi=max, while lo<hi.",
                """
                import java.util.Scanner;
                public class Main {
                    static long hoursNeeded(int[] piles, int k) {
                        long h = 0;
                        for (int p : piles) h += (p + k - 1) / k;
                        return h;
                    }
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), h = sc.nextInt();
                        int[] piles = new int[n];
                        int max = 0;
                        for (int i = 0; i < n; i++) { piles[i]=sc.nextInt(); max=Math.max(max,piles[i]); }
                        // Binary search on k in [1, max]
                    }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    static long hours(int[] p, int k){long h=0;for(int x:p)h+=(x+k-1)/k;return h;}
                    public static void main(String[] args){
                        Scanner sc=new Scanner(System.in);
                        int n=sc.nextInt(),h=sc.nextInt();
                        int[] p=new int[n]; int mx=0;
                        for(int i=0;i<n;i++){p[i]=sc.nextInt();mx=Math.max(mx,p[i]);}
                        int lo=1,hi=mx;
                        while(lo<hi){int mid=lo+(hi-lo)/2;if(hours(p,mid)<=h)hi=mid;else lo=mid+1;}
                        System.out.println(lo);
                    }
                }
                """,
                "1 ≤ n ≤ 10⁴ · 1 ≤ piles[i] ≤ 10⁹ · n ≤ h ≤ 10⁹",
                null, null)
        );
        return new TopicData(t, exs, probs);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TWO POINTERS
    // ─────────────────────────────────────────────────────────────────────────
    private TopicData buildTwoPointers() {
        Topic t = new Topic();
        t.setTitle("Two Pointers");
        t.setCategory(Topic.Category.DSA);
        t.setDescription("Two pointers use two indices moving through the array simultaneously — often from opposite ends — to solve problems in O(n) instead of O(n²).");
        t.setTimeComplexity("O(n) or O(n log n) with sorting");
        t.setSpaceComplexity("O(1)");
        t.setMemoryAnchor("Two Pointers = left hand and right hand squeezing a balloon. Move them inward, stop when they meet.");
        t.setStory("You're a referee for a tug-of-war match. You stand in the middle, but instead of watching the middle, you watch both ends simultaneously — your left eye on team A, your right eye on team B. As the match progresses, you step inward from each side, always knowing exactly what's happening at both ends. Two pointers work like this: one index starts at the left, one at the right, and they move toward each other, working together to find the solution.");
        t.setAnalogy("Squeezing toothpaste from a tube: one thumb at the far end, other thumb at the opening. You squeeze from both ends toward the middle. Each element gets visited once by either the left or right pointer — the total work is O(n), not O(n²) like nested loops.");
        t.setFirstPrinciples("Two pointers work because we can eliminate candidates without checking them. On a sorted array looking for a pair summing to target: if arr[lo] + arr[hi] > target, arr[hi] is too big for any element to the left of lo (since arr[lo] is smallest). We can safely move hi left. If sum < target, arr[lo] is too small for any element to the right of hi — move lo right. We never need to check the discarded candidates.");
        t.setBruteForce("Two nested loops: for every pair (i, j) with i < j, check condition. O(n²) time, O(1) space.");
        t.setOptimizedApproach("Sort first (if not sorted), then use left=0, right=n-1. Based on the current sum/product, move one pointer. Each pointer moves at most n steps total — O(n) after sorting, so O(n log n) overall.");
        t.setWhenToUse("Two pointers shine when: data is sorted (or you can sort it), you need pairs/triplets with a property, you need to check palindromes, remove duplicates in-place, or partition an array. Classic problems: Two Sum II, 3Sum, Container With Most Water, Valid Palindrome.");

        List<Example> exs = List.of(
            example(1, "Two Sum in Sorted Array",
                "Find two numbers in a sorted array that add up to target. Return their 1-based indices.",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), target = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

                        int lo = 0, hi = n - 1;
                        while (lo < hi) {
                            int sum = arr[lo] + arr[hi];
                            if      (sum == target) { System.out.println((lo+1) + " " + (hi+1)); return; }
                            else if (sum  < target) lo++;
                            else                    hi--;
                        }
                        System.out.println(-1);
                    }
                }
                """,
                """
                TWO_SUM_SORTED(arr, target):
                  lo = 0, hi = n-1
                  while lo < hi:
                    sum = arr[lo] + arr[hi]
                    if sum == target: return (lo+1, hi+1)
                    if sum < target:  lo++   // need bigger left
                    else:             hi--   // need smaller right
                  return -1
                """,
                "Because the array is sorted, moving lo right increases sum, moving hi left decreases sum. We can always make progress toward the target.",
                "ATM balance checks (pair of transactions summing to refund), chemistry (reactant combinations)."),

            example(2, "Remove Duplicates In-Place",
                "Remove duplicates from sorted array. Return length of unique elements. Modify in-place.",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

                        if (n == 0) { System.out.println(0); return; }
                        int write = 1; // slow pointer — next write position
                        for (int read = 1; read < n; read++) { // fast pointer
                            if (arr[read] != arr[read - 1]) {
                                arr[write++] = arr[read];
                            }
                        }
                        System.out.println(write);
                    }
                }
                """,
                """
                REMOVE_DUPLICATES(arr, n):
                  write = 1
                  for read from 1 to n-1:
                    if arr[read] != arr[read-1]:  // new unique value
                      arr[write] = arr[read]
                      write++
                  return write
                """,
                "Slow pointer (write) only advances when we see a new unique value. Fast pointer (read) advances every step. Classic fast/slow two-pointer variant.",
                "Deduplicating database records, compressing run-length encoded data."),

            example(3, "Container With Most Water",
                "Given heights of n vertical lines, find two lines that together with the x-axis forms a container holding the most water.",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt();
                        int[] h = new int[n];
                        for (int i = 0; i < n; i++) h[i] = sc.nextInt();

                        int lo = 0, hi = n - 1, maxWater = 0;
                        while (lo < hi) {
                            int water = Math.min(h[lo], h[hi]) * (hi - lo);
                            maxWater = Math.max(maxWater, water);
                            if (h[lo] < h[hi]) lo++; // move the shorter side
                            else               hi--;
                        }
                        System.out.println(maxWater);
                    }
                }
                """,
                """
                CONTAINER_WATER(h, n):
                  lo=0, hi=n-1, max=0
                  while lo < hi:
                    water = min(h[lo], h[hi]) * (hi-lo)
                    max = max(max, water)
                    if h[lo] < h[hi]: lo++  // moving the taller side can only reduce water
                    else: hi--              // same logic
                  return max
                """,
                "Moving the shorter line: if we move the taller line inward, min(h[lo],h[hi]) can only stay same or decrease, AND the width decreases — we can never do better. So always move the shorter.",
                "Reservoir design, fill optimization in manufacturing.")
        );

        List<Problem> probs = List.of(
            problem(1, "Check Palindrome",
                "Given a string of lowercase letters, check if it's a palindrome using two pointers.",
                "A single string of lowercase letters.",
                "Print YES or NO.",
                "racecar", "YES",
                tcs(tc("racecar","YES"), tc("hello","NO"), tc("a","YES"), tc("abba","YES"), tc("abcd","NO")),
                "EASY", "Two Pointers", null,
                "Compare characters from both ends moving inward.",
                "lo starts at 0, hi at s.length()-1. While lo<hi, check if s.charAt(lo)==s.charAt(hi). If not, return NO.",
                "lo=0, hi=n-1. While lo<hi: if s[lo]!=s[hi] return NO. lo++, hi--. Return YES.",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        String s = sc.next();
                        // Two pointer palindrome check
                    }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        String s = sc.next();
                        int lo = 0, hi = s.length()-1;
                        while(lo<hi){ if(s.charAt(lo)!=s.charAt(hi)){System.out.println("NO");return;} lo++;hi--; }
                        System.out.println("YES");
                    }
                }
                """,
                "1 ≤ |s| ≤ 10⁵ · Only lowercase letters",
                null, null),

            problem(2, "Three Sum — Count Triplets with Zero Sum",
                "Count the number of triplets (i, j, k) with i<j<k such that arr[i]+arr[j]+arr[k]==0. Array may have duplicates but don't count duplicate triplets.",
                "First line: n. Second line: n integers.",
                "Print the count of unique zero-sum triplets.",
                "6\n-1 0 1 2 -1 -4", "2",
                tcs(tc("6\n-1 0 1 2 -1 -4","2"), tc("3\n0 0 0","1"), tc("3\n1 2 3","0"), tc("5\n-2 0 0 2 2","2")),
                "MEDIUM", "Two Pointers",
                "Sort the array. For each element arr[i], use two pointers on the remaining subarray to find pairs summing to -arr[i].",
                "After sorting, fix i from 0 to n-3. Use lo=i+1, hi=n-1. If arr[i]+arr[lo]+arr[hi]==0, count it and skip duplicates.",
                "Skip duplicate i (arr[i]==arr[i-1]). After finding a triplet, skip duplicates for lo and hi too.",
                """
                import java.util.*;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        Arrays.sort(arr);
                        int count = 0;
                        // For each i, use two pointers on arr[i+1..n-1]
                    }
                }
                """,
                """
                import java.util.*;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc=new Scanner(System.in);
                        int n=sc.nextInt(); int[] a=new int[n];
                        for(int i=0;i<n;i++)a[i]=sc.nextInt();
                        Arrays.sort(a); int cnt=0;
                        for(int i=0;i<n-2;i++){
                            if(i>0&&a[i]==a[i-1])continue;
                            int lo=i+1,hi=n-1;
                            while(lo<hi){
                                int s=a[i]+a[lo]+a[hi];
                                if(s==0){cnt++;while(lo<hi&&a[lo]==a[lo+1])lo++;while(lo<hi&&a[hi]==a[hi-1])hi--;lo++;hi--;}
                                else if(s<0)lo++; else hi--;
                            }
                        }
                        System.out.println(cnt);
                    }
                }
                """,
                "3 ≤ n ≤ 3000 · -10⁵ ≤ arr[i] ≤ 10⁵",
                null, null),

            problem(3, "Move Zeros to End",
                "Given an array, move all zeros to the end while maintaining the relative order of non-zero elements. Do it in-place.",
                "First line: n. Second line: n integers.",
                "Print the modified array.",
                "5\n0 1 0 3 12", "1 3 12 0 0",
                tcs(tc("5\n0 1 0 3 12","1 3 12 0 0"), tc("3\n0 0 0","0 0 0"), tc("4\n1 2 3 4","1 2 3 4"), tc("5\n1 0 2 0 3","1 2 3 0 0")),
                "EASY", "Two Pointers", null,
                "Use a write pointer that only advances for non-zero elements.",
                "write=0. For each read from 0 to n-1: if arr[read]!=0, set arr[write++]=arr[read]. Then fill remaining with 0s.",
                "write=0; for(read=0..n-1) if arr[read]!=0: arr[write++]=arr[read]; fill arr[write..n-1] with 0",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        // Move zeros to end in-place
                    }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc=new Scanner(System.in);
                        int n=sc.nextInt(); int[] a=new int[n];
                        for(int i=0;i<n;i++)a[i]=sc.nextInt();
                        int w=0;
                        for(int r=0;r<n;r++) if(a[r]!=0) a[w++]=a[r];
                        while(w<n) a[w++]=0;
                        StringBuilder sb=new StringBuilder();
                        for(int i=0;i<n;i++){if(i>0)sb.append(' ');sb.append(a[i]);}
                        System.out.println(sb);
                    }
                }
                """,
                "1 ≤ n ≤ 10⁵",
                null, null),

            problem(4, "Sort Colors (Dutch National Flag)",
                "Given an array of 0s, 1s, and 2s, sort them in-place in one pass without using sort().",
                "First line: n. Second line: n integers (only 0, 1, 2).",
                "Print the sorted array.",
                "6\n2 0 2 1 1 0", "0 0 1 1 2 2",
                tcs(tc("6\n2 0 2 1 1 0","0 0 1 1 2 2"), tc("3\n2 1 0","0 1 2"), tc("4\n0 0 0 0","0 0 0 0"), tc("5\n1 1 1 1 1","1 1 1 1 1")),
                "MEDIUM", "Three Pointers",
                "Dutch National Flag problem. Use three pointers: lo (0s boundary), mid (current), hi (2s boundary).",
                "lo=0, mid=0, hi=n-1. While mid<=hi: if arr[mid]==0 swap with arr[lo], lo++, mid++. If arr[mid]==1, mid++. If arr[mid]==2 swap with arr[hi], hi-- (don't advance mid — need to re-check).",
                "When swapping with hi, don't advance mid because arr[hi] could be 0 and needs processing.",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        // Dutch National Flag: lo, mid, hi pointers
                    }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc=new Scanner(System.in);
                        int n=sc.nextInt(); int[] a=new int[n];
                        for(int i=0;i<n;i++)a[i]=sc.nextInt();
                        int lo=0,mid=0,hi=n-1;
                        while(mid<=hi){
                            if(a[mid]==0){int t=a[lo];a[lo]=a[mid];a[mid]=t;lo++;mid++;}
                            else if(a[mid]==1){mid++;}
                            else{int t=a[mid];a[mid]=a[hi];a[hi]=t;hi--;}
                        }
                        StringBuilder sb=new StringBuilder();
                        for(int i=0;i<n;i++){if(i>0)sb.append(' ');sb.append(a[i]);}
                        System.out.println(sb);
                    }
                }
                """,
                "1 ≤ n ≤ 10⁵ · arr[i] ∈ {0, 1, 2}",
                null, null),

            problem(5, "Trapping Rain Water",
                "Given n bars of height arr[i], compute how much water can be trapped between the bars after raining.",
                "First line: n. Second line: n heights.",
                "Print total water trapped.",
                "6\n0 1 0 2 1 0", "3",
                tcs(tc("6\n0 1 0 2 1 0","3"), tc("6\n4 2 0 3 2 5","9"), tc("1\n5","0"), tc("4\n3 0 0 3","6")),
                "HARD", "Two Pointers",
                "At each position, water = min(maxLeft, maxRight) - height[i]. Brute force: O(n²). Two pointer: O(n).",
                "Maintain leftMax and rightMax. lo pointer moves right, hi pointer moves left. Process the side with smaller max.",
                "If leftMax<rightMax: water at lo = leftMax-arr[lo] (guaranteed safe). Move lo right. Else: water at hi = rightMax-arr[hi]. Move hi left.",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        // Two pointer trapping rain water
                    }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc=new Scanner(System.in);
                        int n=sc.nextInt(); int[] a=new int[n];
                        for(int i=0;i<n;i++)a[i]=sc.nextInt();
                        int lo=0,hi=n-1,lMax=0,rMax=0,water=0;
                        while(lo<hi){
                            if(a[lo]<a[hi]){if(a[lo]>=lMax)lMax=a[lo];else water+=lMax-a[lo];lo++;}
                            else{if(a[hi]>=rMax)rMax=a[hi];else water+=rMax-a[hi];hi--;}
                        }
                        System.out.println(water);
                    }
                }
                """,
                "1 ≤ n ≤ 10⁵ · 0 ≤ arr[i] ≤ 10⁵",
                null, null)
        );
        return new TopicData(t, exs, probs);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SLIDING WINDOW
    // ─────────────────────────────────────────────────────────────────────────
    private TopicData buildSlidingWindow() {
        Topic t = new Topic();
        t.setTitle("Sliding Window");
        t.setCategory(Topic.Category.DSA);
        t.setDescription("The sliding window technique maintains a window (subarray/substring) that expands and shrinks from one end, processing each element at most twice — O(n).");
        t.setTimeComplexity("O(n)");
        t.setSpaceComplexity("O(1) fixed window · O(k) variable window with HashMap");
        t.setMemoryAnchor("Sliding Window = caterpillar moving through a leaf. Head (right) eats forward, tail (left) lifts when the caterpillar gets too long.");
        t.setStory("A train is passing through a series of towns. The train has a fixed number of cars, so as the front car enters a new town, the last car must leave the oldest town. You're counting the total population in all towns the train is currently in — you don't recount every town from scratch each time. You just add the new town's population and subtract the town you just left. That's sliding window: O(1) update per step instead of O(k) recomputation.");
        t.setAnalogy("Imagine a magnifying glass sliding over a line of numbers. The glass has a fixed width of k. As you slide it right, one number appears on the right side of the glass and one disappears from the left. You maintain a running sum — adding the new number and subtracting the old one. O(1) per slide, O(n) total.");
        t.setFirstPrinciples("Sliding window works when: the answer for a window of size k can be derived from the answer for the previous window in O(1) (subtract what left, add what entered). This transforms a nested loop O(n·k) problem to O(n). Variable windows add a shrink condition: when the window violates a constraint, move the left pointer right until the constraint is satisfied again.");
        t.setBruteForce("For every starting position i, compute the answer for the window [i, i+k-1] from scratch. O(n·k) for fixed window, O(n²) for variable window.");
        t.setOptimizedApproach("Fixed window: maintain a running value. When window slides right, add arr[right] and subtract arr[left]. O(n). Variable window: expand right pointer, shrink left when constraint violated. Both pointers traverse array once — O(n).");
        t.setWhenToUse("Use sliding window for: maximum/minimum sum subarray of size k, longest substring with at most k distinct characters, minimum window substring, maximum consecutive 1s after replacing k zeros. Key signal: 'contiguous subarray/substring' with a constraint.");

        List<Example> exs = List.of(
            example(1, "Maximum Sum Subarray of Size K",
                "Find the maximum sum of any contiguous subarray of exactly k elements.",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), k = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

                        // Build first window
                        int windowSum = 0;
                        for (int i = 0; i < k; i++) windowSum += arr[i];

                        int maxSum = windowSum;
                        // Slide: add right element, subtract left element
                        for (int i = k; i < n; i++) {
                            windowSum += arr[i] - arr[i - k];
                            maxSum = Math.max(maxSum, windowSum);
                        }
                        System.out.println(maxSum);
                    }
                }
                """,
                """
                MAX_SUM_K(arr, n, k):
                  windowSum = sum(arr[0..k-1])
                  maxSum = windowSum
                  for i from k to n-1:
                    windowSum += arr[i] - arr[i-k]   // slide: add new, remove old
                    maxSum = max(maxSum, windowSum)
                  return maxSum
                """,
                "arr[i] - arr[i-k]: add the element entering the window on the right, subtract the element leaving on the left. One operation per slide instead of k additions.",
                "Maximum average temperature over k consecutive days, peak network traffic in k-second windows."),

            example(2, "Longest Substring Without Repeating Characters",
                "Find the length of the longest substring with no duplicate characters.",
                """
                import java.util.Scanner;
                import java.util.HashMap;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        String s = sc.next();
                        HashMap<Character, Integer> lastSeen = new HashMap<>();
                        int left = 0, maxLen = 0;

                        for (int right = 0; right < s.length(); right++) {
                            char c = s.charAt(right);
                            if (lastSeen.containsKey(c) && lastSeen.get(c) >= left) {
                                left = lastSeen.get(c) + 1; // shrink: jump past last occurrence
                            }
                            lastSeen.put(c, right);
                            maxLen = Math.max(maxLen, right - left + 1);
                        }
                        System.out.println(maxLen);
                    }
                }
                """,
                """
                LONGEST_NO_REPEAT(s):
                  map = {}  (char -> last seen index)
                  left = 0, maxLen = 0
                  for right from 0 to len-1:
                    c = s[right]
                    if c in map and map[c] >= left:
                      left = map[c] + 1   // shrink window past last duplicate
                    map[c] = right
                    maxLen = max(maxLen, right - left + 1)
                  return maxLen
                """,
                "The map stores the LAST seen position of each character. When we see a duplicate, we jump left pointer to (last position + 1) — but only if that position is within the current window (>= left), otherwise the duplicate is outside our window and doesn't matter.",
                "Session token uniqueness checking, password validation, word uniqueness in text editors."),

            example(3, "Minimum Window Substring",
                "Find the smallest window in string s containing all characters of string t.",
                """
                import java.util.*;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        String s = sc.next(), t = sc.next();
                        Map<Character,Integer> need = new HashMap<>();
                        for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
                        int have = 0, required = need.size();
                        Map<Character,Integer> window = new HashMap<>();
                        int left = 0, minLen = Integer.MAX_VALUE, resL = 0, resR = 0;

                        for (int right = 0; right < s.length(); right++) {
                            char c = s.charAt(right);
                            window.merge(c, 1, Integer::sum);
                            if (need.containsKey(c) && window.get(c).equals(need.get(c))) have++;

                            while (have == required) { // window is valid — try to shrink
                                if (right - left + 1 < minLen) { minLen = right-left+1; resL=left; resR=right; }
                                char lc = s.charAt(left++);
                                window.merge(lc, -1, Integer::sum);
                                if (need.containsKey(lc) && window.get(lc) < need.get(lc)) have--;
                            }
                        }
                        System.out.println(minLen == Integer.MAX_VALUE ? "" : s.substring(resL, resR+1));
                    }
                }
                """,
                """
                MIN_WINDOW(s, t):
                  need = frequency map of t
                  have = 0, required = distinct chars in t
                  window = {}
                  left = 0, best = (infinity, 0, 0)
                  for right 0..len(s)-1:
                    add s[right] to window
                    if s[right] in need and window[s[right]]==need[s[right]]: have++
                    while have == required:
                      update best if smaller
                      remove s[left] from window; if freq drops below need: have--
                      left++
                  return best window
                """,
                "'have' tracks how many distinct characters in t are fully satisfied in the window. Only when have==required is the window valid and we try shrinking.",
                "Coverage testing (does this code path hit all required lines?), find minimum span of required keywords in a document.")
        );

        List<Problem> probs = List.of(
            problem(1, "Maximum Sum Subarray of Size K",
                "Find the maximum sum of any contiguous subarray of exactly k elements.",
                "First line: n k. Second line: n integers.",
                "Print the maximum sum.",
                "7 3\n2 1 5 1 3 2 4", "11",
                tcs(tc("7 3\n2 1 5 1 3 2 4","11"), tc("5 2\n1 4 2 10 23","33"), tc("4 1\n-1 -2 -3 -4","-1"), tc("5 5\n1 2 3 4 5","15")),
                "EASY", "Sliding Window", null,
                "Build the first window by summing first k elements. Then slide: add arr[i], subtract arr[i-k].",
                "windowSum = sum(arr[0..k-1]). For i=k to n-1: windowSum += arr[i] - arr[i-k]. Track maxSum.",
                "maxSum = first window sum. Slide: windowSum += arr[i] - arr[i-k]; maxSum = max(maxSum, windowSum).",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), k = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        // Sliding window of size k
                    }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc=new Scanner(System.in);
                        int n=sc.nextInt(),k=sc.nextInt(); int[] a=new int[n];
                        for(int i=0;i<n;i++)a[i]=sc.nextInt();
                        int ws=0;
                        for(int i=0;i<k;i++)ws+=a[i];
                        int max=ws;
                        for(int i=k;i<n;i++){ws+=a[i]-a[i-k];max=Math.max(max,ws);}
                        System.out.println(max);
                    }
                }
                """,
                "1 ≤ k ≤ n ≤ 10⁵ · -10⁴ ≤ arr[i] ≤ 10⁴",
                null, null),

            problem(2, "Longest Substring Without Repeating Characters",
                "Find the length of the longest substring with all unique characters.",
                "A single string.",
                "Print the length.",
                "abcabcbb", "3",
                tcs(tc("abcabcbb","3"), tc("bbbbb","1"), tc("pwwkew","3"), tc("a","1"), tc("dvdf","3")),
                "MEDIUM", "Sliding Window",
                "Use a HashMap to track the last seen index of each character.",
                "Expand right pointer. When a duplicate is found within the current window, move left pointer to just past the previous occurrence.",
                "map[c] stores last seen index. When arr[right] is already in window (map[c]>=left), set left=map[c]+1.",
                """
                import java.util.*;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        String s = sc.next();
                        // HashMap-based sliding window
                    }
                }
                """,
                """
                import java.util.*;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc=new Scanner(System.in);
                        String s=sc.next();
                        Map<Character,Integer> last=new HashMap<>();
                        int lo=0,max=0;
                        for(int hi=0;hi<s.length();hi++){
                            char c=s.charAt(hi);
                            if(last.containsKey(c)&&last.get(c)>=lo)lo=last.get(c)+1;
                            last.put(c,hi);
                            max=Math.max(max,hi-lo+1);
                        }
                        System.out.println(max);
                    }
                }
                """,
                "1 ≤ |s| ≤ 5×10⁴ · Only ASCII printable characters",
                null, null),

            problem(3, "Count Subarrays with Sum Exactly K",
                "Count the number of contiguous subarrays with sum equal to k.",
                "First line: n k. Second line: n integers.",
                "Print the count.",
                "5 3\n1 1 1 2 1", "4",
                tcs(tc("5 3\n1 1 1 2 1","4"), tc("3 0\n0 0 0","6"), tc("4 4\n1 2 3 4","2"), tc("3 7\n1 2 3","1")),
                "MEDIUM", "Prefix Sum + HashMap",
                "Sliding window doesn't directly work here because of negative numbers. Use prefix sum with a HashMap.",
                "prefixSum[i] - prefixSum[j] = k means subarray [j+1..i] has sum k. Count occurrences of (prefixSum - k) seen so far.",
                "Initialize map with {0:1}. For each element, compute runningSum. If (runningSum-k) is in map, add its count to answer. Then store runningSum in map.",
                """
                import java.util.*;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), k = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        // Prefix sum + HashMap approach
                    }
                }
                """,
                """
                import java.util.*;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc=new Scanner(System.in);
                        int n=sc.nextInt(),k=sc.nextInt(); int[] a=new int[n];
                        for(int i=0;i<n;i++)a[i]=sc.nextInt();
                        Map<Integer,Integer> map=new HashMap<>();
                        map.put(0,1);
                        int sum=0,count=0;
                        for(int x:a){sum+=x;count+=map.getOrDefault(sum-k,0);map.merge(sum,1,Integer::sum);}
                        System.out.println(count);
                    }
                }
                """,
                "1 ≤ n ≤ 2×10⁴ · -10³ ≤ arr[i] ≤ 10³ · -10⁷ ≤ k ≤ 10⁷",
                null, null),

            problem(4, "Minimum Size Subarray Sum",
                "Find the minimum length of a contiguous subarray with sum >= target. Return 0 if no such subarray exists.",
                "First line: n target. Second line: n positive integers.",
                "Print the minimum length, or 0.",
                "5 7\n2 3 1 2 4", "2",
                tcs(tc("5 7\n2 3 1 2 4","2"), tc("4 15\n1 2 3 4","0"), tc("5 11\n1 2 3 4 5","3"), tc("3 3\n3 4 5","1")),
                "MEDIUM", "Sliding Window",
                "Variable-size sliding window: expand right until sum>=target, then shrink left to minimize length.",
                "sum=0, left=0, minLen=INT_MAX. For each right, sum+=arr[right]. While sum>=target: update minLen=min(minLen, right-left+1), sum-=arr[left], left++.",
                "Expand right first, then shrink left greedily while constraint holds.",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), target = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        // Variable-size sliding window
                    }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc=new Scanner(System.in);
                        int n=sc.nextInt(),target=sc.nextInt(); int[] a=new int[n];
                        for(int i=0;i<n;i++)a[i]=sc.nextInt();
                        int lo=0,sum=0,min=Integer.MAX_VALUE;
                        for(int hi=0;hi<n;hi++){
                            sum+=a[hi];
                            while(sum>=target){min=Math.min(min,hi-lo+1);sum-=a[lo++];}
                        }
                        System.out.println(min==Integer.MAX_VALUE?0:min);
                    }
                }
                """,
                "1 ≤ n ≤ 10⁵ · 1 ≤ arr[i] ≤ 10⁴ · 1 ≤ target ≤ 10⁹",
                null, null),

            problem(5, "Longest Subarray with At Most K Zeros",
                "Find the length of the longest subarray containing at most k zeros.",
                "First line: n k. Second line: n binary integers (0 or 1).",
                "Print the length.",
                "7 2\n1 1 0 0 1 1 1", "7",
                tcs(tc("7 2\n1 1 0 0 1 1 1","7"), tc("5 0\n0 1 0 0 1","1"), tc("4 1\n0 0 0 0","1"), tc("6 1\n1 0 1 1 0 1","4")),
                "EASY", "Sliding Window", null,
                "Track the number of zeros in the current window. When zeros > k, shrink from left.",
                "zeros=0, lo=0. For each hi: if arr[hi]==0, zeros++. While zeros>k: if arr[lo]==0, zeros--. lo++. maxLen=max(maxLen, hi-lo+1).",
                "zeros=0, lo=0, maxLen=0. Expand hi. If arr[hi]==0: zeros++. While zeros>k: if arr[lo]==0 zeros--; lo++. maxLen=max(maxLen,hi-lo+1).",
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);
                        int n = sc.nextInt(), k = sc.nextInt();
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
                        // Sliding window with zero count
                    }
                }
                """,
                """
                import java.util.Scanner;
                public class Main {
                    public static void main(String[] args) {
                        Scanner sc=new Scanner(System.in);
                        int n=sc.nextInt(),k=sc.nextInt(); int[] a=new int[n];
                        for(int i=0;i<n;i++)a[i]=sc.nextInt();
                        int lo=0,zeros=0,max=0;
                        for(int hi=0;hi<n;hi++){
                            if(a[hi]==0)zeros++;
                            while(zeros>k){if(a[lo]==0)zeros--;lo++;}
                            max=Math.max(max,hi-lo+1);
                        }
                        System.out.println(max);
                    }
                }
                """,
                "1 ≤ n ≤ 10⁵ · 0 ≤ k ≤ n · arr[i] ∈ {0,1}",
                null, null)
        );
        return new TopicData(t, exs, probs);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    private Example example(int order, String title, String desc, String code,
                            String pseudo, String explanation, String realWorld) {
        Example e = new Example();
        e.setDisplayOrder(order);
        e.setTitle(title);
        e.setDescription(desc);
        e.setCode(code.strip());
        e.setPseudocode(pseudo.strip());
        e.setExplanation(explanation);
        e.setRealWorldUse(realWorld);
        return e;
    }

    // Overload: 2 text hints (hint1 + hint2) + algorithm pseudocode block
    private Problem problem(int order, String title, String desc,
                            String inputFmt, String outputFmt,
                            String sampleIn, String sampleOut,
                            List<String[]> testCases,
                            String difficulty, String pattern,
                            String hint1, String hint2,
                            String algorithmSteps,
                            String starterCode, String solutionCode,
                            String constraints, String bruteForce, String optimizedApproach) {
        return problem(order, title, desc, inputFmt, outputFmt, sampleIn, sampleOut,
                testCases, difficulty, pattern, hint1, hint2, null, algorithmSteps,
                starterCode, solutionCode, constraints, bruteForce, optimizedApproach);
    }

    // hint3 = brief text hint, algorithmSteps = pseudocode/step-by-step approach (stored as hint3)
    private Problem problem(int order, String title, String desc,
                            String inputFmt, String outputFmt,
                            String sampleIn, String sampleOut,
                            List<String[]> testCases,
                            String difficulty, String pattern,
                            String hint1, String hint2, String hint3,
                            String algorithmSteps,
                            String starterCode, String solutionCode,
                            String constraints, String bruteForce, String optimizedApproach) {
        Problem p = new Problem();
        p.setDisplayOrder(order);
        p.setTitle(title);
        p.setDescription(desc);
        p.setInputFormat(inputFmt);
        p.setOutputFormat(outputFmt);
        p.setSampleInput(sampleIn);
        p.setSampleOutput(sampleOut);
        List<Map<String,String>> tests = new ArrayList<>();
        for (String[] tc : testCases) {
            tests.add(Map.of("input", tc[0], "expectedOutput", tc[1]));
        }
        try { p.setTestCases(mapper.writeValueAsString(tests)); } catch (Exception ex) { /* ignore */ }
        try { p.setDifficulty(Problem.Difficulty.valueOf(difficulty)); } catch (Exception ex) { p.setDifficulty(Problem.Difficulty.MEDIUM); }
        p.setPattern(pattern);
        p.setHint1(hint1);
        p.setHint2(hint2);
        // Combine brief hint3 text + detailed algorithm steps for maximum hint value
        String fullHint3 = (hint3 != null && algorithmSteps != null)
                ? hint3 + "\n\n" + algorithmSteps.strip()
                : (algorithmSteps != null ? algorithmSteps.strip() : hint3);
        p.setHint3(fullHint3);
        p.setStarterCode(starterCode != null ? starterCode.strip() : null);
        p.setSolutionCode(solutionCode != null ? solutionCode.strip() : null);
        p.setConstraints(constraints);
        p.setBruteForce(bruteForce);
        p.setOptimizedApproach(optimizedApproach);
        return p;
    }

    private String[] tc(String input, String output) {
        return new String[]{input, output};
    }

    @SafeVarargs
    private static <T> List<T> tcs(T... items) {
        return List.of(items);
    }

    private static class TopicData {
        final Topic         topic;
        final List<Example> examples;
        final List<Problem> problems;
        TopicData(Topic t, List<Example> e, List<Problem> p) { topic=t; examples=e; problems=p; }
    }
}
