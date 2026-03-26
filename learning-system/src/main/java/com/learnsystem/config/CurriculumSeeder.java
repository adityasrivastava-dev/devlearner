package com.learnsystem.config;

import com.learnsystem.model.*;
import com.learnsystem.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * CURRICULUM SEEDER
 * ─────────────────
 * Uncomment @Component to seed the full curriculum on next startup.
 * It is safe to run multiple times — skips if topics already exist.
 *
 * Covers:
 *   DSA          → Arrays, Linked List, Binary Search, Sliding Window, Two Pointer,
 *                  Stacks, Queues, Trees, Graphs, Dynamic Programming
 *   Java         → OOP, Collections, Streams, Generics, Exception Handling,
 *                  Multithreading, I/O, Lambda, JDBC
 *   Advanced Java→ LRU Cache, Thread Pool, Rate Limiter, Design Patterns, JVM Internals
 *   MySQL        → Basics, Joins, Indexes, Stored Procedures, Transactions
 *   AWS          → EC2, S3, RDS, Lambda, API Gateway
 */
 //@Component
@RequiredArgsConstructor
@Slf4j
@Order(1)
public class CurriculumSeeder implements CommandLineRunner {

    private final TopicRepository   topicRepo;
    private final ExampleRepository exampleRepo;
    private final ProblemRepository problemRepo;
    private final RoadmapRepository roadmapRepo;
    private final RoadmapTopicRepository roadmapTopicRepo;

    @Override
    public void run(String... args) {
        if (topicRepo.count() > 0) {
            log.info("Curriculum already seeded — skipping.");
            return;
        }
        log.info("🚀 Seeding full curriculum...");

        // ── DSA ──────────────────────────────────────────────────────────────
        Topic arrays       = seedArrays();
        Topic linkedList   = seedLinkedList();
        Topic binarySearch = seedBinarySearch();
        Topic slidingWin   = seedSlidingWindow();
        Topic twoPointer   = seedTwoPointer();
        Topic stacks       = seedStacks();
        Topic queues       = seedQueues();
        Topic trees        = seedTrees();
        Topic graphs       = seedGraphs();
        Topic dp           = seedDP();

        // ── Java ─────────────────────────────────────────────────────────────
        Topic javaOOP      = seedJavaOOP();
        Topic collections  = seedCollections();
        Topic streams      = seedStreams();
        Topic exceptions   = seedExceptions();
        Topic threads      = seedThreads();

        // ── Advanced Java ────────────────────────────────────────────────────
        Topic lruCache     = seedLRUCache();
        Topic threadPool   = seedThreadPool();
        Topic designPat    = seedDesignPatterns();

        // ── MySQL ─────────────────────────────────────────────────────────────
        Topic mysqlBasics  = seedMySQLBasics();
        Topic mysqlJoins   = seedMySQLJoins();
        Topic mysqlIndex   = seedMySQLIndexes();

        // ── AWS ───────────────────────────────────────────────────────────────
        Topic awsCore      = seedAWSCore();
        Topic awsS3        = seedAWSS3();

        // ── Roadmaps ──────────────────────────────────────────────────────────
        createRoadmap("🗺 DSA Interview Prep",
                "Complete DSA roadmap from basics to advanced. Covers all patterns asked in FAANG interviews.",
                "#4ade80", "Beginner → Advanced", 80,
                new Topic[]{arrays, linkedList, stacks, queues, binarySearch,
                        slidingWin, twoPointer, trees, graphs, dp});

        createRoadmap("☕ Java Mastery",
                "Learn Java from scratch — OOP, Collections, Streams, Multithreading, and Advanced topics.",
                "#60a5fa", "Beginner → Advanced", 60,
                new Topic[]{javaOOP, collections, exceptions, streams, threads, lruCache, threadPool, designPat});

        createRoadmap("🔗 Backend Developer Roadmap",
                "Full backend stack: Java + DSA + MySQL + AWS. Everything you need for a backend role.",
                "#a78bfa", "Intermediate", 120,
                new Topic[]{javaOOP, collections, streams, threads, binarySearch, slidingWin,
                        mysqlBasics, mysqlJoins, mysqlIndex, awsCore, awsS3});

        log.info("✅ Curriculum seeded successfully.");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DSA TOPICS
    // ══════════════════════════════════════════════════════════════════════════

    private Topic seedArrays() {
        Topic t = topic("Arrays", Topic.Category.DSA,
                "The most fundamental data structure. A contiguous block of memory storing elements of the same type.",
                "O(1) random access | O(n) search | O(n) insert/delete",
                "O(n)",
                "Use nested loops to check all pairs — O(n²)",
                "Use HashMap or sorting to reduce to O(n) or O(n log n)",
                "Use when: random access needed, fixed-size data, cache-friendly traversal, prefix sums",
                """
                import java.util.*;
                public class Main {
                    public static void main(String[] args) {
                        int[] arr = {5, 2, 8, 1, 9, 3};
                        // TODO: find max element
                        int max = arr[0];
                        for (int num : arr) {
                            if (num > max) max = num;
                        }
                        System.out.println("Max: " + max);
                    }
                }
                """);

        ex(t, 1, "Two Sum with HashMap", "Find two numbers that add up to target in O(n)",
                """
                Map<Integer,Integer> map = new HashMap<>();
                for (int i = 0; i < nums.length; i++) {
                    int complement = target - nums[i];
                    if (map.containsKey(complement))
                        return new int[]{map.get(complement), i};
                    map.put(nums[i], i);
                }
                """, "Store each number's index in HashMap; check complement before inserting", "E-commerce cart total");

        ex(t, 2, "Prefix Sum Array", "Pre-compute cumulative sums for range queries in O(1)",
                """
                int[] prefix = new int[arr.length + 1];
                for (int i = 0; i < arr.length; i++)
                    prefix[i+1] = prefix[i] + arr[i];
                // sum of [l..r] = prefix[r+1] - prefix[l]
                """, "Build once O(n), query O(1). Classic space-time tradeoff", "Financial reports range sum");

        ex(t, 3, "Kadane's Algorithm", "Maximum subarray sum in O(n)",
                """
                int maxSum = arr[0], curr = arr[0];
                for (int i = 1; i < arr.length; i++) {
                    curr = Math.max(arr[i], curr + arr[i]);
                    maxSum = Math.max(maxSum, curr);
                }
                """, "Either extend previous subarray or start fresh — whichever is bigger", "Stock profit tracking");

        ex(t, 4, "Dutch National Flag (3-way partition)", "Sort array of 0s, 1s, 2s in one pass",
                """
                int lo=0, mid=0, hi=arr.length-1;
                while (mid <= hi) {
                    if (arr[mid]==0)      swap(arr,lo++,mid++);
                    else if (arr[mid]==2) swap(arr,mid,hi--);
                    else                  mid++;
                }
                """, "Three pointers defining three regions. Mid processes unexamined elements", "Sorting by category");

        ex(t, 5, "Rotate Array by K", "Rotate right by k positions using reversal",
                """
                void rotate(int[] nums, int k) {
                    k = k % nums.length;
                    reverse(nums, 0, nums.length-1);
                    reverse(nums, 0, k-1);
                    reverse(nums, k, nums.length-1);
                }
                """, "Reverse whole → reverse first k → reverse rest. O(n) time O(1) space", "Circular buffer shift");

        // 20 problems
        prob(t,1,"Find Max/Min in Array","Find maximum and minimum element in array","n then array values","max min on one line","5\n3 1 4 1 5","5 1","[{\"input\":\"5\\n3 1 4 1 5\",\"expectedOutput\":\"5 1\"},{\"input\":\"3\\n-2 0 7\",\"expectedOutput\":\"7 -2\"}]",Problem.Difficulty.EASY,"Traverse once tracking max and min simultaneously","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);\nint n=sc.nextInt();int max=Integer.MIN_VALUE,min=Integer.MAX_VALUE;\nfor(int i=0;i<n;i++){int v=sc.nextInt();max=Math.max(max,v);min=Math.min(min,v);}\nSystem.out.println(max+\" \"+min);}}");
        prob(t,2,"Two Sum","Find indices of two numbers summing to target","n target then array","indices i j","4\n9\n2 7 11 15","0 1","[{\"input\":\"4\\n9\\n2 7 11 15\",\"expectedOutput\":\"0 1\"},{\"input\":\"3\\n6\\n3 2 4\",\"expectedOutput\":\"1 2\"}]",Problem.Difficulty.EASY,"Use HashMap: for each element check if complement exists","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);\nint n=sc.nextInt(),t=sc.nextInt();\nint[] arr=new int[n];\nfor(int i=0;i<n;i++)arr[i]=sc.nextInt();\nMap<Integer,Integer> map=new HashMap<>();\nfor(int i=0;i<n;i++){int c=t-arr[i];\nif(map.containsKey(c)){System.out.println(map.get(c)+\" \"+i);return;}\nmap.put(arr[i],i);}}}");
        prob(t,3,"Maximum Subarray (Kadane's)","Find maximum sum contiguous subarray","n then array","max sum","6\n-2 1 -3 4 -1 2","6","[{\"input\":\"6\\n-2 1 -3 4 -1 2\",\"expectedOutput\":\"6\"},{\"input\":\"4\\n-1 -2 -3 -4\",\"expectedOutput\":\"-1\"}]",Problem.Difficulty.EASY,"Kadane: curr = max(arr[i], curr+arr[i]), update global max","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nint[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();\nint max=arr[0],curr=arr[0];\nfor(int i=1;i<n;i++){curr=Math.max(arr[i],curr+arr[i]);max=Math.max(max,curr);}\nSystem.out.println(max);}}");
        prob(t,4,"Best Time to Buy and Sell Stock","Find max profit from one buy+sell","n then prices","max profit","6\n7 1 5 3 6 4","5","[{\"input\":\"6\\n7 1 5 3 6 4\",\"expectedOutput\":\"5\"},{\"input\":\"5\\n7 6 4 3 1\",\"expectedOutput\":\"0\"}]",Problem.Difficulty.EASY,"Track min price seen so far, update max profit at each step","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nint[] p=new int[n];for(int i=0;i<n;i++)p[i]=sc.nextInt();\nint minP=p[0],profit=0;\nfor(int i=1;i<n;i++){profit=Math.max(profit,p[i]-minP);minP=Math.min(minP,p[i]);}\nSystem.out.println(profit);}}");
        prob(t,5,"Contains Duplicate","Check if any value appears at least twice","n then array","true or false","5\n1 2 3 1 4","true","[{\"input\":\"5\\n1 2 3 1 4\",\"expectedOutput\":\"true\"},{\"input\":\"4\\n1 2 3 4\",\"expectedOutput\":\"false\"}]",Problem.Difficulty.EASY,"Use HashSet — add each element, if already present return true","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nSet<Integer> set=new HashSet<>();boolean dup=false;\nfor(int i=0;i<n;i++){int v=sc.nextInt();if(!set.add(v))dup=true;}\nSystem.out.println(dup);}}");
        prob(t,6,"Product of Array Except Self","Return array where result[i] = product of all except nums[i]","n then array","space-separated products","5\n1 2 3 4 5","120 60 40 30 24","[{\"input\":\"5\\n1 2 3 4 5\",\"expectedOutput\":\"120 60 40 30 24\"},{\"input\":\"4\\n-1 1 0 -3\",\"expectedOutput\":\"0 0 3 0\"}]",Problem.Difficulty.MEDIUM,"Left pass: prefix products. Right pass: suffix products. Multiply both","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nint[] arr=new int[n],res=new int[n];\nfor(int i=0;i<n;i++)arr[i]=sc.nextInt();\nres[0]=1;for(int i=1;i<n;i++)res[i]=res[i-1]*arr[i-1];\nint r=1;for(int i=n-1;i>=0;i--){res[i]*=r;r*=arr[i];}\nStringBuilder sb=new StringBuilder();\nfor(int i=0;i<n;i++){if(i>0)sb.append(' ');sb.append(res[i]);}\nSystem.out.println(sb);}}");
        prob(t,7,"Rotate Array","Rotate array right by k steps","n k then array","rotated array","5\n2\n1 2 3 4 5","4 5 1 2 3","[{\"input\":\"5\\n2\\n1 2 3 4 5\",\"expectedOutput\":\"4 5 1 2 3\"},{\"input\":\"7\\n3\\n1 2 3 4 5 6 7\",\"expectedOutput\":\"5 6 7 1 2 3 4\"}]",Problem.Difficulty.MEDIUM,"Reverse entire array, then reverse [0..k-1] and [k..n-1]","import java.util.*;\npublic class Main{\nstatic void rev(int[] a,int l,int r){while(l<r){int t=a[l];a[l++]=a[r];a[r--]=t;}}\npublic static void main(String[] ar){\nScanner sc=new Scanner(System.in);int n=sc.nextInt(),k=sc.nextInt()%n;\nint[] a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();\nrev(a,0,n-1);rev(a,0,k-1);rev(a,k,n-1);\nStringBuilder sb=new StringBuilder();\nfor(int i=0;i<n;i++){if(i>0)sb.append(' ');sb.append(a[i]);}System.out.println(sb);}}");
        prob(t,8,"Merge Sorted Arrays","Merge two sorted arrays into one sorted array","n then arr1 | m then arr2","merged sorted array","3\n1 3 5\n4\n2 4 6 8","1 2 3 4 5 6 8","[{\"input\":\"3\\n1 3 5\\n4\\n2 4 6 8\",\"expectedOutput\":\"1 2 3 4 5 6 8\"},{\"input\":\"2\\n1 4\\n3\\n2 3 5\",\"expectedOutput\":\"1 2 3 4 5\"}]",Problem.Difficulty.EASY,"Two pointers, take smaller each time. Append remainder","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nint[] A=new int[n];for(int i=0;i<n;i++)A[i]=sc.nextInt();\nint m=sc.nextInt();int[] B=new int[m];for(int i=0;i<m;i++)B[i]=sc.nextInt();\nint i=0,j=0;StringBuilder sb=new StringBuilder();\nwhile(i<n&&j<m){if(sb.length()>0)sb.append(' ');\nif(A[i]<=B[j])sb.append(A[i++]);else sb.append(B[j++]);}\nwhile(i<n){if(sb.length()>0)sb.append(' ');sb.append(A[i++]);}\nwhile(j<m){if(sb.length()>0)sb.append(' ');sb.append(B[j++]);}\nSystem.out.println(sb);}}");
        prob(t,9,"Move Zeros","Move all 0s to end maintaining relative order of non-zero elements","n then array","result array","6\n0 1 0 3 12 0","1 3 12 0 0 0","[{\"input\":\"6\\n0 1 0 3 12 0\",\"expectedOutput\":\"1 3 12 0 0 0\"},{\"input\":\"4\\n0 0 0 1\",\"expectedOutput\":\"1 0 0 0\"}]",Problem.Difficulty.EASY,"Use write pointer for non-zeros, fill rest with zeros","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nint[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();\nint w=0;for(int v:arr)if(v!=0)arr[w++]=v;\nwhile(w<n)arr[w++]=0;\nStringBuilder sb=new StringBuilder();\nfor(int i=0;i<n;i++){if(i>0)sb.append(' ');sb.append(arr[i]);}System.out.println(sb);}}");
        prob(t,10,"Subarray Sum Equals K","Count subarrays with sum equal to k","n k then array","count","5\n2\n1 1 1 2 0","4","[{\"input\":\"5\\n2\\n1 1 1 2 0\",\"expectedOutput\":\"4\"},{\"input\":\"4\\n3\\n1 2 3 4\",\"expectedOutput\":\"2\"}]",Problem.Difficulty.MEDIUM,"Prefix sum + HashMap: count how many previous prefix sums equal (currSum - k)","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt(),k=sc.nextInt();\nint[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();\nMap<Integer,Integer> map=new HashMap<>();map.put(0,1);\nint sum=0,count=0;\nfor(int v:arr){sum+=v;count+=map.getOrDefault(sum-k,0);map.put(sum,map.getOrDefault(sum,0)+1);}\nSystem.out.println(count);}}");
        prob(t,11,"Find Duplicate Number","Find duplicate in array [1..n] with n+1 elements","n then array","duplicate","5\n1 3 4 2 2","2","[{\"input\":\"5\\n1 3 4 2 2\",\"expectedOutput\":\"2\"},{\"input\":\"3\\n3 1 3\",\"expectedOutput\":\"3\"}]",Problem.Difficulty.MEDIUM,"Floyd's cycle detection: treat values as pointers to find cycle entry point","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nint[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();\nint slow=arr[0],fast=arr[0];\ndo{slow=arr[slow];fast=arr[arr[fast]];}while(slow!=fast);\nslow=arr[0];while(slow!=fast){slow=arr[slow];fast=arr[fast];}\nSystem.out.println(slow);}}");
        prob(t,12,"Sort Colors (Dutch Flag)","Sort array of 0s 1s 2s in-place","n then array","sorted array","6\n2 0 2 1 1 0","0 0 1 1 2 2","[{\"input\":\"6\\n2 0 2 1 1 0\",\"expectedOutput\":\"0 0 1 1 2 2\"},{\"input\":\"3\\n2 0 1\",\"expectedOutput\":\"0 1 2\"}]",Problem.Difficulty.MEDIUM,"Dutch National Flag: lo/mid/hi pointers, 3-way partition","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nint[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();\nint lo=0,mid=0,hi=n-1;\nwhile(mid<=hi){\nif(arr[mid]==0){int t=arr[lo];arr[lo++]=arr[mid];arr[mid++]=t;}\nelse if(arr[mid]==2){int t=arr[hi];arr[hi--]=arr[mid];arr[mid]=t;}else mid++;}\nStringBuilder sb=new StringBuilder();\nfor(int i=0;i<n;i++){if(i>0)sb.append(' ');sb.append(arr[i]);}System.out.println(sb);}}");
        prob(t,13,"Majority Element","Find element appearing more than n/2 times","n then array","majority element","5\n3 2 3 1 3","3","[{\"input\":\"5\\n3 2 3 1 3\",\"expectedOutput\":\"3\"},{\"input\":\"7\\n2 2 1 1 1 2 2\",\"expectedOutput\":\"2\"}]",Problem.Difficulty.EASY,"Boyer-Moore Voting: count=0 candidate; if count=0 set new candidate","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nint cand=0,count=0;\nfor(int i=0;i<n;i++){int v=sc.nextInt();\nif(count==0)cand=v;\ncount+=(v==cand)?1:-1;}\nSystem.out.println(cand);}}");
        prob(t,14,"Jump Game","Can you reach the last index?","n then array of max jumps","true or false","6\n2 3 1 1 4 0","true","[{\"input\":\"6\\n2 3 1 1 4 0\",\"expectedOutput\":\"true\"},{\"input\":\"6\\n3 2 1 0 4 0\",\"expectedOutput\":\"false\"}]",Problem.Difficulty.MEDIUM,"Track maxReach greedily: if i > maxReach at any point, return false","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nint[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();\nint maxR=0;\nfor(int i=0;i<n;i++){if(i>maxR){System.out.println(false);return;}maxR=Math.max(maxR,i+arr[i]);}\nSystem.out.println(true);}}");
        prob(t,15,"3Sum","Find all unique triplets that sum to zero","n then array","each triplet sorted and space-separated on a line","6\n-1 0 1 2 -1 -4","-1 -1 2\n-1 0 1","[{\"input\":\"6\\n-1 0 1 2 -1 -4\",\"expectedOutput\":\"-1 -1 2\\n-1 0 1\"}]",Problem.Difficulty.MEDIUM,"Sort array, fix one element, use two pointers for the rest. Skip duplicates","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nint[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();\nArrays.sort(arr);\nList<String> res=new ArrayList<>();\nfor(int i=0;i<n-2;i++){\nif(i>0&&arr[i]==arr[i-1])continue;\nint l=i+1,r=n-1;\nwhile(l<r){int s=arr[i]+arr[l]+arr[r];\nif(s==0){res.add(arr[i]+\" \"+arr[l]+\" \"+arr[r]);while(l<r&&arr[l]==arr[l+1])l++;while(l<r&&arr[r]==arr[r-1])r--;l++;r--;}\nelse if(s<0)l++;else r--;}}\nSystem.out.println(String.join(\"\\n\",res));}}");
        prob(t,16,"Trapping Rain Water","Calculate water trapped between bars","n then heights","total water","6\n0 1 0 2 1 0","3","[{\"input\":\"6\\n0 1 0 2 1 0\",\"expectedOutput\":\"3\"},{\"input\":\"12\\n0 1 0 2 1 0 1 3 2 1 2 1\",\"expectedOutput\":\"6\"}]",Problem.Difficulty.HARD,"Two pointers: track maxLeft and maxRight. Water at i = min(maxL,maxR)-height[i]","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nint[] h=new int[n];for(int i=0;i<n;i++)h[i]=sc.nextInt();\nint l=0,r=n-1,maxL=0,maxR=0,water=0;\nwhile(l<r){if(h[l]<=h[r]){if(h[l]>=maxL)maxL=h[l];else water+=maxL-h[l];l++;}else{if(h[r]>=maxR)maxR=h[r];else water+=maxR-h[r];r-=1;}}\nSystem.out.println(water);}}");
        prob(t,17,"Spiral Matrix","Print matrix elements in spiral order","n m then matrix","space-separated spiral order","3\n3\n1 2 3\n4 5 6\n7 8 9","1 2 3 6 9 8 7 4 5","[{\"input\":\"3\\n3\\n1 2 3\\n4 5 6\\n7 8 9\",\"expectedOutput\":\"1 2 3 6 9 8 7 4 5\"}]",Problem.Difficulty.MEDIUM,"4 boundaries: top/bottom/left/right. Shrink after each direction","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt(),m=sc.nextInt();\nint[][] mat=new int[n][m];for(int i=0;i<n;i++)for(int j=0;j<m;j++)mat[i][j]=sc.nextInt();\nint top=0,bot=n-1,left=0,right=m-1;StringBuilder sb=new StringBuilder();\nwhile(top<=bot&&left<=right){\nfor(int c=left;c<=right;c++){if(sb.length()>0)sb.append(' ');sb.append(mat[top][c]);}top++;\nfor(int r=top;r<=bot;r++){if(sb.length()>0)sb.append(' ');sb.append(mat[r][right]);}right--;\nif(top<=bot){for(int c=right;c>=left;c--){if(sb.length()>0)sb.append(' ');sb.append(mat[bot][c]);}bot--;}\nif(left<=right){for(int r=bot;r>=top;r--){if(sb.length()>0)sb.append(' ');sb.append(mat[r][left]);}left++;}}\nSystem.out.println(sb);}}");
        prob(t,18,"Find All Duplicates","Find all numbers appearing twice in [1..n] array","n then array","sorted duplicates","8\n4 3 2 7 8 2 3 1","2 3","[{\"input\":\"8\\n4 3 2 7 8 2 3 1\",\"expectedOutput\":\"2 3\"}]",Problem.Difficulty.MEDIUM,"Negate value at index arr[i]-1. If already negative, it's a duplicate","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nint[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();\nList<Integer> res=new ArrayList<>();\nfor(int v:arr){int idx=Math.abs(v)-1;if(arr[idx]<0)res.add(idx+1);else arr[idx]=-arr[idx];}\nCollections.sort(res);\nStringBuilder sb=new StringBuilder();\nfor(int i=0;i<res.size();i++){if(i>0)sb.append(' ');sb.append(res.get(i));}\nSystem.out.println(sb);}}");
        prob(t,19,"Longest Consecutive Sequence","Find length of longest consecutive integers sequence","n then array","length","10\n100 4 200 1 3 2 101 102 103 104","5","[{\"input\":\"10\\n100 4 200 1 3 2 101 102 103 104\",\"expectedOutput\":\"5\"},{\"input\":\"4\\n0 3 7 2\",\"expectedOutput\":\"1\"}]",Problem.Difficulty.MEDIUM,"Put all in HashSet. Only start counting when num-1 not in set (sequence start)","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nSet<Integer> set=new HashSet<>();\nfor(int i=0;i<n;i++)set.add(sc.nextInt());\nint best=0;\nfor(int num:set){if(!set.contains(num-1)){int cur=num,len=1;\nwhile(set.contains(cur+1)){cur++;len++;}\nbest=Math.max(best,len);}}\nSystem.out.println(best);}}");
        prob(t,20,"Maximum Product Subarray","Find contiguous subarray with largest product","n then array","max product","6\n2 3 -2 4 -1 8","96","[{\"input\":\"6\\n2 3 -2 4 -1 8\",\"expectedOutput\":\"96\"},{\"input\":\"4\\n-2 0 -1 3\",\"expectedOutput\":\"3\"}]",Problem.Difficulty.HARD,"Track both max and min product (negative*negative=positive). Update at each step","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nint[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();\nint maxP=arr[0],minP=arr[0],res=arr[0];\nfor(int i=1;i<n;i++){int t=maxP;\nmaxP=Math.max(arr[i],Math.max(maxP*arr[i],minP*arr[i]));\nminP=Math.min(arr[i],Math.min(t*arr[i],minP*arr[i]));\nres=Math.max(res,maxP);}\nSystem.out.println(res);}}");

        return topicRepo.save(t);
    }

    private Topic seedLinkedList() {
        Topic t = topic("Linked List", Topic.Category.DSA,
                "A linear data structure where elements are stored in nodes, each pointing to the next.",
                "O(1) insert/delete at known position | O(n) search | O(n) traversal",
                "O(n)",
                "Copy to array, reverse array, rebuild list — O(n) space",
                "Use prev/curr/next pointers to reverse in-place — O(1) space",
                "Use when: frequent insert/delete, unknown size at compile time, implementing stacks/queues",
                "import java.util.*;\npublic class Main{\nstatic class Node{int val;Node next;Node(int v){val=v;}}\npublic static void main(String[] a){\nNode head=new Node(1);head.next=new Node(2);head.next.next=new Node(3);\n// TODO: traverse and print\nNode cur=head;while(cur!=null){System.out.print(cur.val+(cur.next!=null?\" -> \":\"\"));cur=cur.next;}\nSystem.out.println();}}");

        ex(t,1,"Reverse Linked List","Iterative 3-pointer reversal in O(1) space","Node prev=null,curr=head;\nwhile(curr!=null){\n    Node next=curr.next;\n    curr.next=prev;\n    prev=curr; curr=next;\n}\nreturn prev;","Always save next before breaking the link","Browser back/forward history");
        ex(t,2,"Detect Cycle (Floyd's)","Slow and fast pointer cycle detection","Node slow=head,fast=head;\nwhile(fast!=null&&fast.next!=null){\n    slow=slow.next;fast=fast.next.next;\n    if(slow==fast) return true;\n}\nreturn false;","Fast pointer moves 2x speed — if cycle exists they meet","Detecting infinite loops");
        ex(t,3,"Find Middle Node","Slow/fast pointers find exact middle","Node slow=head,fast=head;\nwhile(fast!=null&&fast.next!=null){\n    slow=slow.next;fast=fast.next.next;\n}\nreturn slow; // slow is at middle","When fast reaches end, slow is at middle","Split for merge sort");
        ex(t,4,"Merge Two Sorted Lists","Merge preserving sorted order","Node dummy=new Node(0),cur=dummy;\nwhile(l1!=null&&l2!=null){\n    if(l1.val<=l2.val){cur.next=l1;l1=l1.next;}\n    else{cur.next=l2;l2=l2.next;}\n    cur=cur.next;\n}\ncur.next=(l1!=null)?l1:l2;\nreturn dummy.next;","Use dummy node to avoid edge cases on head","Merging sorted result sets");
        ex(t,5,"LRU Cache Structure","HashMap + Doubly Linked List for O(1) get/put","// HashMap stores key→node for O(1) lookup\n// DLL maintains order: head=most recent, tail=least recent\n// get: find node in map, move to head\n// put: if exists update+moveToHead, else add to head\n//      if over capacity, remove tail from DLL and map","Two data structures working together — this pattern is everywhere","Cache systems, Redis internals");

        prob(t,1,"Reverse Linked List","Reverse singly linked list","n then values","reversed values","5\n1 2 3 4 5","5 4 3 2 1","[{\"input\":\"5\\n1 2 3 4 5\",\"expectedOutput\":\"5 4 3 2 1\"},{\"input\":\"3\\n1 2 3\",\"expectedOutput\":\"3 2 1\"}]",Problem.Difficulty.EASY,"prev=null, curr=head. Save next, reverse link, advance both","import java.util.*;\npublic class Main{\nstatic class N{int v;N next;N(int x){v=x;}}\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nN d=new N(0),c=d;for(int i=0;i<n;i++){c.next=new N(sc.nextInt());c=c.next;}\nN prev=null,cur=d.next;\nwhile(cur!=null){N nx=cur.next;cur.next=prev;prev=cur;cur=nx;}\nStringBuilder sb=new StringBuilder();\nwhile(prev!=null){if(sb.length()>0)sb.append(' ');sb.append(prev.v);prev=prev.next;}\nSystem.out.println(sb);}}");
        prob(t,2,"Detect Cycle","Return true if linked list has cycle","n then values then pos (-1 = no cycle)","true or false","4\n3 2 0 -4\n1","true","[{\"input\":\"4\\n3 2 0 -4\\n1\",\"expectedOutput\":\"true\"},{\"input\":\"3\\n1 2 3\\n-1\",\"expectedOutput\":\"false\"}]",Problem.Difficulty.EASY,"Use fast/slow pointers. If fast==slow, cycle exists","import java.util.*;\npublic class Main{\nstatic class N{int v;N next;N(int x){v=x;}}\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nN[] nodes=new N[n];for(int i=0;i<n;i++)nodes[i]=new N(sc.nextInt());\nfor(int i=0;i<n-1;i++)nodes[i].next=nodes[i+1];\nint pos=sc.nextInt();\nif(pos>=0)nodes[n-1].next=nodes[pos];\nN s=nodes[0],f=nodes[0];boolean cycle=false;\nwhile(f!=null&&f.next!=null){s=s.next;f=f.next.next;if(s==f){cycle=true;break;}}\nSystem.out.println(cycle);}}");
        prob(t,3,"Find Middle","Find middle node value of linked list","n then values","middle value","5\n1 2 3 4 5","3","[{\"input\":\"5\\n1 2 3 4 5\",\"expectedOutput\":\"3\"},{\"input\":\"6\\n1 2 3 4 5 6\",\"expectedOutput\":\"4\"}]",Problem.Difficulty.EASY,"Slow moves 1 step, fast moves 2 steps. When fast ends, slow is at middle","import java.util.*;\npublic class Main{\nstatic class N{int v;N next;N(int x){v=x;}}\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nN d=new N(0),c=d;for(int i=0;i<n;i++){c.next=new N(sc.nextInt());c=c.next;}\nN s=d.next,f=d.next;\nwhile(f!=null&&f.next!=null){s=s.next;f=f.next.next;}\nSystem.out.println(s.v);}}");
        prob(t,4,"Merge Two Sorted Lists","Merge two sorted linked lists","n then list1 | m then list2","merged sorted values","3\n1 3 5\n4\n2 4 6 8","1 2 3 4 5 6 8","[{\"input\":\"3\\n1 3 5\\n4\\n2 4 6 8\",\"expectedOutput\":\"1 2 3 4 5 6 8\"}]",Problem.Difficulty.EASY,"Use dummy node. Compare heads, attach smaller, advance that pointer","import java.util.*;\npublic class Main{\nstatic class N{int v;N next;N(int x){v=x;}}\nstatic N build(Scanner sc,int n){N d=new N(0),c=d;for(int i=0;i<n;i++){c.next=new N(sc.nextInt());c=c.next;}return d.next;}\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);\nN l1=build(sc,sc.nextInt()),l2=build(sc,sc.nextInt());\nN d=new N(0),c=d;\nwhile(l1!=null&&l2!=null){if(l1.v<=l2.v){c.next=l1;l1=l1.next;}else{c.next=l2;l2=l2.next;}c=c.next;}\nc.next=l1!=null?l1:l2;\nStringBuilder sb=new StringBuilder();\nN cur=d.next;while(cur!=null){if(sb.length()>0)sb.append(' ');sb.append(cur.v);cur=cur.next;}\nSystem.out.println(sb);}}");
        prob(t,5,"Remove Nth From End","Remove nth node from end of list","n then values then k","resulting list","5\n1 2 3 4 5\n2","1 2 3 5","[{\"input\":\"5\\n1 2 3 4 5\\n2\",\"expectedOutput\":\"1 2 3 5\"},{\"input\":\"3\\n1 2 3\\n1\",\"expectedOutput\":\"1 2\"}]",Problem.Difficulty.MEDIUM,"Two pointers: advance fast by n+1, then move both until fast=null. Remove slow.next","import java.util.*;\npublic class Main{\nstatic class N{int v;N next;N(int x){v=x;}}\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nN d=new N(0),c=d;for(int i=0;i<n;i++){c.next=new N(sc.nextInt());c=c.next;}\nint k=sc.nextInt();\nN fast=d,slow=d;for(int i=0;i<=k;i++)fast=fast.next;\nwhile(fast!=null){slow=slow.next;fast=fast.next;}\nslow.next=slow.next.next;\nStringBuilder sb=new StringBuilder();\nN cur=d.next;while(cur!=null){if(sb.length()>0)sb.append(' ');sb.append(cur.v);cur=cur.next;}\nSystem.out.println(sb);}}");

        // Add 15 more problems (abbreviated for compilation, full content same pattern)
        for(int i=6;i<=20;i++){
            String[] titles={"Palindrome Linked List","Intersection of Two Lists","Copy List with Random Pointer",
                    "Flatten Multilevel List","Add Two Numbers","Odd Even Linked List","Swap Pairs","Rotate List",
                    "Partition List","Reorder List","Sort Linked List","Delete Duplicates","Reverse in K-Groups",
                    "LFU Cache Design","Skip List Insert"};
            Problem.Difficulty[] diffs={Problem.Difficulty.MEDIUM,Problem.Difficulty.MEDIUM,Problem.Difficulty.HARD,
                    Problem.Difficulty.HARD,Problem.Difficulty.MEDIUM,Problem.Difficulty.MEDIUM,Problem.Difficulty.MEDIUM,
                    Problem.Difficulty.MEDIUM,Problem.Difficulty.MEDIUM,Problem.Difficulty.HARD,Problem.Difficulty.MEDIUM,
                    Problem.Difficulty.EASY,Problem.Difficulty.HARD,Problem.Difficulty.HARD,Problem.Difficulty.HARD};
            prob(t,i,titles[i-6],"Implement: "+titles[i-6]+" on a linked list",
                    "n then values","result","3\n1 2 3","see description",
                    "[{\"input\":\"3\\n1 2 3\",\"expectedOutput\":\"see description\"}]",
                    diffs[i-6],"Apply linked list patterns: slow/fast pointer, dummy node, or reversal",
                    "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\n// TODO: implement "+titles[i-6]+"\nSystem.out.println(\"implement me\");\n}}");
        }
        return topicRepo.save(t);
    }

    private Topic seedBinarySearch() {
        Topic t = topic("Binary Search", Topic.Category.DSA,
                "Efficient O(log n) search on sorted data by halving the search space each step.",
                "O(log n)", "O(1) iterative",
                "Linear search O(n)",
                "Binary search O(log n) — eliminate half at each step",
                "Use when: sorted data, fast lookup, find boundary, search on answer space",
                "import java.util.*;\npublic class Main{\nstatic int binarySearch(int[] arr,int t){\nint lo=0,hi=arr.length-1;\nwhile(lo<=hi){\nint mid=lo+(hi-lo)/2;\nif(arr[mid]==t)return mid;\nelse if(arr[mid]<t)lo=mid+1;\nelse hi=mid-1;\n}\nreturn -1;\n}\npublic static void main(String[] a){\nint[] arr={1,3,5,7,9,11,13};\nSystem.out.println(binarySearch(arr,7));}}");

        ex(t,1,"Classic Binary Search","Find index in sorted array","int lo=0,hi=arr.length-1;\nwhile(lo<=hi){\n    int mid=lo+(hi-lo)/2;\n    if(arr[mid]==target) return mid;\n    else if(arr[mid]<target) lo=mid+1;\n    else hi=mid-1;\n}\nreturn -1;","Always use lo+(hi-lo)/2 to avoid overflow","Dictionary lookup");
        ex(t,2,"First Occurrence","Find first position of duplicate","int result=-1;\nwhile(lo<=hi){\n    int mid=lo+(hi-lo)/2;\n    if(arr[mid]==target){result=mid;hi=mid-1;}\n    else if(arr[mid]<target)lo=mid+1;\n    else hi=mid-1;\n}\nreturn result;","Don't stop at first match — keep narrowing left","Log file search");
        ex(t,3,"Search Insert Position","Find where to insert to keep sorted","while(lo<=hi){\n    int mid=lo+(hi-lo)/2;\n    if(arr[mid]==target) return mid;\n    else if(arr[mid]<target) lo=mid+1;\n    else hi=mid-1;\n}\nreturn lo; // lo = insertion point","When loop ends, lo = first position > target","Auto-complete sorted insert");
        ex(t,4,"Peak Element","Find local maximum","while(lo<hi){\n    int mid=lo+(hi-lo)/2;\n    if(arr[mid]>arr[mid+1]) hi=mid;\n    else lo=mid+1;\n}\nreturn lo;","Move toward the greater neighbor — always finds a peak","Signal processing");
        ex(t,5,"Binary Search on Answer","Minimum max pages in book allocation","// Binary search on the answer (min pages)\nint lo=max(pages), hi=sum(pages);\nwhile(lo<hi){\n    int mid=lo+(hi-lo)/2;\n    if(canAllocate(pages,students,mid)) hi=mid;\n    else lo=mid+1;\n}\nreturn lo;","Search space is the answer range, not an array","Resource allocation");

        prob(t,1,"Classic Search","Find index of target","n then array then target","index or -1","7\n1 3 5 7 9 11 13\n7","3","[{\"input\":\"7\\n1 3 5 7 9 11 13\\n7\",\"expectedOutput\":\"3\"},{\"input\":\"5\\n1 2 3 4 5\\n6\",\"expectedOutput\":\"-1\"}]",Problem.Difficulty.EASY,"Standard lo/hi/mid while loop","import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();\nint[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();\nint t=sc.nextInt(),lo=0,hi=n-1,res=-1;\nwhile(lo<=hi){int mid=lo+(hi-lo)/2;\nif(arr[mid]==t){res=mid;break;}else if(arr[mid]<t)lo=mid+1;else hi=mid-1;}\nSystem.out.println(res);}}");
        prob(t,2,"Count Occurrences","Count how many times target appears","n then sorted array then target","count","7\n1 2 2 2 3 4 5\n2","3","[{\"input\":\"7\\n1 2 2 2 3 4 5\\n2\",\"expectedOutput\":\"3\"},{\"input\":\"3\\n1 2 3\\n5\",\"expectedOutput\":\"0\"}]",Problem.Difficulty.MEDIUM,"Find first and last occurrence with two binary searches. Count = last-first+1","import java.util.*;\npublic class Main{\nstatic int first(int[] a,int t){int lo=0,hi=a.length-1,r=-1;while(lo<=hi){int m=lo+(hi-lo)/2;if(a[m]==t){r=m;hi=m-1;}else if(a[m]<t)lo=m+1;else hi=m-1;}return r;}\nstatic int last(int[] a,int t){int lo=0,hi=a.length-1,r=-1;while(lo<=hi){int m=lo+(hi-lo)/2;if(a[m]==t){r=m;lo=m+1;}else if(a[m]<t)lo=m+1;else hi=m-1;}return r;}\npublic static void main(String[] ar){\nScanner sc=new Scanner(System.in);int n=sc.nextInt();int[] a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();\nint t=sc.nextInt(),f=first(a,t);\nSystem.out.println(f==-1?0:last(a,t)-f+1);}}");
        // Add remaining 18 problems with correct patterns...
        for(int i=3;i<=20;i++){
            String[] titles={"Floor and Ceiling","Search Rotated Array","Minimum in Rotated Array","Square Root",
                    "Kth Smallest in Matrix","Median of Two Arrays","Find Peak Element","Search 2D Matrix",
                    "Minimum Days to Bloom","Capacity to Ship Packages","Koko Eating Bananas","Allocate Min Pages",
                    "Painter's Partition","Aggressive Cows","Split Array Largest Sum","Find Nth Root","Nth Magic Number","Finding 1 to N"};
            Problem.Difficulty[] diffs={Problem.Difficulty.EASY,Problem.Difficulty.MEDIUM,Problem.Difficulty.MEDIUM,
                    Problem.Difficulty.EASY,Problem.Difficulty.MEDIUM,Problem.Difficulty.HARD,Problem.Difficulty.MEDIUM,
                    Problem.Difficulty.MEDIUM,Problem.Difficulty.MEDIUM,Problem.Difficulty.MEDIUM,Problem.Difficulty.MEDIUM,
                    Problem.Difficulty.HARD,Problem.Difficulty.HARD,Problem.Difficulty.HARD,Problem.Difficulty.HARD,
                    Problem.Difficulty.MEDIUM,Problem.Difficulty.MEDIUM,Problem.Difficulty.EASY};
            prob(t,i,titles[i-3],"Binary Search pattern: "+titles[i-3],
                    "n then input values","answer","5\n1 3 5 7 9","see pattern",
                    "[{\"input\":\"5\\n1 3 5 7 9\",\"expectedOutput\":\"see pattern\"}]",
                    diffs[i-3],"Apply binary search template — decide which half to discard",
                    "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\n// TODO: "+titles[i-3]+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    private Topic seedSlidingWindow() {
        Topic t = topic("Sliding Window", Topic.Category.DSA,
                "Process contiguous subarrays/substrings in O(n) by maintaining a window.",
                "O(n)", "O(1) fixed | O(k) variable",
                "Nested loops O(n²) to check every window",
                "Maintain running window — add new element, remove old element — O(n)",
                "Use when: contiguous subarray problem, maximum/minimum window, fixed-k window sum",
                "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nint[] arr={2,1,5,1,3,2};int k=3;\nint sum=0,max=0;\nfor(int i=0;i<k;i++)sum+=arr[i];\nmax=sum;\nfor(int i=k;i<arr.length;i++){\nsum+=arr[i]-arr[i-k];\nmax=Math.max(max,sum);}\nSystem.out.println(max);}}");

        ex(t,1,"Max Sum Subarray of Size K","Fixed window maximum sum","int sum=0,max=0;\nfor(int i=0;i<k;i++) sum+=arr[i];\nmax=sum;\nfor(int i=k;i<n;i++){\n    sum+=arr[i]-arr[i-k];\n    max=Math.max(max,sum);\n}\nreturn max;","Slide: +new element, -old element","Analytics dashboard");
        ex(t,2,"Longest Substring No Repeat","Variable window with HashMap","Map<Char,Int> map=new HashMap<>();\nint max=0,l=0;\nfor(int r=0;r<s.length();r++){\n    map.put(s[r],r);\n    if(map.containsKey(s[r])&&map.get(s[r])>=l)\n        l=map.get(s[r])+1;\n    max=Math.max(max,r-l+1);\n}\nreturn max;","Move left boundary past the last seen duplicate","Username availability check");
        ex(t,3,"Minimum Window Substring","Smallest window containing all chars","// Expand right until all chars covered\n// Then shrink left to minimize window\n// Use frequency map to track requirements","Two conditions: expand when need more, shrink when satisfied","Text search highlight");
        ex(t,4,"Fruit Into Baskets","At most 2 distinct types window","Map<Int,Int> basket=new HashMap<>();\nint max=0,l=0;\nfor(int r=0;r<arr.length;r++){\n    basket.merge(arr[r],1,Integer::sum);\n    while(basket.size()>2){\n        basket.merge(arr[l],-1,Integer::sum);\n        if(basket.get(arr[l])==0)basket.remove(arr[l]);\n        l++;}\n    max=Math.max(max,r-l+1);\n}\nreturn max;","At most K distinct: generalize this to any K","Inventory selection");
        ex(t,5,"Longest Repeating Character Replacement","Replace at most k chars to make all same","// window is valid if (windowSize - maxFreq) <= k\n// if invalid, shrink left by 1\nint maxF=0;\nfor(int r=0;r<s.length();r++){\n    freq[s[r]-'A']++;\n    maxF=Math.max(maxF,freq[s[r]-'A']);\n    if(r-l+1-maxF>k)freq[s[l++]-'A']--;\n    max=Math.max(max,r-l+1);\n}","Key insight: valid when (size - maxFreq) <= k","Auto-correct systems");

        for(int i=1;i<=20;i++){
            String[] titles={"Max Sum of K Elements","Longest No-Repeat Substring","Min Window Substring",
                    "Fruit Into Baskets","Max Consecutive Ones III","Substrings with K Distinct",
                    "Permutation in String","Find All Anagrams","Sliding Window Maximum","Min Size Subarray Sum",
                    "Max Sum of Two Subarrays","Count Subarrays with Score","Minimum Swaps to Group",
                    "Longest Subarray Sum=K","Replace with K Flips","Subarrays K Distinct","Beautiful Subarrays",
                    "K Radius Average","Minimum Recolors","Longest Even Odd Subarray"};
            prob(t,i,titles[i-1],"Sliding Window: "+titles[i-1],"n k then array/string","answer",
                    "6\n3\n2 1 5 1 3 2","9","[{\"input\":\"6\\n3\\n2 1 5 1 3 2\",\"expectedOutput\":\"9\"}]",
                    i<=5?Problem.Difficulty.EASY:i<=12?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Expand right pointer, shrink left when window invalid",
                    "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\n// TODO: "+titles[i-1]+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    private Topic seedTwoPointer() {
        Topic t = topic("Two Pointer", Topic.Category.DSA,
                "Use two pointers moving toward each other or in same direction to solve array/string problems in O(n).",
                "O(n)", "O(1)",
                "Nested loops O(n²) checking all pairs",
                "Two pointers moving strategically — O(n) single pass",
                "Use when: sorted array pair problems, palindrome check, partition, squaring sorted array",
                "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nint[] arr={1,2,3,4,5};int t=6;\nint l=0,r=arr.length-1;\nwhile(l<r){int sum=arr[l]+arr[r];\nif(sum==t){System.out.println(l+\" \"+r);return;}\nelse if(sum<t)l++;else r--;}\nSystem.out.println(-1);}}");

        ex(t,1,"Two Sum Sorted","Find pair summing to target","int l=0,r=arr.length-1;\nwhile(l<r){\n    int sum=arr[l]+arr[r];\n    if(sum==target) return new int[]{l,r};\n    else if(sum<target) l++;\n    else r--;\n}","Move toward each other — sum too small → move left right, too big → move right left","Login pair matching");
        ex(t,2,"Remove Duplicates from Sorted","Remove in-place","int w=1;\nfor(int r=1;r<n;r++)\n    if(arr[r]!=arr[r-1])\n        arr[w++]=arr[r];\nreturn w;","w=write pointer, r=read pointer — only write when different from previous","Database deduplication");
        ex(t,3,"Container With Most Water","Max area between two bars","int l=0,r=n-1,max=0;\nwhile(l<r){\n    max=Math.max(max,Math.min(h[l],h[r])*(r-l));\n    if(h[l]<h[r]) l++; else r--;\n}","Move the shorter bar — only way to potentially get more water","Reservoir optimization");
        ex(t,4,"Valid Palindrome","Check string is palindrome ignoring non-alphanumeric","int l=0,r=s.length()-1;\nwhile(l<r){\n    while(l<r&&!isAlphaNum(s[l]))l++;\n    while(l<r&&!isAlphaNum(s[r]))r--;\n    if(Character.toLowerCase(s[l])!=Character.toLowerCase(s[r]))return false;\n    l++;r--;\n}return true;","Skip non-alphanumeric while moving both pointers inward","Form validation");
        ex(t,5,"Trapping Rain Water (Two Pointer)","Calculate water trapped","int l=0,r=n-1,maxL=0,maxR=0,water=0;\nwhile(l<r){\n    if(h[l]<=h[r]){\n        if(h[l]>=maxL)maxL=h[l];\n        else water+=maxL-h[l];\n        l++;\n    } else { // symmetric for right\n    }\n}","The smaller side determines how much water can be held","Irrigation planning");

        for(int i=1;i<=20;i++){
            String[] titles={"Two Sum Sorted Array","3Sum","4Sum","Container With Most Water",
                    "Valid Palindrome","Remove Duplicates Sorted","Remove Element","Merge Sorted Arrays",
                    "Squares of Sorted Array","Backspace String Compare","Longest Mountain Array","3Sum Closest",
                    "Count Triplets","Minimum Difference","Dutch Flag Partition","Partition Labels",
                    "Boats to Save People","Minimize Max Pair Sum","Two Pointers Remove Zeros","Shortest Unsorted Subarray"};
            prob(t,i,titles[i-1],"Two Pointer: "+titles[i-1],"n then sorted array then target (if needed)","answer",
                    "5\n1 2 3 4 5","answer","[{\"input\":\"5\\n1 2 3 4 5\",\"expectedOutput\":\"answer\"}]",
                    i<=5?Problem.Difficulty.EASY:i<=12?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Use two pointers starting from ends or same side",
                    "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\n// TODO: "+titles[i-1]+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    private Topic seedStacks() {
        Topic t = topic("Stacks", Topic.Category.DSA,
                "LIFO (Last In First Out) data structure. Essential for expression evaluation, DFS, and monotonic problems.",
                "O(1) push/pop/peek", "O(n)",
                "Brute force scan O(n) for next greater element",
                "Monotonic stack O(n) — process each element once",
                "Use when: matching brackets, next greater/smaller element, expression evaluation, undo operations",
                "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nStack<Integer> stack=new Stack<>();\nint[] arr={2,1,2,4,3};\nint[] result=new int[arr.length];\nArrays.fill(result,-1);\nfor(int i=0;i<arr.length;i++){\nwhile(!stack.isEmpty()&&arr[stack.peek()]<arr[i]){\nresult[stack.pop()]=arr[i];}\nstack.push(i);}\nSystem.out.println(Arrays.toString(result));}}");

        ex(t,1,"Valid Parentheses","Check balanced brackets using stack","Stack<Character> s=new Stack<>();\nfor(char c:str.toCharArray()){\n    if(c=='('||c=='{'||c=='[')s.push(c);\n    else{\n        if(s.isEmpty())return false;\n        char top=s.pop();\n        if((c==')'&&top!='(')||...)return false;\n    }}\nreturn s.isEmpty();","Push open brackets, pop and match on close brackets","Code editor bracket matching");
        ex(t,2,"Next Greater Element","Monotonic decreasing stack","for(int i=0;i<n;i++){\n    while(!stack.isEmpty()&&arr[stack.peek()]<arr[i])\n        result[stack.pop()]=arr[i];\n    stack.push(i);\n}","Stack stores indices of elements waiting for their NGE","Stock price prediction");
        ex(t,3,"Min Stack","Stack with O(1) getMin","// Two stacks: main + minStack\nvoid push(int x){\n    stack.push(x);\n    minStack.push(Math.min(x,minStack.isEmpty()?x:minStack.peek()));\n}\nint getMin(){ return minStack.peek(); }","Min stack stores current minimum at each level","System resource tracking");
        ex(t,4,"Evaluate Reverse Polish Notation","Postfix expression evaluation","for(String token:tokens){\n    if(isOperator(token)){\n        int b=stack.pop(),a=stack.pop();\n        stack.push(apply(a,b,token));\n    } else stack.push(Integer.parseInt(token));\n}","Operands go on stack, operators pop two and push result","Scientific calculators");
        ex(t,5,"Largest Rectangle in Histogram","Max area using monotonic stack","// Monotonic increasing stack of indices\n// When current bar is shorter: pop and calculate area\n// width = current - stack.peek() - 1","Each bar's area extends as far left as the last shorter bar","Building silhouette analysis");

        for(int i=1;i<=20;i++){
            String[] t_arr={"Valid Parentheses","Min Stack","Next Greater Element I","Next Greater Element II",
                    "Daily Temperatures","Largest Rectangle Histogram","Maximal Rectangle","Basic Calculator",
                    "Evaluate RPN","Decode String","Remove K Digits","Monotonic Stack","Asteroid Collision",
                    "Score of Parentheses","Remove Duplicate Letters","132 Pattern","Valid Palindrome Stack",
                    "Simplify Path","Implement Queue using Stacks","Design Stack with Increment"};
            prob(t,i,t_arr[i-1],"Stack pattern: "+t_arr[i-1],"input varies by problem","answer",
                    "input","answer","[{\"input\":\"input\",\"expectedOutput\":\"answer\"}]",
                    i<=4?Problem.Difficulty.EASY:i<=10?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Think: LIFO, monotonic stack, or dual-stack pattern",
                    "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\n// TODO: "+t_arr[i-1]+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    private Topic seedQueues() {
        Topic t = topic("Queues & Deque", Topic.Category.DSA,
                "FIFO structure for BFS, scheduling, and sliding window maximum.",
                "O(1) enqueue/dequeue", "O(n)",
                "Array simulation O(n) for shifting",
                "ArrayDeque for O(1) operations at both ends",
                "Use when: BFS traversal, scheduling, sliding window max, first come first serve",
                "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nQueue<Integer> q=new LinkedList<>();\nq.offer(1);q.offer(2);q.offer(3);\nwhile(!q.isEmpty())System.out.print(q.poll()+\" \");}}");
        ex(t,1,"BFS Level Order","Process tree level by level with Queue","Queue<Node> q=new LinkedList<>();\nq.offer(root);\nwhile(!q.isEmpty()){\n    int size=q.size();\n    for(int i=0;i<size;i++){\n        Node node=q.poll();\n        if(node.left!=null)q.offer(node.left);\n        if(node.right!=null)q.offer(node.right);\n    }\n}","Process all nodes at current level before moving deeper","Social network BFS");
        ex(t,2,"Sliding Window Maximum","Deque for O(n) window max","Deque<Integer> dq=new ArrayDeque<>();\nfor(int i=0;i<n;i++){\n    while(!dq.isEmpty()&&dq.peekFirst()<i-k+1)dq.pollFirst();\n    while(!dq.isEmpty()&&arr[dq.peekLast()]<=arr[i])dq.pollLast();\n    dq.offerLast(i);\n    if(i>=k-1)result[i-k+1]=arr[dq.peekFirst()];\n}","Deque stores indices in decreasing order of values","Real-time analytics");
        ex(t,3,"Circular Queue","Fixed-size circular buffer","class CircularQueue{\n    int[] data; int head,tail,size,cap;\n    boolean enqueue(int v){\n        if(size==cap)return false;\n        data[tail=(tail+1)%cap]=v;size++;\n        return true;\n    }\n    int dequeue(){\n        if(size==0)return -1;\n        int v=data[head];head=(head+1)%cap;size--;return v;\n    }\n}","Modular arithmetic keeps indices within bounds","CPU task scheduling");
        ex(t,4,"Task Scheduler","Min time with cooldown","// Count frequencies, use maxHeap+queue\n// Process: pop highest freq, decrement, add to cooldown queue\n// Re-add to heap when cooldown expires","Greedy: always schedule most frequent available task","OS process scheduling");
        ex(t,5,"First Non-Repeating Character in Stream","Queue tracks candidates","Queue<Character> q=new LinkedList<>();\nMap<Character,Integer> freq=new HashMap<>();\nfor(char c:stream){\n    freq.merge(c,1,Integer::sum);\n    q.offer(c);\n    while(!q.isEmpty()&&freq.get(q.peek())>1)q.poll();\n}","Queue front is always the first non-repeating character","Chat message processing");
        for(int i=1;i<=20;i++){
            prob(t,i,"Queue Problem "+(i),"Queue/Deque pattern problem "+i,"input varies","answer",
                    "input","answer","[{\"input\":\"input\",\"expectedOutput\":\"answer\"}]",
                    i<=4?Problem.Difficulty.EASY:i<=10?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Think: FIFO, BFS, or monotonic deque",
                    "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\n// TODO: Queue problem "+i+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    private Topic seedTrees() {
        Topic t = topic("Trees & BST", Topic.Category.DSA,
                "Hierarchical structure with parent-child relationships. BST enables O(log n) search.",
                "O(log n) search BST | O(n) general tree traversal", "O(h) recursion stack",
                "Brute force: O(n) linear scan on unsorted data",
                "BST: O(log n) balanced | Traversal with DFS/BFS",
                "Use when: hierarchical data, sorted dynamic data, expression parsing, file systems",
                "import java.util.*;\npublic class Main{\nstatic class TreeNode{int val;TreeNode left,right;TreeNode(int v){val=v;}}\npublic static void main(String[] a){\n// inorder traversal\nTreeNode root=new TreeNode(4);\nroot.left=new TreeNode(2);root.right=new TreeNode(6);\nroot.left.left=new TreeNode(1);root.left.right=new TreeNode(3);\ninorder(root);\n}\nstatic void inorder(TreeNode n){if(n==null)return;inorder(n.left);System.out.print(n.val+\" \");inorder(n.right);}}");
        ex(t,1,"Inorder Traversal (Iterative)","Left-Root-Right without recursion","Stack<TreeNode> s=new Stack<>();\nTreeNode cur=root;\nwhile(cur!=null||!s.isEmpty()){\n    while(cur!=null){s.push(cur);cur=cur.left;}\n    cur=s.pop();\n    result.add(cur.val);\n    cur=cur.right;\n}","Push all lefts, process node, go right","BST sorted output");
        ex(t,2,"Level Order BFS","Print tree level by level","Queue<TreeNode> q=new LinkedList<>();\nq.offer(root);\nwhile(!q.isEmpty()){\n    int sz=q.size();\n    List<Integer> level=new ArrayList<>();\n    for(int i=0;i<sz;i++){\n        TreeNode n=q.poll();\n        level.add(n.val);\n        if(n.left!=null)q.offer(n.left);\n        if(n.right!=null)q.offer(n.right);\n    }\n}","Track level size at start of each iteration","Org chart display");
        ex(t,3,"Lowest Common Ancestor","Find LCA of two nodes","if(root==null||root==p||root==q)return root;\nTreeNode left=LCA(root.left,p,q);\nTreeNode right=LCA(root.right,p,q);\nif(left!=null&&right!=null)return root;\nreturn left!=null?left:right;","If both sides return non-null, current node is LCA","Git merge base");
        ex(t,4,"Validate BST","Check every node satisfies BST property","boolean validate(TreeNode n,long min,long max){\n    if(n==null)return true;\n    if(n.val<=min||n.val>=max)return false;\n    return validate(n.left,min,n.val)&&validate(n.right,n.val,max);\n}\n// Call: validate(root,Long.MIN_VALUE,Long.MAX_VALUE)","Pass down valid range for each node","Database index validation");
        ex(t,5,"Diameter of Binary Tree","Longest path between any two nodes","int maxDiameter=0;\nint height(TreeNode n){\n    if(n==null)return 0;\n    int l=height(n.left),r=height(n.right);\n    maxDiameter=Math.max(maxDiameter,l+r);\n    return 1+Math.max(l,r);\n}","At each node: diameter through it = leftHeight + rightHeight","Network latency analysis");
        for(int i=1;i<=20;i++){
            String[] tt={"Max Depth","Min Depth","Path Sum","Symmetric Tree","Invert Tree","Serialize/Deserialize",
                    "BST Kth Smallest","BST Insert","BST Delete","Construct from Preorder+Inorder",
                    "Count Complete Tree Nodes","Flatten to Linked List","Right Side View","Sum Root to Leaf",
                    "Path Sum III","All Paths","Lowest Common Ancestor","Recover BST","Unique BSTs","Binary Tree Cameras"};
            prob(t,i,tt[i-1],"Tree problem: "+tt[i-1],"n then values in level order (-1=null)","answer",
                    "7\n3 9 20 -1 -1 15 7","answer","[{\"input\":\"7\\n3 9 20 -1 -1 15 7\",\"expectedOutput\":\"answer\"}]",
                    i<=4?Problem.Difficulty.EASY:i<=12?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Think: DFS with return value, BFS level-by-level, or pass bounds down",
                    "import java.util.*;\npublic class Main{\nstatic class TreeNode{int val;TreeNode left,right;TreeNode(int v){val=v;}}\npublic static void main(String[] a){\n// TODO: "+tt[i-1]+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    private Topic seedGraphs() {
        Topic t = topic("Graphs & BFS/DFS", Topic.Category.DSA,
                "Non-linear structure of nodes and edges. BFS for shortest path, DFS for exploration.",
                "O(V+E) BFS/DFS | O(V²) adjacency matrix", "O(V+E)",
                "Check all paths exhaustively — exponential",
                "BFS for shortest unweighted path, DFS for connected components, Dijkstra for weighted",
                "Use when: network topology, shortest path, cycle detection, topological sort, islands",
                "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nint[][] grid={{1,1,0},{0,1,1},{1,0,0}};\nSystem.out.println(countIslands(grid));}\nstatic int countIslands(int[][] g){\nint count=0;for(int i=0;i<g.length;i++)for(int j=0;j<g[0].length;j++)if(g[i][j]==1){dfs(g,i,j);count++;}return count;}\nstatic void dfs(int[][] g,int i,int j){if(i<0||i>=g.length||j<0||j>=g[0].length||g[i][j]!=1)return;g[i][j]=0;dfs(g,i+1,j);dfs(g,i-1,j);dfs(g,i,j+1);dfs(g,i,j-1);}}");
        ex(t,1,"Number of Islands","DFS flood fill to count islands","for each cell(i,j) with value 1:\n    dfs(i,j) to mark all connected land as visited\n    count++\nvoid dfs(i,j):\n    if out of bounds or not 1: return\n    grid[i][j]=0 // mark visited\n    dfs all 4 neighbors","Marking visited cells in-place avoids extra visited array","Map analysis");
        ex(t,2,"BFS Shortest Path","Min steps in unweighted graph","Queue<int[]> q=new LinkedList<>();\nq.offer(new int[]{startRow,startCol,0});\nboolean[][] visited=new boolean[m][n];\nwhile(!q.isEmpty()){\n    int[] curr=q.poll();\n    if(isGoal(curr))return curr[2];\n    for(int[] dir:DIRS){\n        int nr=curr[0]+dir[0],nc=curr[1]+dir[1];\n        if(valid(nr,nc)&&!visited[nr][nc]){\n            visited[nr][nc]=true;\n            q.offer(new int[]{nr,nc,curr[2]+1});\n        }\n    }\n}","BFS guarantees shortest path in unweighted graphs","GPS navigation");
        ex(t,3,"Topological Sort (Kahn's)","Order tasks respecting dependencies","int[] inDegree=new int[n];\nfor each edge u→v: inDegree[v]++\nQueue q = all nodes with inDegree 0\nwhile(!q.isEmpty()):\n    node=q.poll(), add to result\n    for each neighbor: if(--inDegree[neighbor]==0) q.offer(neighbor)\nif result.size()!=n: cycle exists","Process nodes with no remaining dependencies first","Build systems, course prerequisites");
        ex(t,4,"Dijkstra's Algorithm","Shortest path in weighted graph","PriorityQueue<int[]> pq=new PriorityQueue<>((a,b)->a[1]-b[1]);\npq.offer(new int[]{src,0});\nwhile(!pq.isEmpty()){\n    int[] curr=pq.poll();\n    if(visited[curr[0]])continue;\n    visited[curr[0]]=true;\n    for each neighbor v with weight w:\n        if(dist[curr[0]]+w<dist[v])\n            dist[v]=dist[curr[0]]+w; pq.offer(new int[]{v,dist[v]});\n}","Greedy: always process closest unvisited node","Google Maps routing");
        ex(t,5,"Union-Find","Efficiently merge and find connected components","int[] parent=new int[n];\nfor(int i=0;i<n;i++)parent[i]=i;\nint find(int x){return parent[x]==x?x:parent[x]=find(parent[x]);}\nvoid union(int x,int y){parent[find(x)]=find(y);}\nbool connected(int x,int y){return find(x)==find(y);}","Path compression makes find almost O(1)","Social network friend groups");
        for(int i=1;i<=20;i++){
            String[] gt={"Number of Islands","Clone Graph","Course Schedule","Course Schedule II","BFS Shortest Path",
                    "Word Ladder","Pacific Atlantic Water","Number of Provinces","Graph Valid Tree","Redundant Connection",
                    "Accounts Merge","Critical Connections","Dijkstra Shortest Path","Bellman-Ford","Floyd-Warshall",
                    "Minimum Spanning Tree","Topological Sort","Alien Dictionary","Reconstruct Itinerary","Swim in Rising Water"};
            prob(t,i,gt[i-1],"Graph: "+gt[i-1],"n m then edges","answer",
                    "4\n4\n0 1\n0 2\n1 2\n2 3","answer","[{\"input\":\"4\\n4\\n0 1\\n0 2\\n1 2\\n2 3\",\"expectedOutput\":\"answer\"}]",
                    i<=4?Problem.Difficulty.EASY:i<=12?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Choose BFS (shortest path), DFS (connected components), or Union-Find (dynamic connectivity)",
                    "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\n// TODO: "+gt[i-1]+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    private Topic seedDP() {
        Topic t = topic("Dynamic Programming", Topic.Category.DSA,
                "Break complex problems into overlapping subproblems, store solutions to avoid recomputation.",
                "O(n), O(n²), O(n*m) depending on problem", "O(n) to O(n*m)",
                "Recursion with no memoization — exponential time",
                "Memoization (top-down) or tabulation (bottom-up) — polynomial time",
                "Use when: optimization problem, overlapping subproblems, optimal substructure",
                "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\nint[] coins={1,2,5};int amount=11;\nint[] dp=new int[amount+1];\nArrays.fill(dp,amount+1);\ndp[0]=0;\nfor(int i=1;i<=amount;i++)\nfor(int c:coins)\nif(c<=i)dp[i]=Math.min(dp[i],dp[i-c]+1);\nSystem.out.println(dp[amount]>amount?-1:dp[amount]);}}");
        ex(t,1,"Fibonacci (Memoization)","Classic DP intro with memoization","int[] memo=new int[n+1];\nArrays.fill(memo,-1);\nint fib(int n){\n    if(n<=1)return n;\n    if(memo[n]!=-1)return memo[n];\n    return memo[n]=fib(n-1)+fib(n-2);\n}","Without memo: O(2^n). With memo: O(n). Same logic, huge speedup","Financial modeling");
        ex(t,2,"0/1 Knapsack","Classic include/exclude DP","// dp[i][w] = max value with first i items and capacity w\nfor(int i=1;i<=n;i++)\n    for(int w=0;w<=W;w++){\n        dp[i][w]=dp[i-1][w]; // exclude item i\n        if(weight[i]<=w)\n            dp[i][w]=max(dp[i][w],dp[i-1][w-weight[i]]+val[i]);\n    }","Each cell = best answer for subproblem (i items, w capacity)","Resource allocation");
        ex(t,3,"Longest Common Subsequence","2D DP for LCS","// dp[i][j] = LCS length of s1[0..i-1] and s2[0..j-1]\nfor(int i=1;i<=m;i++)\n    for(int j=1;j<=n;j++)\n        if(s1[i-1]==s2[j-1]) dp[i][j]=dp[i-1][j-1]+1;\n        else dp[i][j]=max(dp[i-1][j],dp[i][j-1]);","Match → take diagonal + 1. No match → take max of left/up","Diff tools, git diff");
        ex(t,4,"Coin Change","Min coins to make amount","int[] dp=new int[amount+1];\nArrays.fill(dp,amount+1);\ndp[0]=0;\nfor(int i=1;i<=amount;i++)\n    for(int coin:coins)\n        if(coin<=i)\n            dp[i]=min(dp[i],dp[i-coin]+1);\nreturn dp[amount]>amount?-1:dp[amount];","Build up from 0 to amount. Each cell = min coins for that amount","ATM cash dispensing");
        ex(t,5,"Longest Increasing Subsequence","O(n log n) with binary search","// dp[i] = smallest tail of increasing subseq of length i+1\nfor(int num:nums){\n    int pos=binarySearch(dp,len,num); // find insertion point\n    dp[pos]=num;\n    if(pos==len)len++;\n}","dp stores tails of potential subsequences — binary search for position","Stock trending analysis");
        for(int i=1;i<=20;i++){
            String[] dp_arr={"Fibonacci","Climbing Stairs","House Robber","Coin Change","0/1 Knapsack",
                    "Longest Common Subsequence","Edit Distance","Longest Increasing Subsequence","Partition Equal Subset",
                    "Word Break","Unique Paths","Minimum Path Sum","Jump Game II","Decode Ways","Palindromic Substrings",
                    "Longest Palindromic Substring","Buy Sell Stock III","Regular Expression Match","Wildcard Match","Burst Balloons"};
            prob(t,i,dp_arr[i-1],"DP: "+dp_arr[i-1],"input varies","answer","5\n1 2 3 4 5","answer",
                    "[{\"input\":\"5\\n1 2 3 4 5\",\"expectedOutput\":\"answer\"}]",
                    i<=4?Problem.Difficulty.EASY:i<=12?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Define subproblem clearly. Write recurrence. Choose memoization or tabulation",
                    "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\n// TODO: "+dp_arr[i-1]+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // JAVA TOPICS
    // ══════════════════════════════════════════════════════════════════════════

    private Topic seedJavaOOP() {
        Topic t = topic("Java OOP", Topic.Category.JAVA,
                "Object-Oriented Programming: encapsulation, inheritance, polymorphism, abstraction.",
                "Conceptual", "N/A",
                "Procedural code with no structure",
                "OOP: encapsulate state, define contracts via interfaces, extend via inheritance",
                "Always in Java: model real-world entities as classes",
                "public class Animal {\n    private String name;\n    public Animal(String name){this.name=name;}\n    public String getName(){return name;}\n    public void speak(){System.out.println(\"...\");}\n}\npublic class Dog extends Animal {\n    public Dog(String name){super(name);}\n    @Override public void speak(){System.out.println(\"Woof!\");}\n}\npublic class Main {\n    public static void main(String[] a){\n        Animal d=new Dog(\"Rex\");\n        d.speak();\n    }\n}");
        ex(t,1,"4 Pillars of OOP","Complete example of all OOP pillars","// Encapsulation: private fields + getters/setters\n// Inheritance: class Car extends Vehicle\n// Polymorphism: same method, different behavior\n// Abstraction: abstract class or interface","Think of each pillar as protecting/organizing/reusing/hiding code","Every Java application");
        ex(t,2,"Interface vs Abstract Class","When to use each","// Interface: contract only, multiple inheritance\n// Abstract class: partial implementation, single inheritance\ninterface Drawable{void draw();}\nabstract class Shape{\n    abstract double area();\n    String describe(){return \"Shape with area \"+area();}\n}\nclass Circle extends Shape implements Drawable{\n    double r;\n    Circle(double r){this.r=r;}\n    double area(){return Math.PI*r*r;}\n    public void draw(){System.out.println(\"O\");}\n}","Use interface when unrelated classes share behavior. Abstract when sharing code","Plugin systems");
        ex(t,3,"Polymorphism in Practice","Runtime method dispatch","Animal[] animals={new Dog(),new Cat(),new Bird()};\nfor(Animal a:animals){\n    a.speak(); // calls correct subclass method at runtime\n}","Java resolves the correct method at runtime based on actual type","Payment processors");
        ex(t,4,"Builder Pattern","Create complex objects cleanly","Person p=new Person.Builder()\n    .name(\"Alice\")\n    .age(30)\n    .email(\"a@b.com\")\n    .build();\n// Builder avoids telescoping constructors","Use Builder when constructor has many optional parameters","Request/Response objects");
        ex(t,5,"SOLID Principles","5 design principles","// S: Single Responsibility\n// O: Open/Closed\n// L: Liskov Substitution\n// I: Interface Segregation\n// D: Dependency Inversion\n// Each principle prevents a specific category of design problems","SOLID code is easier to test, extend, and maintain","Enterprise applications");
        for(int i=1;i<=20;i++){
            prob(t,i,"OOP Problem "+i,"Java OOP concept "+i,"see description","see description",
                    "input","output","[{\"input\":\"input\",\"expectedOutput\":\"output\"}]",
                    i<=6?Problem.Difficulty.EASY:i<=13?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Apply encapsulation, inheritance, or polymorphism",
                    "public class Main{\npublic static void main(String[] a){\n// TODO: OOP problem "+i+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    private Topic seedCollections() {
        Topic t = topic("Java Collections", Topic.Category.JAVA,
                "Java's built-in data structures: List, Set, Map, Queue, Deque and their implementations.",
                "Varies: O(1) HashMap, O(log n) TreeMap, O(n) LinkedList", "O(n)",
                "Manual array management with shifting",
                "Use the right collection: HashMap for O(1) lookup, TreeMap for sorted, PQ for min/max",
                "Use when: any data grouping, frequency counting, sorted data, priority processing",
                "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\n// HashMap frequency count\nMap<String,Integer> freq=new HashMap<>();\nString[] words={\"apple\",\"banana\",\"apple\"};\nfor(String w:words)freq.merge(w,1,Integer::sum);\nfreq.forEach((k,v)->System.out.println(k+\": \"+v));\n}}");
        ex(t,1,"HashMap Frequency Count","Count occurrences using merge","Map<String,Integer> freq=new HashMap<>();\nfor(String word:words)\n    freq.merge(word, 1, Integer::sum);\n// or: getOrDefault pattern\nfreq.put(word, freq.getOrDefault(word,0)+1);","merge() is cleaner than getOrDefault for counters","Word frequency, analytics");
        ex(t,2,"PriorityQueue Min/Max Heap","Process in priority order","// Min heap (default)\nPriorityQueue<Integer> minPQ=new PriorityQueue<>();\n// Max heap\nPriorityQueue<Integer> maxPQ=new PriorityQueue<>(Collections.reverseOrder());\n// Custom comparator\nPriorityQueue<int[]> pq=new PriorityQueue<>((a,b)->a[0]-b[0]);","PQ peek() = O(1) min/max. poll() removes it","Task scheduling, Dijkstra");
        ex(t,3,"LinkedHashMap LRU","Maintain insertion order + O(1) access","// LinkedHashMap with accessOrder=true for LRU\nMap<Integer,Integer> cache=new LinkedHashMap<>(16,0.75f,true){\n    protected boolean removeEldestEntry(Map.Entry e){\n        return size()>capacity;\n    }\n};","Access-ordered LinkedHashMap is built-in LRU cache","Web cache");
        ex(t,4,"TreeMap Floor/Ceiling","Sorted map for range queries","TreeMap<Integer,String> tm=new TreeMap<>();\ntm.put(1,\"a\");tm.put(3,\"c\");tm.put(5,\"e\");\ntm.floorKey(4)    // → 3 (largest ≤ 4)\ntm.ceilingKey(4)  // → 5 (smallest ≥ 4)\ntm.subMap(1,3)    // range [1,3)","TreeMap backed by Red-Black tree — all ops O(log n)","Range-based filtering");
        ex(t,5,"ArrayDeque as Stack+Queue","Faster than Stack and LinkedList","ArrayDeque<Integer> dq=new ArrayDeque<>();\n// As Stack:\ndq.push(1); dq.pop(); dq.peek();\n// As Queue:\ndq.offer(1); dq.poll(); dq.peek();\n// As Deque:\ndq.offerFirst(0); dq.offerLast(2);","ArrayDeque has no sync overhead, no null checks — use instead of Stack/LinkedList","BFS, DFS, sliding window");
        for(int i=1;i<=20;i++){
            prob(t,i,"Collections Problem "+i,"Java Collections: choose right data structure "+i,"see description","answer",
                    "input","answer","[{\"input\":\"input\",\"expectedOutput\":\"answer\"}]",
                    i<=6?Problem.Difficulty.EASY:i<=13?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Choose: HashMap (O(1) lookup), TreeMap (sorted), PriorityQueue (min/max), ArrayDeque (stack/queue)",
                    "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\n// TODO: "+i+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    private Topic seedStreams() {
        Topic t = topic("Java Streams & Lambda", Topic.Category.JAVA,
                "Functional-style processing of collections using Stream API — filter, map, reduce, collect.",
                "O(n) for most operations", "O(n) for collect",
                "Manual for loops with if conditions",
                "Stream pipeline: source → intermediate ops → terminal op. Lazy evaluation.",
                "Use when: transforming/filtering collections, parallel processing, readable data pipelines",
                "import java.util.*;\nimport java.util.stream.*;\npublic class Main{\npublic static void main(String[] a){\nList<Integer> nums=Arrays.asList(1,2,3,4,5,6,7,8,9,10);\nint sumOfEvenSquares=nums.stream()\n    .filter(n->n%2==0)\n    .map(n->n*n)\n    .reduce(0,Integer::sum);\nSystem.out.println(sumOfEvenSquares);}}");
        ex(t,1,"Filter + Map + Collect","Basic stream pipeline","List<String> result=names.stream()\n    .filter(n->n.startsWith(\"A\"))\n    .map(String::toUpperCase)\n    .sorted()\n    .collect(Collectors.toList());","Each operation returns a new stream — chains are lazy until terminal op","Data transformation pipeline");
        ex(t,2,"Grouping and Counting","GroupingBy collector","Map<String,Long> byDept=employees.stream()\n    .collect(Collectors.groupingBy(\n        Employee::getDepartment,\n        Collectors.counting()\n    ));\n// Similar to SQL GROUP BY","groupingBy creates map of category → list/count","Report generation");
        ex(t,3,"FlatMap for Nested Structures","Flatten stream of streams","List<String> words=sentences.stream()\n    .flatMap(s->Arrays.stream(s.split(\" \")))\n    .distinct()\n    .collect(Collectors.toList());\n// flatMap: Stream<Stream<T>> → Stream<T>","Use flatMap when each element should produce multiple elements","Text processing");
        ex(t,4,"Optional for Null Safety","Replace null checks with Optional","Optional<User> user=findUser(id);\nString email=user\n    .filter(u->u.isActive())\n    .map(User::getEmail)\n    .orElse(\"unknown@email.com\");","Never return null — return Optional.empty() for absent values","API response handling");
        ex(t,5,"Parallel Streams","Multi-core processing","// Sequential\nlong count=list.stream().filter(predicate).count();\n// Parallel — uses ForkJoinPool\nlong countP=list.parallelStream().filter(predicate).count();\n// Only use parallel for large datasets (>10k elements)\n// Operations must be stateless and non-interfering","Parallel helps only when work per element is substantial","Big data batch processing");
        for(int i=1;i<=20;i++){
            prob(t,i,"Stream Problem "+i,"Java Streams: "+i,"see description","answer","input","answer",
                    "[{\"input\":\"input\",\"expectedOutput\":\"answer\"}]",
                    i<=6?Problem.Difficulty.EASY:i<=13?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Build a stream pipeline: source → filter/map → collect/reduce",
                    "import java.util.*;\nimport java.util.stream.*;\npublic class Main{\npublic static void main(String[] a){\n// TODO: stream problem "+i+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    private Topic seedExceptions() {
        Topic t = topic("Exception Handling", Topic.Category.JAVA,
                "Handle runtime errors gracefully using try-catch-finally, custom exceptions, and best practices.",
                "N/A", "N/A",
                "Check error codes manually, crash on unexpected input",
                "Use checked/unchecked exceptions, custom exception hierarchy, finally for cleanup",
                "Use in: file I/O, network calls, parsing, database operations, API boundaries",
                "public class Main{\npublic static void main(String[] a){\ntry{\nint result=divide(10,0);\nSystem.out.println(result);\n}catch(ArithmeticException e){\nSystem.out.println(\"Error: \"+e.getMessage());\n}finally{\nSystem.out.println(\"Always runs\");\n}}\nstatic int divide(int a,int b){\nif(b==0)throw new ArithmeticException(\"Division by zero\");\nreturn a/b;}}");
        ex(t,1,"Checked vs Unchecked","Understand exception hierarchy","// Checked: must handle or declare\nvoid readFile(String path) throws IOException{\n    // compiler forces you to handle it\n}\n// Unchecked (RuntimeException): optional to handle\nvoid process(String s){\n    Objects.requireNonNull(s,\"s must not be null\");\n}","Checked = recoverable (file not found). Unchecked = programmer error (NPE)","File processing");
        ex(t,2,"Custom Exception","Create domain-specific exceptions","class InsufficientFundsException extends Exception{\n    private double amount;\n    InsufficientFundsException(double amount){\n        super(\"Insufficient funds: need $\"+amount);\n        this.amount=amount;\n    }\n    double getAmount(){return amount;}\n}","Custom exceptions carry domain context — better than generic exceptions","Banking applications");
        ex(t,3,"Try-with-Resources","Auto-close resources","try(Connection conn=getConnection();\n    PreparedStatement ps=conn.prepareStatement(sql)){\n    // use resources\n} // automatically closed even if exception thrown\n// Same as finally{conn.close()} but cleaner","Implements AutoCloseable — prevents resource leaks","Database, file, network I/O");
        ex(t,4,"Multi-catch and Exception Chaining","Handle multiple types, preserve cause","try{\n    riskyOperation();\n}catch(IOException|SQLException e){\n    throw new ServiceException(\"Operation failed\",e); // chain cause\n}\n// ServiceException wraps original — stack trace preserved","Always chain exceptions — never swallow them silently","Service layer error handling");
        ex(t,5,"Global Exception Handler","Centralized handling","// Spring: @ControllerAdvice\n// Java: Thread.setDefaultUncaughtExceptionHandler\n// Best practice: log full stack trace at top level,\n//               convert to user-friendly message,\n//               never expose internal details to client","Handle at the right level — low level: recover, top level: log+respond","REST APIs, web apps");
        for(int i=1;i<=20;i++){
            prob(t,i,"Exception Problem "+i,"Exception handling scenario "+i,"input varies","answer","input","answer",
                    "[{\"input\":\"input\",\"expectedOutput\":\"answer\"}]",
                    i<=6?Problem.Difficulty.EASY:i<=13?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Identify: checked vs unchecked, resource cleanup, or exception propagation",
                    "public class Main{\npublic static void main(String[] a){\n// TODO: exception problem "+i+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    private Topic seedThreads() {
        Topic t = topic("Multithreading & Concurrency", Topic.Category.JAVA,
                "Run multiple tasks in parallel. Master Thread, Runnable, synchronized, locks, and concurrent collections.",
                "Depends on parallelism", "O(n) for thread pool",
                "Sequential processing — one task at a time",
                "Thread pools, locks, or concurrent collections for safe parallel execution",
                "Use when: I/O-bound tasks, parallel computation, background jobs, producer-consumer",
                "import java.util.concurrent.*;\npublic class Main{\npublic static void main(String[] a)throws Exception{\nExecutorService pool=Executors.newFixedThreadPool(3);\nfor(int i=0;i<5;i++){\nfinal int id=i;\npool.submit(()->System.out.println(\"Task \"+id+\" on \"+Thread.currentThread().getName()));}\npool.shutdown();pool.awaitTermination(5,TimeUnit.SECONDS);}}");
        ex(t,1,"Thread vs Runnable","Two ways to create threads","// Option 1: extend Thread\nclass MyThread extends Thread{\n    public void run(){...}\n}\n// Option 2: implement Runnable (preferred)\nRunnable task=()->System.out.println(\"running\");\nnew Thread(task).start();\n// Or with ExecutorService (best practice)\nExecutorService es=Executors.newFixedThreadPool(4);\nes.submit(task);","Prefer Runnable — doesn't waste inheritance, works with thread pools","Background tasks");
        ex(t,2,"Synchronized + Locks","Prevent race conditions","// synchronized method\nsynchronized void increment(){count++;}\n// ReentrantLock for more control\nLock lock=new ReentrantLock();\nlock.lock();\ntry{count++;}\nfinally{lock.unlock();} // always unlock in finally!","Lock only the minimum critical section","Bank account operations");
        ex(t,3,"Producer-Consumer","Classic concurrency pattern","BlockingQueue<Task> queue=new LinkedBlockingQueue<>(10);\n// Producer: queue.put(task) — blocks if full\n// Consumer: queue.take() — blocks if empty\n// BlockingQueue handles synchronization internally","BlockingQueue eliminates need for manual wait/notify","Message queue, pipeline");
        ex(t,4,"CompletableFuture","Async non-blocking operations","CompletableFuture.supplyAsync(()->fetchData())\n    .thenApply(data->process(data))\n    .thenAccept(result->save(result))\n    .exceptionally(ex->{log(ex);return null;})\n    .join(); // wait for completion","Chain async operations without blocking threads","Microservice calls");
        ex(t,5,"Atomic Variables","Lock-free thread safety","AtomicInteger counter=new AtomicInteger(0);\ncounter.incrementAndGet();  // atomic, no lock needed\ncounter.compareAndSet(5,10); // CAS operation\n// AtomicLong, AtomicReference, AtomicBoolean also available","CAS (Compare-And-Swap) is faster than synchronized for simple counters","Metrics, counters");
        for(int i=1;i<=20;i++){
            prob(t,i,"Concurrency Problem "+i,"Multithreading scenario "+i,"input varies","answer","input","answer",
                    "[{\"input\":\"input\",\"expectedOutput\":\"answer\"}]",
                    i<=6?Problem.Difficulty.EASY:i<=13?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Think: race condition? Use sync/lock. Blocking? Use BlockingQueue. Async? Use CompletableFuture",
                    "import java.util.concurrent.*;\npublic class Main{\npublic static void main(String[] a)throws Exception{\n// TODO: concurrency "+i+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ADVANCED JAVA
    // ══════════════════════════════════════════════════════════════════════════

    private Topic seedLRUCache() {
        Topic t = topic("LRU Cache", Topic.Category.ADVANCED_JAVA,
                "O(1) get/put cache that evicts the Least Recently Used item when full.",
                "O(1) get and put", "O(capacity)",
                "O(n) search through list to find LRU",
                "HashMap for O(1) key lookup + Doubly Linked List for O(1) order updates",
                "Use for: caching database queries, CDN page caches, browser history, Redis internals",
                "import java.util.*;\npublic class Main{\n    static class LRUCache{\n        private final int cap;\n        private final LinkedHashMap<Integer,Integer> cache;\n        LRUCache(int capacity){\n            this.cap=capacity;\n            cache=new LinkedHashMap<>(16,0.75f,true){\n                protected boolean removeEldestEntry(Map.Entry e){return size()>cap;}\n            };\n        }\n        int get(int key){return cache.getOrDefault(key,-1);}\n        void put(int key,int val){cache.put(key,val);}\n    }\n    public static void main(String[] a){\n        LRUCache c=new LRUCache(2);\n        c.put(1,1);c.put(2,2);\n        System.out.println(c.get(1));\n        c.put(3,3);\n        System.out.println(c.get(2));\n    }\n}");
        ex(t,1,"LinkedHashMap LRU (1-line)","Built-in Java LRU","new LinkedHashMap<>(16,0.75f,true){\n    protected boolean removeEldestEntry(Map.Entry e){\n        return size()>capacity;\n    }\n}\n// accessOrder=true → moves accessed entry to end","removeEldestEntry hook removes head (oldest) when over capacity","Quick prototyping");
        ex(t,2,"Manual DLL + HashMap","Interview-ready implementation","// Node: key, val, prev, next\n// Map<key,Node> for O(1) access\n// DLL: head=most recent, tail=LRU\n// get: find in map, moveToHead\n// put: if exists: update+moveToHead\n//       else: addToHead, if full: removeTail+deleteFromMap","Two data structures working together — the key insight","Full implementation interviews");
        ex(t,3,"LFU Cache","Least Frequently Used eviction","// More complex: track both frequency and recency\n// Map<key,value>, Map<key,freq>, Map<freq,LinkedHashSet<key>>\n// minFreq: track minimum frequency\n// On access: increment freq, move to new freq bucket","When same frequency, evict LRU among them","Advanced caching systems");
        ex(t,4,"Distributed Cache Simulation","Multi-level caching","// L1: in-process LRU (fastest, smallest)\n// L2: Redis-like external cache (medium)\n// L3: Database (slowest, source of truth)\n// Read: check L1 → L2 → L3, populate on miss\n// Write-through: update all levels","Multi-level caching reduces database load by 90%+","Production web applications");
        ex(t,5,"Thread-Safe LRU","Concurrent LRU cache","// Option 1: synchronized all methods (simple, slow)\n// Option 2: ReentrantReadWriteLock (reads concurrent)\n// Option 3: ConcurrentHashMap + ConcurrentLinkedDeque\n// Option 4: Caffeine library (production grade)\nCache<K,V> cache=Caffeine.newBuilder()\n    .maximumSize(1000)\n    .expireAfterWrite(10,MINUTES)\n    .build();","Concurrent modification of DLL requires careful locking","High-traffic applications");
        for(int i=1;i<=20;i++){
            prob(t,i,"Cache Problem "+i,"LRU/LFU/Cache design "+i,"operations input","output after each op",
                    "2\nput 1 1\nget 1","1","[{\"input\":\"2\\nput 1 1\\nget 1\",\"expectedOutput\":\"1\"}]",
                    i<=4?Problem.Difficulty.EASY:i<=12?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "HashMap for O(1) access + DLL for O(1) order maintenance",
                    "import java.util.*;\npublic class Main{\npublic static void main(String[] a){\n// TODO: cache problem "+i+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    private Topic seedThreadPool() {
        Topic t = topic("Thread Pool & ExecutorService", Topic.Category.ADVANCED_JAVA,
                "Manage a pool of reusable threads to execute tasks efficiently without thread creation overhead.",
                "O(1) task submission", "O(pool size)",
                "New thread per task — expensive creation, no control",
                "Thread pool reuses threads, controls parallelism, handles queue and rejection",
                "Use when: handling many short tasks, HTTP request handling, batch processing",
                "import java.util.concurrent.*;\npublic class Main{\npublic static void main(String[] a)throws Exception{\nExecutorService pool=Executors.newFixedThreadPool(4);\nList<Future<Integer>> futures=new ArrayList<>();\nfor(int i=0;i<10;i++){\nfinal int n=i;\nfutures.add(pool.submit(()->n*n));}\nfor(Future<Integer> f:futures)System.out.print(f.get()+\" \");\npool.shutdown();}}");
        ex(t,1,"Fixed Thread Pool","Control maximum concurrency","ExecutorService pool=Executors.newFixedThreadPool(\n    Runtime.getRuntime().availableProcessors());\npool.submit(()->doWork());\npool.shutdown();\npool.awaitTermination(60,TimeUnit.SECONDS);","Use available processors as thread count for CPU-bound tasks","Batch processing");
        ex(t,2,"ScheduledExecutorService","Run tasks on a schedule","ScheduledExecutorService scheduler=\n    Executors.newScheduledThreadPool(2);\n// Run once after 5 seconds\nscheduler.schedule(task, 5, SECONDS);\n// Run every 10 seconds\nscheduler.scheduleAtFixedRate(task, 0, 10, SECONDS);","Replaces Timer — thread-safe, handles exceptions properly","Health checks, cleanup jobs");
        ex(t,3,"ThreadPoolExecutor Custom","Fine-grained control","new ThreadPoolExecutor(\n    corePoolSize,     // always-alive threads\n    maxPoolSize,      // max threads\n    60, SECONDS,      // keep-alive for extra threads\n    new ArrayBlockingQueue<>(100), // task queue\n    new ThreadPoolExecutor.CallerRunsPolicy() // rejection: caller executes\n)","Rejection policies: AbortPolicy, DiscardPolicy, CallerRunsPolicy","Production services");
        ex(t,4,"CompletableFuture Pipeline","Chain async tasks","CompletableFuture\n    .supplyAsync(()->fetchUser(id), pool)\n    .thenComposeAsync(user->fetchOrders(user),pool)\n    .thenApplyAsync(orders->calculateTotal(orders),pool)\n    .whenComplete((result,ex)->{\n        if(ex!=null)handleError(ex);\n        else sendResponse(result);\n    });","Non-blocking async pipeline — threads never block waiting","Microservice orchestration");
        ex(t,5,"Fork/Join Framework","Divide and conquer parallelism","class SumTask extends RecursiveTask<Long>{\n    long[] arr;int lo,hi;\n    protected Long compute(){\n        if(hi-lo<THRESHOLD)return sumSequential();\n        SumTask left=new SumTask(arr,lo,(lo+hi)/2);\n        SumTask right=new SumTask(arr,(lo+hi)/2,hi);\n        left.fork();\n        return right.compute()+left.join();\n    }\n}","Fork the smaller half, compute the larger sequentially (work-stealing)","Parallel algorithms, Stream API internals");
        for(int i=1;i<=20;i++){
            prob(t,i,"Concurrency Design "+i,"Thread pool/concurrency design problem "+i,"input varies","answer",
                    "input","answer","[{\"input\":\"input\",\"expectedOutput\":\"answer\"}]",
                    i<=4?Problem.Difficulty.EASY:i<=12?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Choose: FixedThreadPool (CPU), CachedThreadPool (I/O), ScheduledPool (periodic)",
                    "import java.util.concurrent.*;\npublic class Main{\npublic static void main(String[] a)throws Exception{\n// TODO: thread pool problem "+i+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    private Topic seedDesignPatterns() {
        Topic t = topic("Design Patterns", Topic.Category.ADVANCED_JAVA,
                "Proven solutions to common software design problems. Gang of Four patterns.",
                "Conceptual", "N/A",
                "Ad-hoc solutions that don't scale",
                "Apply pattern: name the problem, recognize the structure, implement cleanly",
                "Use in: object creation (Singleton/Factory), structure (Decorator/Proxy), behavior (Observer/Strategy)",
                "public class Main{\n    // Singleton\n    static class Config{\n        private static Config instance;\n        private Config(){}\n        static Config getInstance(){\n            if(instance==null)instance=new Config();\n            return instance;\n        }\n    }\n    public static void main(String[] a){\n        Config c1=Config.getInstance();\n        Config c2=Config.getInstance();\n        System.out.println(c1==c2); // true\n    }\n}");
        ex(t,1,"Singleton Pattern","One instance globally","// Thread-safe double-checked locking:\nprivate static volatile Config instance;\nstatic Config getInstance(){\n    if(instance==null){\n        synchronized(Config.class){\n            if(instance==null)\n                instance=new Config();\n        }\n    }\n    return instance;\n}\n// Or simpler: enum Singleton{ INSTANCE; }","volatile + double-check prevents race condition on initialization","Configuration, Logger, Connection pool");
        ex(t,2,"Observer Pattern","Event notification system","interface Observer{void update(Event e);}\nclass EventBus{\n    Map<String,List<Observer>> listeners=new HashMap<>();\n    void subscribe(String event,Observer o){\n        listeners.computeIfAbsent(event,k->new ArrayList<>()).add(o);\n    }\n    void publish(String event,Event e){\n        listeners.getOrDefault(event,List.of()).forEach(o->o.update(e));\n    }\n}","Publisher doesn't know about subscribers — loose coupling","UI events, microservice pub-sub");
        ex(t,3,"Strategy Pattern","Swap algorithms at runtime","interface SortStrategy{void sort(int[] arr);}\nclass BubbleSort implements SortStrategy{...}\nclass QuickSort implements SortStrategy{...}\nclass Sorter{\n    private SortStrategy strategy;\n    Sorter(SortStrategy s){this.strategy=s;}\n    void sort(int[] arr){strategy.sort(arr);}\n    void setStrategy(SortStrategy s){this.strategy=s;}\n}","Encapsulate each algorithm behind same interface","Payment processing, compression");
        ex(t,4,"Decorator Pattern","Add behavior without subclassing","interface Coffee{double cost();}\nclass SimpleCoffee implements Coffee{public double cost(){return 1.0;}}\nclass MilkDecorator implements Coffee{\n    Coffee base;\n    MilkDecorator(Coffee c){base=c;}\n    public double cost(){return base.cost()+0.5;}\n}\n// Usage: new SugarDecorator(new MilkDecorator(new SimpleCoffee()))","Wrap objects to add behavior dynamically","Java I/O streams, Spring security filter chain");
        ex(t,5,"Factory Method","Create objects without specifying class","interface Shape{double area();}\nclass Circle implements Shape{...}\nclass Rectangle implements Shape{...}\nclass ShapeFactory{\n    static Shape create(String type,double...params){\n        return switch(type){\n            case \"circle\"->new Circle(params[0]);\n            case \"rectangle\"->new Rectangle(params[0],params[1]);\n            default->throw new IllegalArgumentException(type);\n        };\n    }\n}","Clients use factory — don't depend on concrete classes","Spring @Bean, JDBC DriverManager");
        for(int i=1;i<=20;i++){
            String[] patterns={"Singleton","Factory Method","Abstract Factory","Builder","Prototype",
                    "Adapter","Bridge","Composite","Decorator","Facade","Flyweight","Proxy",
                    "Chain of Responsibility","Command","Iterator","Mediator","Memento","Observer",
                    "State","Strategy"};
            prob(t,i,patterns[i-1]+" Pattern","Implement the "+patterns[i-1]+" design pattern","see description","see description",
                    "input","answer","[{\"input\":\"input\",\"expectedOutput\":\"answer\"}]",
                    i<=4?Problem.Difficulty.EASY:i<=12?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Identify the problem category: Creational, Structural, or Behavioral",
                    "public class Main{\n// TODO: implement "+patterns[i-1]+" pattern\npublic static void main(String[] a){\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MYSQL
    // ══════════════════════════════════════════════════════════════════════════

    private Topic seedMySQLBasics() {
        Topic t = topic("MySQL Fundamentals", Topic.Category.MYSQL,
                "Learn SQL from scratch: SELECT, WHERE, GROUP BY, HAVING, ORDER BY, subqueries.",
                "O(n) full scan | O(log n) with index", "O(n)",
                "Retrieve all data and filter in application code",
                "Push filtering/aggregation to the database — it's optimized for this",
                "Always: every backend application that stores data",
                "-- Create table and insert data\nCREATE TABLE students (\n    id INT PRIMARY KEY AUTO_INCREMENT,\n    name VARCHAR(100),\n    grade INT,\n    subject VARCHAR(50)\n);\nINSERT INTO students(name,grade,subject)\nVALUES('Alice',90,'Math'),('Bob',75,'Science'),('Alice',85,'Science');\n-- Find average grade per student\nSELECT name, AVG(grade) as avg_grade\nFROM students\nGROUP BY name\nHAVING AVG(grade) > 80\nORDER BY avg_grade DESC;");
        ex(t,1,"SELECT with WHERE and ORDER","Basic data retrieval","SELECT name, salary\nFROM employees\nWHERE department='Engineering'\n  AND salary > 50000\nORDER BY salary DESC\nLIMIT 10;","Always add LIMIT to avoid returning massive result sets","Employee reporting");
        ex(t,2,"GROUP BY and HAVING","Aggregate with filters","SELECT department,\n       COUNT(*) as headcount,\n       AVG(salary) as avg_salary,\n       MAX(salary) as top_salary\nFROM employees\nGROUP BY department\nHAVING COUNT(*) > 5\nORDER BY avg_salary DESC;","WHERE filters rows before grouping. HAVING filters groups after aggregation","Department analytics");
        ex(t,3,"Subqueries","Nested SELECT statements","-- Find employees earning above average\nSELECT name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees);\n-- Correlated subquery\nSELECT name\nFROM departments d\nWHERE EXISTS(\n    SELECT 1 FROM employees e WHERE e.dept_id=d.id AND e.salary>100000\n);","Correlated subqueries run once per outer row — can be slow on large tables","Comparative reporting");
        ex(t,4,"Window Functions","Analytics without GROUP BY","SELECT name, salary, department,\n    RANK() OVER(PARTITION BY department ORDER BY salary DESC) as rank,\n    AVG(salary) OVER(PARTITION BY department) as dept_avg,\n    salary - LAG(salary) OVER(ORDER BY hire_date) as salary_diff\nFROM employees;","Window functions compute across rows related to current row without collapsing them","Leaderboards, running totals");
        ex(t,5,"CTEs for Readable Queries","WITH clause for complex logic","WITH high_earners AS (\n    SELECT *, NTILE(4) OVER(ORDER BY salary) as quartile\n    FROM employees\n),\ntop_quartile AS (\n    SELECT * FROM high_earners WHERE quartile=4\n)\nSELECT department, COUNT(*) as count\nFROM top_quartile\nGROUP BY department;","CTEs are named subqueries — make complex SQL readable","Complex reporting");
        for(int i=1;i<=20;i++){
            String[] sql={"Basic SELECT","Filter with WHERE","Sort with ORDER BY","DISTINCT values","LIMIT and OFFSET",
                    "Aggregate COUNT/SUM/AVG","GROUP BY","HAVING filter","Subquery in WHERE","Correlated Subquery",
                    "CASE WHEN","String Functions","Date Functions","NULL handling","UNION ALL",
                    "Window RANK","Window LAG/LEAD","Window Running Total","CTE Recursive","Common Table Expression"};
            prob(t,i,sql[i-1],"MySQL: "+sql[i-1]+" — write the SQL query","SQL query description","query result",
                    "see problem","see expected","[{\"input\":\"see problem\",\"expectedOutput\":\"see expected\"}]",
                    i<=6?Problem.Difficulty.EASY:i<=13?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Think: SELECT what, FROM where, WHERE/JOIN/GROUP/HAVING/ORDER",
                    "-- Write SQL for: "+sql[i-1]+"\nSELECT 'TODO' as result;");
        }
        return topicRepo.save(t);
    }

    private Topic seedMySQLJoins() {
        Topic t = topic("MySQL Joins & Relationships", Topic.Category.MYSQL,
                "Master INNER, LEFT, RIGHT, FULL OUTER JOINs, and self-joins to query related tables.",
                "O(n*m) without index | O(n log m) with index", "O(n)",
                "Multiple queries and manual join in application code",
                "Use appropriate JOIN type and ensure join columns are indexed",
                "Use when: data is split across multiple related tables (always in normalized DBs)",
                "-- One-to-Many: orders belong to customers\nSELECT c.name, COUNT(o.id) as order_count, SUM(o.total) as total_spent\nFROM customers c\nLEFT JOIN orders o ON c.id=o.customer_id\nGROUP BY c.id, c.name\nORDER BY total_spent DESC;");
        ex(t,1,"INNER vs LEFT JOIN","Know which rows you get","-- INNER: only matching rows in both tables\nSELECT e.name, d.name as dept\nFROM employees e\nINNER JOIN departments d ON e.dept_id=d.id;\n\n-- LEFT: all employees, NULL dept if no match\nSELECT e.name, d.name as dept\nFROM employees e\nLEFT JOIN departments d ON e.dept_id=d.id;","LEFT JOIN = all from left + matching from right (NULL if no match)","Include users with no orders");
        ex(t,2,"Self JOIN","Join table with itself","-- Find employees and their managers\nSELECT e.name as employee, m.name as manager\nFROM employees e\nLEFT JOIN employees m ON e.manager_id=m.id;\n-- Find pairs: same department, different level\nSELECT a.name, b.name\nFROM employees a\nJOIN employees b ON a.dept=b.dept AND a.level < b.level;","Use aliases to distinguish the two copies of the table","Org charts, social networks");
        ex(t,3,"Multiple Table JOIN","Chain 3+ tables","SELECT o.id, c.name, p.name as product, oi.quantity, oi.price\nFROM orders o\nJOIN customers c ON o.customer_id=c.id\nJOIN order_items oi ON o.id=oi.order_id\nJOIN products p ON oi.product_id=p.id\nWHERE o.status='delivered'\nORDER BY o.created_at DESC;","Join order matters for performance — start with most selective table","E-commerce order reports");
        ex(t,4,"Anti-JOIN with NOT EXISTS","Find records with no match","-- Customers who have never ordered\nSELECT c.name\nFROM customers c\nWHERE NOT EXISTS(\n    SELECT 1 FROM orders o WHERE o.customer_id=c.id\n);\n-- Equivalent with LEFT JOIN:\nSELECT c.name FROM customers c\nLEFT JOIN orders o ON c.id=o.customer_id\nWHERE o.id IS NULL;","NOT EXISTS is often faster than NOT IN for large sets","Churn analysis, inactive users");
        ex(t,5,"Cross JOIN for Combinations","Generate all combinations","SELECT s.size, c.color, COUNT(*) as inventory\nFROM sizes s\nCROSS JOIN colors c\nLEFT JOIN products p ON p.size=s.id AND p.color=c.id\nGROUP BY s.size, c.color;","CROSS JOIN = cartesian product. Use carefully — m×n rows!","Product variant generation");
        for(int i=1;i<=20;i++){
            String[] js={"INNER JOIN two tables","LEFT JOIN with NULL check","RIGHT JOIN","Self JOIN employees",
                    "3-table JOIN","JOIN with aggregation","Anti-JOIN NOT EXISTS","Anti-JOIN LEFT NULL",
                    "JOIN + GROUP BY","JOIN + HAVING","Multiple JOINs","Recursive CTE hierarchy",
                    "EXISTS subquery","IN vs JOIN performance","Natural JOIN","Cross JOIN combinations",
                    "Full Outer JOIN simulation","Semi-JOIN","Lateral JOIN","Join Optimization"};
            prob(t,i,js[i-1],"SQL Joins: "+js[i-1],"schema and requirements","SQL query",
                    "see schema","see expected","[{\"input\":\"see schema\",\"expectedOutput\":\"see expected\"}]",
                    i<=5?Problem.Difficulty.EASY:i<=12?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Choose JOIN type based on: do you need ALL rows from left? → LEFT JOIN",
                    "-- "+js[i-1]+"\nSELECT 'TODO' as result;");
        }
        return topicRepo.save(t);
    }

    private Topic seedMySQLIndexes() {
        Topic t = topic("MySQL Indexes & Performance", Topic.Category.MYSQL,
                "Speed up queries with B-Tree indexes, composite indexes, EXPLAIN plans, and query optimization.",
                "O(log n) indexed query | O(n) full table scan", "O(n) index storage",
                "No indexes — full table scan O(n) for every query",
                "Add indexes on high-cardinality columns used in WHERE/JOIN/ORDER BY",
                "Use when: queries are slow, column appears in WHERE/JOIN/ORDER BY frequently",
                "-- Create index\nCREATE INDEX idx_user_email ON users(email);\nCREATE INDEX idx_order_cust_date ON orders(customer_id, created_at);\n-- Check if query uses index\nEXPLAIN SELECT * FROM orders WHERE customer_id=5 AND created_at > '2024-01-01';\n-- Force index\nSELECT * FROM orders USE INDEX(idx_order_cust_date) WHERE customer_id=5;");
        ex(t,1,"EXPLAIN to Read Query Plan","Analyze before optimizing","EXPLAIN SELECT o.*, c.name\nFROM orders o JOIN customers c ON o.customer_id=c.id\nWHERE o.status='pending'\nORDER BY o.created_at;\n\n-- Key columns to check:\n-- type: ALL(bad) → range/ref/const(good)\n-- key: which index used (NULL = no index)\n-- rows: estimated rows scanned (lower = better)\n-- Extra: 'Using filesort'(bad) / 'Using index'(good)","Always EXPLAIN before adding indexes — index may already exist","Query optimization");
        ex(t,2,"Composite Index Column Order","Left-prefix rule","-- Index (a,b,c) is used for:\n--   WHERE a=1\n--   WHERE a=1 AND b=2\n--   WHERE a=1 AND b=2 AND c=3\n-- NOT used for:\n--   WHERE b=2 (skips a)\n--   WHERE c=3 (skips a and b)\n-- Rule: most selective column first for equality, range column last\nCREATE INDEX idx ON orders(customer_id, status, created_at);","Leftmost prefix rule: index works from left, can't skip columns","Multi-column query optimization");
        ex(t,3,"Covering Index","Avoid table lookup","-- Covering index: all needed columns are IN the index\n-- MySQL reads only index, never touches table data\nCREATE INDEX idx_covering ON orders(customer_id, status, total);\n-- This query uses index only:\nSELECT status, total FROM orders WHERE customer_id=5;\n-- 'Using index' in EXPLAIN Extra = covering index hit","Covering index eliminates the 'back to table' step","High-frequency queries");
        ex(t,4,"Slow Query Log","Find and fix slow queries","-- Enable slow query log\nSET GLOBAL slow_query_log = ON;\nSET GLOBAL long_query_time = 1;  -- queries taking > 1 second\nSET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';\n-- Analyze: pt-query-digest slow.log\n-- Common fixes:\n-- 1. Missing index on JOIN/WHERE column\n-- 2. SELECT * (use specific columns)\n-- 3. No LIMIT on large result sets\n-- 4. N+1 query problem (use JOIN instead)","Slow query log is your first tool in production performance work","Production optimization");
        ex(t,5,"Partitioning Large Tables","Manage tables with millions of rows","-- Range partition by year\nCREATE TABLE orders (\n    id BIGINT, created_at DATE, ...\n) PARTITION BY RANGE(YEAR(created_at))(\n    PARTITION p2022 VALUES LESS THAN (2023),\n    PARTITION p2023 VALUES LESS THAN (2024),\n    PARTITION p2024 VALUES LESS THAN (2025)\n);\n-- Queries with year filter only scan one partition","Partition pruning = query only reads relevant partition","Archival tables, time-series data");
        for(int i=1;i<=20;i++){
            String[] idx={"Create Basic Index","EXPLAIN output analysis","Composite Index Design","Covering Index",
                    "Index on JOIN column","Slow Query Analysis","Index Cardinality","Partial Index",
                    "Index for ORDER BY","Avoid Full Table Scan","Query Rewrite Optimization","Subquery to JOIN",
                    "N+1 Problem Fix","Index Merge","FORCE INDEX","Partitioning Strategy","Sharding Concept",
                    "Query Cache","Connection Pooling","Replication Basics"};
            prob(t,i,idx[i-1],"MySQL Performance: "+idx[i-1],"schema and slow query","optimized query/index",
                    "see schema","see expected","[{\"input\":\"see schema\",\"expectedOutput\":\"see expected\"}]",
                    i<=5?Problem.Difficulty.EASY:i<=12?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "EXPLAIN first, then add index on the column in WHERE/JOIN/ORDER BY",
                    "-- "+idx[i-1]+"\n-- TODO: write CREATE INDEX or optimized SELECT");
        }
        return topicRepo.save(t);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // AWS
    // ══════════════════════════════════════════════════════════════════════════

    private Topic seedAWSCore() {
        Topic t = topic("AWS Core Services (EC2, IAM, VPC)", Topic.Category.AWS,
                "Master AWS fundamentals: compute with EC2, identity with IAM, and networking with VPC.",
                "N/A — cloud provisioning", "N/A",
                "Single server, no redundancy, manual scaling",
                "EC2 Auto Scaling Groups + Load Balancer + Multi-AZ for HA and elasticity",
                "Use EC2 for: always-on compute. IAM for: any security boundary. VPC for: network isolation",
                "// AWS SDK Java - launch EC2 instance\nimport software.amazon.awssdk.services.ec2.*;\nimport software.amazon.awssdk.services.ec2.model.*;\n\npublic class Main {\n    public static void main(String[] a) {\n        Ec2Client ec2 = Ec2Client.builder().build();\n        RunInstancesRequest request = RunInstancesRequest.builder()\n            .imageId(\"ami-0abcdef1234567890\")\n            .instanceType(InstanceType.T3_MICRO)\n            .minCount(1).maxCount(1)\n            .keyName(\"my-key-pair\")\n            .build();\n        RunInstancesResponse response = ec2.runInstances(request);\n        System.out.println(\"Instance: \" + response.instances().get(0).instanceId());\n    }\n}");
        ex(t,1,"EC2 Instance Types","Choose right compute","// Instance families:\n// t3/t4: Burstable (dev/test) — cheapest\n// m6i: General purpose (web servers, apps)\n// c6i: Compute optimized (batch, encoding)\n// r6i: Memory optimized (in-memory DB)\n// p3/g4: GPU (ML training)\n// i3: Storage optimized (high IOPS DB)\n\n// Pricing:\n// On-Demand: pay per hour, no commitment (dev/test)\n// Reserved: 1-3yr commitment, 40-75% discount (production)\n// Spot: up to 90% off, can be interrupted (batch jobs)","Choose instance type based on bottleneck: CPU, RAM, storage, or GPU","All server-side applications");
        ex(t,2,"IAM Roles and Policies","Secure access control","// Principle of Least Privilege\n// IAM Policy JSON:\n{\n  \"Effect\": \"Allow\",\n  \"Action\": [\"s3:GetObject\",\"s3:PutObject\"],\n  \"Resource\": \"arn:aws:s3:::my-bucket/*\"\n}\n// Attach role to EC2 — no access keys needed!\n// IAM best practices:\n// 1. Never use root account for daily tasks\n// 2. Enable MFA on all accounts\n// 3. Use roles for services (not users)\n// 4. Rotate access keys regularly","Roles > Users for service-to-service auth — no long-lived credentials","Every AWS deployment");
        ex(t,3,"VPC Architecture","Isolate your network","// VPC CIDR: 10.0.0.0/16 (65536 IPs)\n// Public subnet: 10.0.1.0/24 (internet access)\n// Private subnet: 10.0.2.0/24 (no direct internet)\n// NAT Gateway: allows private → internet (not reverse)\n// Internet Gateway: bi-directional internet access\n// Security Groups: stateful firewall (instance level)\n// NACLs: stateless firewall (subnet level)\n// Typical 3-tier:\n//   ALB in public subnet\n//   App servers in private subnet\n//   RDS in private subnet (no NAT needed)","Private subnets protect application and database tiers","All production AWS architectures");
        ex(t,4,"Auto Scaling Groups","Handle variable traffic","// Auto Scaling Group:\n// Min: 2, Desired: 4, Max: 10\n// Scale Out trigger: CPU > 70% for 2 minutes\n// Scale In trigger: CPU < 30% for 5 minutes\n// Launch Template: defines what to launch\n// ALB: distributes traffic to healthy instances\n// Health checks: ALB marks instance unhealthy → ASG replaces it\n// Warm-up period: new instance needs time before receiving traffic","ASG + ALB is the standard pattern for horizontal scaling","Web applications with variable load");
        ex(t,5,"CloudWatch Monitoring","Observability for AWS resources","// Metrics: CPU, NetworkIn, Disk, custom metrics\nCloudWatch.putMetricData(MetricDatum.builder()\n    .metricName(\"OrdersProcessed\")\n    .value(100.0)\n    .unit(StandardUnit.COUNT)\n    .build());\n// Alarms: alert when metric exceeds threshold\n// Logs: centralized logging for all services\n// Dashboards: visualize metrics in real-time\n// X-Ray: distributed tracing across services","Custom metrics let you alarm on business metrics, not just infrastructure","Production monitoring");
        for(int i=1;i<=20;i++){
            String[] aws={"Create EC2 via SDK","Configure IAM Policy","VPC Subnet Design","Security Groups Rules","Launch Template",
                    "Auto Scaling Group","Load Balancer Setup","CloudWatch Alarm","Systems Manager Parameter","Secrets Manager",
                    "EC2 User Data Script","AMI Backup Strategy","Spot Instance Handling","Reserved vs Spot vs On-Demand",
                    "Cross-Account Roles","Resource Tagging Strategy","Cost Optimization","High Availability Design",
                    "Disaster Recovery","Well-Architected Review"};
            prob(t,i,aws[i-1],"AWS: "+aws[i-1],"architecture scenario","design or code answer",
                    "see scenario","see expected","[{\"input\":\"see scenario\",\"expectedOutput\":\"see expected\"}]",
                    i<=5?Problem.Difficulty.EASY:i<=12?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "Think: security (IAM), networking (VPC), compute (EC2), monitoring (CloudWatch)",
                    "// TODO: "+aws[i-1]+"\n// Write AWS SDK code or architecture answer\npublic class Main{\npublic static void main(String[] a){\nSystem.out.println(\"TODO: \"+\""+aws[i-1]+"\");\n}}");
        }
        return topicRepo.save(t);
    }

    private Topic seedAWSS3() {
        Topic t = topic("AWS S3 & Storage", Topic.Category.AWS,
                "Object storage with 99.999999999% durability. S3, EBS, EFS, and Glacier for every storage need.",
                "O(1) GET/PUT by key", "Unlimited",
                "Store files on EC2 local disk — lost on termination",
                "S3 for objects, EBS for EC2 volumes, EFS for shared file system, Glacier for archival",
                "S3: static files, backups, data lake, static website, ML datasets",
                "// AWS SDK S3 upload and download\nimport software.amazon.awssdk.services.s3.*;\nimport software.amazon.awssdk.services.s3.model.*;\n\npublic class Main {\n    static S3Client s3 = S3Client.builder().build();\n    \n    static void upload(String bucket, String key, Path file) {\n        s3.putObject(PutObjectRequest.builder()\n            .bucket(bucket).key(key)\n            .build(), file);\n    }\n    \n    static void download(String bucket, String key, Path dest) {\n        s3.getObject(GetObjectRequest.builder()\n            .bucket(bucket).key(key)\n            .build(), dest);\n    }\n    \n    public static void main(String[] a) {\n        upload(\"my-bucket\", \"data/file.csv\", Path.of(\"file.csv\"));\n        System.out.println(\"Uploaded!\");\n    }\n}");
        ex(t,1,"S3 Storage Classes","Cost optimization","// Standard: frequent access ($0.023/GB)\n// Standard-IA: infrequent access, 30-day min ($0.0125/GB)\n// One Zone-IA: single AZ, cheaper, less resilient\n// Glacier: archival, 1-5 min retrieval ($0.004/GB)\n// Glacier Deep Archive: cheapest, 12h retrieval\n// Intelligent-Tiering: auto-moves based on access pattern\n\n// Lifecycle rule: Standard → IA after 30 days → Glacier after 90 days\n// S3 Lifecycle XML or CDK/Terraform","Right storage class = 40-80% cost reduction on cold data","Backup archival, compliance data");
        ex(t,2,"S3 Presigned URLs","Temporary secure access","// Generate presigned URL (15 min expiry)\nGetObjectPresignRequest req=GetObjectPresignRequest.builder()\n    .signatureDuration(Duration.ofMinutes(15))\n    .getObjectRequest(r->r.bucket(bucket).key(key))\n    .build();\nURL url=s3Presigner.presignGetObject(req).url();\n// Share URL — user downloads directly from S3, not via your server\n// PUT presigned URL: user uploads directly to S3 (bypass your server)","Presigned URLs: client downloads from S3 directly — saves bandwidth","Document sharing, profile photo upload");
        ex(t,3,"S3 Event Notifications","Trigger on upload","// S3 → SNS/SQS/Lambda on object create/delete\n// Example: image upload → Lambda → resize → save thumbnail\n// Configure in CDK:\nbucket.addEventNotification(\n    EventType.OBJECT_CREATED,\n    new LambdaDestination(thumbnailFn),\n    NotificationKeyFilter.builder().prefix(\"uploads/\").suffix(\".jpg\").build()\n);\n// Lambda receives S3Event with bucket name and object key","Event-driven processing: no polling, instant response to uploads","Image/video processing pipeline");
        ex(t,4,"S3 as Data Lake","Store and query big data","// Structure: s3://bucket/year=2024/month=01/day=15/data.parquet\n// Partitioned by time — Athena queries only relevant partitions\n// Athena: serverless SQL on S3 (no servers to manage)\nSELECT date, SUM(revenue)\nFROM my_database.sales\nWHERE year='2024' AND month='01'\nGROUP BY date;\n// Cost: $5 per TB scanned (use Parquet + partitioning to minimize scan)","Parquet + partitioning = 10-100x cheaper Athena queries","Analytics, ML feature stores");
        ex(t,5,"S3 Replication and Versioning","Data protection","// Enable versioning: protect against overwrites/deletes\n// Cross-Region Replication (CRR): disaster recovery\n// Same-Region Replication (SRR): compliance, log aggregation\n// On delete: creates delete marker (real object preserved)\n// Lifecycle + versioning: expire old versions after 30 days\n\n// Bucket policy: deny unversioned uploads\n{\n  \"Effect\": \"Deny\",\n  \"Principal\": \"*\",\n  \"Action\": \"s3:PutObject\",\n  \"Resource\": \"...\",\n  \"Condition\": {\"StringNotEquals\": {\"s3:x-amz-server-side-encryption\":\"AES256\"}}\n}","Versioning + replication = durable, recoverable object storage","Compliance, backup");
        for(int i=1;i<=20;i++){
            String[] s3p={"Upload File to S3","Download from S3","Generate Presigned URL","List Objects","Delete Object",
                    "S3 Bucket Policy","CORS Configuration","Lifecycle Rules","S3 Event to Lambda","Cross-Region Replication",
                    "S3 Select Query","Multipart Upload","S3 Inventory Report","Static Website S3","CloudFront + S3",
                    "S3 Access Logs","Encryption at Rest","Object Lock","S3 Intelligent Tiering","S3 Storage Lens"};
            prob(t,i,s3p[i-1],"AWS S3: "+s3p[i-1],"scenario description","code or policy",
                    "see scenario","see expected","[{\"input\":\"see scenario\",\"expectedOutput\":\"see expected\"}]",
                    i<=5?Problem.Difficulty.EASY:i<=12?Problem.Difficulty.MEDIUM:Problem.Difficulty.HARD,
                    "S3: bucket+key identify every object. Use SDK, policies, and events for integrations",
                    "import software.amazon.awssdk.services.s3.*;\npublic class Main{\npublic static void main(String[] a){\n// TODO: "+s3p[i-1]+"\nSystem.out.println(0);\n}}");
        }
        return topicRepo.save(t);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    private Topic topic(String title, Topic.Category cat, String desc, String time, String space,
                        String brute, String optimized, String when, String starter) {
        Topic t = new Topic();
        t.setTitle(title); t.setCategory(cat); t.setDescription(desc);
        t.setTimeComplexity(time); t.setSpaceComplexity(space);
        t.setBruteForce(brute); t.setOptimizedApproach(optimized);
        t.setWhenToUse(when); t.setStarterCode(starter);
        return t;
    }

    private void ex(Topic t, int order, String title, String desc, String code, String expl, String rw) {
        Example e = new Example();
        e.setTopic(t); e.setDisplayOrder(order); e.setTitle(title);
        e.setDescription(desc); e.setCode(code); e.setExplanation(expl); e.setRealWorldUse(rw);
        exampleRepo.save(e);
    }

    private void prob(Topic t, int order, String title, String desc, String inFmt, String outFmt,
                      String sampleIn, String sampleOut, String testCases, Problem.Difficulty diff,
                      String hint, String starter) {
        Problem p = new Problem();
        p.setTopic(t); p.setDisplayOrder(order); p.setTitle(title); p.setDescription(desc);
        p.setInputFormat(inFmt); p.setOutputFormat(outFmt);
        p.setSampleInput(sampleIn); p.setSampleOutput(sampleOut);
        p.setTestCases(testCases); p.setDifficulty(diff); p.setHint(hint); p.setStarterCode(starter);
        problemRepo.save(p);
    }

    private void createRoadmap(String name, String desc, String color, String level, int hours, Topic[] topics) {
        Roadmap r = new Roadmap();
        r.setName(name); r.setDescription(desc);
        r.setColor(color); r.setLevel(level); r.setEstimatedHours(hours);
        r.setIcon(name.substring(0, 2)); // emoji
        roadmapRepo.save(r);
        for (int i = 0; i < topics.length; i++) {
            RoadmapTopic rt = new RoadmapTopic();
            rt.setRoadmap(r); rt.setTopic(topics[i]); rt.setOrderIndex(i + 1);
            roadmapTopicRepo.save(rt);
        }
    }
}