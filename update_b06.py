import json

f = 'C:/Dev/devlearner/devlearner/learning-system/src/main/resources/seeds/B06-arrays.json'
with open(f, encoding='utf-8') as fh:
    data = json.load(fh)

improvements = {
    1: {
        "description": "Given an array of integers `nums` and an integer `target`, return **indices** of the two numbers that add up to `target`. Assume exactly one valid answer exists, and you may not use the same element twice.\n\n**Example 1:**\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: nums[0] + nums[1] = 2 + 7 = 9.\n\n**Example 2:**\nInput: nums = [3,2,4], target = 6\nOutput: [1,2]",
        "sampleInput": "4\n2 7 11 15\n9",
        "sampleOutput": "[0, 1]"
    },
    2: {
        "description": "Given an array of integers, return both the minimum and maximum values in a **single pass**. Return as `int[] {min, max}`.\n\n**Example 1:**\nInput: [3,1,4,1,5,9,2,6]\nOutput: [1,9]\nExplanation: Minimum is 1, maximum is 9.\n\n**Example 2:**\nInput: [-5,-1,-8,-3]\nOutput: [-8,-1]",
        "sampleInput": "[3,1,4,1,5,9,2,6]",
        "sampleOutput": "[1,9]"
    },
    3: {
        "description": "Given an integer array `nums`, rotate the array to the **right** by `k` steps **in-place**.\n\n**Example 1:**\nInput: nums = [1,2,3,4,5,6,7], k = 3\nOutput: [5,6,7,1,2,3,4]\nExplanation: Rotate right 3 steps — the last 3 elements wrap to the front.\n\n**Example 2:**\nInput: nums = [1,2,3], k = 4\nOutput: [3,1,2]\nExplanation: k=4 mod 3=1 effective rotation.",
        "sampleInput": "nums=[1,2,3,4,5,6,7], k=3",
        "sampleOutput": "[5,6,7,1,2,3,4]"
    },
    4: {
        "description": "Given a **sorted** integer array, remove duplicates **in-place** so each unique element appears exactly once. Return the new length. The relative order must be preserved.\n\n**Example 1:**\nInput: [1,1,2]\nOutput: 2 (first two elements become [1,2])\n\n**Example 2:**\nInput: [0,0,1,1,1,2,2,3,3,4]\nOutput: 5 (first five elements become [0,1,2,3,4])",
        "sampleInput": "[1,1,2]",
        "sampleOutput": "2"
    },
    5: {
        "description": "Find the **second largest distinct** element in an array. Return -1 if no such element exists (all elements are equal, or only one element).\n\n**Example 1:**\nInput: [3,1,4,1,5,9,2,6]\nOutput: 6\n\n**Example 2:**\nInput: [5,5,5]\nOutput: -1\nExplanation: All elements are equal — no distinct second largest exists.",
        "sampleInput": "[3,1,4,1,5,9,2,6]",
        "sampleOutput": "6"
    },
    6: {
        "description": "Given a zero-based row index `rowIndex`, return the nth row of **Pascal's Triangle** as a list. Each element equals the sum of the two elements directly above it in the previous row.\n\n**Example 1:**\nInput: rowIndex = 3\nOutput: [1,3,3,1]\n\n**Example 2:**\nInput: rowIndex = 4\nOutput: [1,4,6,4,1]\nExplanation: Row 4 values: 1, 4=1+3, 6=3+3, 4=3+1, 1.",
        "sampleInput": "3",
        "sampleOutput": "[1,3,3,1]"
    },
    7: {
        "description": "Given an integer array `nums`, find the contiguous subarray with the **largest product** and return that product. The array can contain negative numbers and zeros.\n\n**Example 1:**\nInput: [2,3,-2,4]\nOutput: 6\nExplanation: Subarray [2,3] has the largest product = 6.\n\n**Example 2:**\nInput: [-2,3,-4]\nOutput: 24\nExplanation: The entire array: (-2) * 3 * (-4) = 24 (two negatives flip to positive).",
        "sampleInput": "[2,3,-2,4]",
        "sampleOutput": "6"
    },
    8: {
        "description": "Merge two sorted arrays `nums1` and `nums2` into `nums1` **in-place**. `nums1` has length `m + n`; the last `n` positions are zero-padded placeholders for the merged elements.\n\n**Example 1:**\nInput: nums1 = [1,2,3,0,0,0] m=3, nums2 = [2,5,6] n=3\nOutput: [1,2,2,3,5,6]\n\n**Example 2:**\nInput: nums1 = [0] m=0, nums2 = [1] n=1\nOutput: [1]\nExplanation: nums1 is empty; copy nums2 directly.",
        "sampleInput": "nums1=[1,2,3,0,0,0] m=3, nums2=[2,5,6] n=3",
        "sampleOutput": "[1,2,2,3,5,6]"
    },
    9: {
        "description": "Given an integer array `nums` and integer `k`, return the **total count** of contiguous subarrays whose elements sum to exactly `k`. The array may contain negative numbers.\n\n**Example 1:**\nInput: nums = [1,1,1], k = 2\nOutput: 2\nExplanation: [nums[0..1]] and [nums[1..2]] both sum to 2.\n\n**Example 2:**\nInput: nums = [1,2,3], k = 3\nOutput: 2\nExplanation: Subarrays [3] and [1,2] both equal 3.",
        "sampleInput": "nums=[1,1,1], k=2",
        "sampleOutput": "2"
    },
    10: {
        "description": "Given an array `nums` of `n + 1` integers where each integer is in the range `[1, n]`, find the **one duplicate number**. Use **O(1) extra space** — no sorting, HashSet, or modifying the array allowed.\n\n**Example 1:**\nInput: [1,3,4,2,2]\nOutput: 2\n\n**Example 2:**\nInput: [3,1,3,4,2]\nOutput: 3\nExplanation: Treat array values as next-pointers and use Floyd's cycle detection.",
        "sampleInput": "[1,3,4,2,2]",
        "sampleOutput": "2"
    },
    11: {
        "description": "Given `n` non-negative integers representing heights of vertical lines, find two lines that together with the x-axis form a container holding the **most water**. Return the maximum water volume.\n\n**Example 1:**\nInput: height = [1,8,6,2,5,4,8,3,7]\nOutput: 49\nExplanation: Lines at index 1 (h=8) and index 8 (h=7): water = min(8,7) * (8-1) = 49.\n\n**Example 2:**\nInput: height = [1,1]\nOutput: 1",
        "sampleInput": "[1,8,6,2,5,4,8,3,7]",
        "sampleOutput": "49"
    },
    12: {
        "description": "Given `n` non-negative integers representing an elevation map where each bar has width 1, compute how much water can be **trapped** between the bars after raining.\n\n**Example 1:**\nInput: height = [0,1,0,2,1,0,1,3,2,1,2,1]\nOutput: 6\nExplanation: 6 units of water are trapped in the valleys between taller bars.\n\n**Example 2:**\nInput: height = [4,2,0,3,2,5]\nOutput: 9",
        "sampleInput": "[0,1,0,2,1,0,1,3,2,1,2,1]",
        "sampleOutput": "6"
    },
    13: {
        "description": "Given an array of bar heights representing a histogram (each bar has width 1), find the area of the **largest rectangle** that fits entirely within the histogram.\n\n**Example 1:**\nInput: heights = [2,1,5,6,2,3]\nOutput: 10\nExplanation: The rectangle spanning bars of height 5 and 6 (width=2) gives area = 5 * 2 = 10.\n\n**Example 2:**\nInput: heights = [6,7,5,2,4,5,9,3]\nOutput: 16",
        "sampleInput": "[2,1,5,6,2,3]",
        "sampleOutput": "10"
    },
    14: {
        "description": "Given two sorted arrays `nums1` and `nums2`, return the **median** of the two sorted arrays combined. The overall runtime complexity must be **O(log(m + n))**.\n\n**Example 1:**\nInput: nums1 = [1,3], nums2 = [2]\nOutput: 2.0\nExplanation: Merged array is [1,2,3]; median = 2.\n\n**Example 2:**\nInput: nums1 = [1,2], nums2 = [3,4]\nOutput: 2.5\nExplanation: Merged array is [1,2,3,4]; median = (2+3)/2 = 2.5.",
        "sampleInput": "nums1=[1,3], nums2=[2]",
        "sampleOutput": "2.0"
    },
    15: {
        "description": "Given an array containing only `0`s (red), `1`s (white), and `2`s (blue), sort them **in-place** in a single pass without using a library sort. All 0s first, then 1s, then 2s.\n\n**Example 1:**\nInput: [2,0,2,1,1,0]\nOutput: [0,0,1,1,2,2]\n\n**Example 2:**\nInput: [2,0,1]\nOutput: [0,1,2]\nExplanation: Dijkstra's Dutch National Flag algorithm — three-pointer partition in O(n) time, O(1) space.",
        "sampleInput": "[2,0,2,1,1,0]",
        "sampleOutput": "[0,0,1,1,2,2]"
    },
    16: {
        "description": "Given an array of positive integers `nums` and a positive integer `target`, find the **minimum length** contiguous subarray whose sum is >= `target`. Return 0 if no such subarray exists.\n\n**Example 1:**\nInput: target = 7, nums = [2,3,1,2,4,3]\nOutput: 2\nExplanation: Subarray [4,3] has sum 7 and is the shortest valid window.\n\n**Example 2:**\nInput: target = 11, nums = [1,1,1,1,1]\nOutput: 0\nExplanation: Total array sum is 5 < 11; no valid subarray exists.",
        "sampleInput": "target=7, nums=[2,3,1,2,4,3]",
        "sampleOutput": "2"
    },
    17: {
        "description": "Rearrange `nums` **in-place** to the next **lexicographically greater permutation**. If the array is already the largest permutation (fully descending), rearrange to the smallest (ascending). Use O(1) extra space.\n\n**Example 1:**\nInput: [1,2,3] => Output: [1,3,2]\n\n**Example 2:**\nInput: [3,2,1] => Output: [1,2,3]\nExplanation: Already the last permutation — wrap around to the first.\n\n**Example 3:**\nInput: [1,3,2] => Output: [2,1,3]",
        "sampleInput": "[1,2,3]",
        "sampleOutput": "[1,3,2]"
    },
    18: {
        "description": "Given an integer array `nums`, return the length of the **longest strictly increasing subsequence**. Elements do not need to be contiguous. Solve in **O(n log n)**.\n\n**Example 1:**\nInput: [10,9,2,5,3,7,101,18]\nOutput: 4\nExplanation: One LIS is [2,3,7,101] or [2,5,7,101] — length 4.\n\n**Example 2:**\nInput: [7,7,7,7,7]\nOutput: 1\nExplanation: All equal — only a single-element subsequence is strictly increasing.",
        "sampleInput": "[10,9,2,5,3,7,101,18]",
        "sampleOutput": "4"
    },
    19: {
        "description": "Given an unsorted integer array `nums`, find the **maximum difference** between successive elements in its sorted form. Return 0 if fewer than 2 elements. Must run in **O(n)** time — comparison-based sort not allowed.\n\n**Example 1:**\nInput: [3,6,9,1]\nOutput: 3\nExplanation: Sorted: [1,3,6,9]; all successive gaps are 3.\n\n**Example 2:**\nInput: [1,3,5,9,23]\nOutput: 14\nExplanation: Sorted: [1,3,5,9,23]; the gap 9->23 is the largest at 14.",
        "sampleInput": "[3,6,9,1]",
        "sampleOutput": "3"
    },
    20: {
        "description": "Given an integer array `nums` and two integers `lower` and `upper`, return the number of **range sums** whose value lies in `[lower, upper]` inclusive. A range sum is the sum of any contiguous subarray.\n\n**Example 1:**\nInput: nums = [-2,5,-1], lower = -2, upper = 2\nOutput: 3\nExplanation: Valid subarrays: [-2] (sum=-2), [-1] (sum=-1), and [-2,5,-1] (sum=2).\n\n**Example 2:**\nInput: nums = [0], lower = 0, upper = 0\nOutput: 1",
        "sampleInput": "nums=[-2,5,-1], lower=-2, upper=2",
        "sampleOutput": "3"
    },
}

for topic in data['topics']:
    for p in topic.get('problems', []):
        order = p['displayOrder']
        if order in improvements:
            imp = improvements[order]
            p['description'] = imp['description']
            p['sampleInput'] = imp['sampleInput']
            p['sampleOutput'] = imp['sampleOutput']

with open(f, 'w', encoding='utf-8') as fh:
    json.dump(data, fh, indent=2, ensure_ascii=False)
print("B06 updated successfully")
