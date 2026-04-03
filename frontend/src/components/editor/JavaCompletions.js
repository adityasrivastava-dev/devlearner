// ─────────────────────────────────────────────────────────────────────────────
// JavaCompletions.js
// Full Java IDE completions: stdlib methods, snippets, algorithm templates
// Hover documentation for all major APIs
// ─────────────────────────────────────────────────────────────────────────────

// ── Hover documentation map ───────────────────────────────────────────────────
export const HOVER_DOCS = {
  // System
  'System.out.println':  '**println(Object x)**\nPrints the argument then a newline. Accepts any type.',
  'System.out.print':    '**print(Object x)**\nPrints the argument without a newline.',
  'System.out.printf':   '**printf(String fmt, Object... args)**\nFormatted output. Common: `%d %s %f %.2f %n`',
  'System.exit':         '**System.exit(int status)**\nTerminates the JVM. `0` = success, non-zero = error.',
  'System.currentTimeMillis': '**currentTimeMillis() → long**\nCurrent time in milliseconds since epoch.',

  // Arrays
  'Arrays.sort':         '**Arrays.sort(T[] a)**\nSorts array in-place. O(n log n). For int[]/long[]/char[] uses dual-pivot quicksort.',
  'Arrays.fill':         '**Arrays.fill(T[] a, T val)**\nFills entire array with value. O(n).',
  'Arrays.copyOf':       '**Arrays.copyOf(T[] original, int newLength)**\nReturns new array. Truncates or pads with 0/null.',
  'Arrays.copyOfRange':  '**Arrays.copyOfRange(T[] a, int from, int to)**\nCopies range `[from, to)` into new array.',
  'Arrays.toString':     '**Arrays.toString(int[] a)**\nReturns `[1, 2, 3]` format string. For 2D use `Arrays.deepToString`.',
  'Arrays.deepToString': '**Arrays.deepToString(Object[][] a)**\nReturns nested `[[1,2],[3,4]]` format.',
  'Arrays.binarySearch': '**Arrays.binarySearch(T[] a, T key) → int**\nRequires sorted array. Returns index or `-(insertion point)-1`.',
  'Arrays.equals':       '**Arrays.equals(T[] a, T[] b) → boolean**\nElement-wise equality check.',
  'Arrays.stream':       '**Arrays.stream(T[] a)**\nReturns a Stream for pipeline operations.',

  // Collections
  'Collections.sort':       '**Collections.sort(List<T> list)**\nSorts list in natural order. O(n log n).',
  'Collections.reverse':    '**Collections.reverse(List<?> list)**\nReverses list in-place. O(n).',
  'Collections.shuffle':    '**Collections.shuffle(List<?> list)**\nRandomly shuffles list. O(n).',
  'Collections.min':        '**Collections.min(Collection<T> c) → T**\nReturns minimum element.',
  'Collections.max':        '**Collections.max(Collection<T> c) → T**\nReturns maximum element.',
  'Collections.frequency':  '**Collections.frequency(Collection<?> c, Object o) → int**\nCounts occurrences of o in c.',
  'Collections.fill':       '**Collections.fill(List<T> list, T obj)**\nReplaces all elements with obj.',
  'Collections.nCopies':    '**Collections.nCopies(int n, T o) → List<T>**\nReturns immutable list with n copies of o.',
  'Collections.unmodifiableList': '**Collections.unmodifiableList(List<T> list)**\nWraps list to prevent modification.',
  'Collections.reverseOrder':     '**Collections.reverseOrder() → Comparator<T>**\nComparator for descending order. Use in PriorityQueue.',
  'Collections.disjoint':         '**Collections.disjoint(Collection<?> c1, Collection<?> c2) → boolean**\nTrue if no elements in common.',
  'Collections.swap':             '**Collections.swap(List<?> list, int i, int j)**\nSwaps elements at positions i and j.',

  // Math
  'Math.max':   '**Math.max(a, b)**\nReturns larger of a and b. Works for int/long/double/float.',
  'Math.min':   '**Math.min(a, b)**\nReturns smaller of a and b.',
  'Math.abs':   '**Math.abs(x)**\nAbsolute value. Note: `Math.abs(Integer.MIN_VALUE)` = MIN_VALUE (overflow).',
  'Math.pow':   '**Math.pow(double a, double b) → double**\nReturns a^b. For int powers use loop or fast-power.',
  'Math.sqrt':  '**Math.sqrt(double a) → double**\nSquare root. `(int)Math.sqrt(n)` for integer root.',
  'Math.log':   '**Math.log(double a) → double**\nNatural log (base e). For log₂: `Math.log(n)/Math.log(2)`.',
  'Math.log10': '**Math.log10(double a) → double**\nBase-10 logarithm.',
  'Math.floor': '**Math.floor(double a) → double**\nLargest integer ≤ a.',
  'Math.ceil':  '**Math.ceil(double a) → double**\nSmallest integer ≥ a.',
  'Math.round': '**Math.round(double a) → long**\nRounds to nearest integer.',
  'Math.PI':    '**Math.PI**\nπ = 3.141592653589793',
  'Math.E':     '**Math.E**\ne = 2.718281828459045',
  'Math.gcd':   '**Note:** Java has no Math.gcd. Use `BigInteger.gcd()` or write your own:\n```java\nstatic int gcd(int a, int b) { return b==0 ? a : gcd(b, a%b); }\n```',

  // Integer / Long
  'Integer.MAX_VALUE':      '**Integer.MAX_VALUE = 2147483647** (2^31 - 1)\nFor large sums use `long` to avoid overflow.',
  'Integer.MIN_VALUE':      '**Integer.MIN_VALUE = -2147483648** (-2^31)',
  'Integer.parseInt':       '**Integer.parseInt(String s) → int**\nConverts String to int. Throws NumberFormatException if invalid.',
  'Integer.toString':       '**Integer.toString(int i) → String**\nConverts int to String.',
  'Integer.toBinaryString': '**Integer.toBinaryString(int i) → String**\nBinary representation. e.g. `7` → `"111"`',
  'Integer.bitCount':       '**Integer.bitCount(int i) → int**\nCounts set bits (1s) in binary. Useful for bitmask problems.',
  'Integer.highestOneBit':  '**Integer.highestOneBit(int i) → int**\nReturns value with only the highest bit set.',
  'Long.MAX_VALUE':         '**Long.MAX_VALUE = 9223372036854775807** (2^63 - 1)',
  'Long.parseLong':         '**Long.parseLong(String s) → long**\nConverts String to long.',

  // String
  'String.valueOf':       '**String.valueOf(Object obj) → String**\nConverts any value to String. Null-safe.',
  'String.format':        '**String.format(String fmt, Object... args) → String**\nFormatted string. Common: `%d %s %f %.2f`',
  'String.join':          '**String.join(CharSequence delimiter, Iterable<? extends CharSequence> elements) → String**\nJoins elements with delimiter. e.g. `String.join(", ", list)`',
  'String.charAt':        '**charAt(int index) → char**\nCharacter at position. O(1).',
  'String.substring':     '**substring(int begin, int end) → String**\nExtract `[begin, end)`. O(n).',
  'String.contains':      '**contains(CharSequence s) → boolean**\nO(n) substring search.',
  'String.indexOf':       '**indexOf(String str) → int**\nFirst occurrence index or -1.',
  'String.replace':       '**replace(CharSequence old, CharSequence new) → String**\nReplaces all occurrences.',
  'String.split':         '**split(String regex) → String[]**\nSplits by regex. `"a,b".split(",")` → `["a","b"]`.',
  'String.trim':          '**trim() → String**\nRemoves leading/trailing whitespace.',
  'String.toCharArray':   '**toCharArray() → char[]**\nConverts to char array for in-place manipulation.',
  'String.equals':        '**equals(Object obj) → boolean**\nContent equality. Never use `==` for String comparison!',
  'String.compareTo':     '**compareTo(String other) → int**\nLexicographic comparison. <0, 0, or >0.',
  'String.isEmpty':       '**isEmpty() → boolean**\nTrue if length() == 0.',
  'String.isBlank':       '**isBlank() → boolean**\nTrue if empty or only whitespace (Java 11+).',

  // StringBuilder
  'StringBuilder.append':    '**append(Object obj) → StringBuilder**\nAppends string representation. Chainable.',
  'StringBuilder.insert':    '**insert(int offset, Object obj) → StringBuilder**\nInserts at position.',
  'StringBuilder.delete':    '**delete(int start, int end) → StringBuilder**\nDeletes `[start, end)`.',
  'StringBuilder.reverse':   '**reverse() → StringBuilder**\nReverses content in-place. O(n).',
  'StringBuilder.toString':  '**toString() → String**\nConverts to immutable String.',
  'StringBuilder.length':    '**length() → int**\nCurrent length of buffer.',
  'StringBuilder.charAt':    '**charAt(int index) → char**\nCharacter at index.',
  'StringBuilder.setCharAt': '**setCharAt(int index, char ch)**\nReplaces character at index.',
  'StringBuilder.deleteCharAt': '**deleteCharAt(int index)**\nRemoves character at index.',

  // Scanner
  'Scanner.nextInt':    '**nextInt() → int**\nReads next integer token from input.',
  'Scanner.nextLong':   '**nextLong() → long**\nReads next long token.',
  'Scanner.nextDouble': '**nextDouble() → double**\nReads next double token.',
  'Scanner.next':       '**next() → String**\nReads next whitespace-delimited token.',
  'Scanner.nextLine':   '**nextLine() → String**\nReads entire next line. After nextInt(), call nextLine() once to consume newline.',
  'Scanner.hasNext':    '**hasNext() → boolean**\nTrue if another token available.',
  'Scanner.hasNextInt': '**hasNextInt() → boolean**\nTrue if next token is a valid int.',
};

// ── Build completion list ─────────────────────────────────────────────────────
export function getJavaCompletions(monaco, range) {
  const Kind    = monaco.languages.CompletionItemKind;
  const Rule    = monaco.languages.CompletionItemInsertTextRule;
  const Snippet = Rule.InsertAsSnippet;

  // helper: build a snippet item
  const snip = (label, insertText, detail, doc = '') => ({
    label, insertText, detail,
    documentation: { value: doc },
    kind: Kind.Snippet,
    insertTextRules: Snippet,
    range,
    sortText: '0' + label, // sorts snippets first
  });

  // helper: build a method/function item
  const method = (label, insertText, detail, doc = '') => ({
    label, insertText, detail,
    documentation: { value: doc },
    kind: Kind.Method,
    insertTextRules: Snippet,
    range,
  });

  // helper: keyword
  const kw = (label, insertText, detail = '') => ({
    label, insertText: insertText || label,
    detail, kind: Kind.Keyword,
    insertTextRules: Snippet,
    range,
  });

  // helper: constant
  const constant = (label, insertText, detail, doc = '') => ({
    label, insertText, detail,
    documentation: { value: doc },
    kind: Kind.Constant,
    range,
  });

  return [

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 1 — CLASS TEMPLATES & BOILERPLATE
    // ════════════════════════════════════════════════════════════════════════
    snip('main',    'public static void main(String[] args) {\n\t${0}\n}',
      'main method', 'Entry point for Java programs'),

    snip('class',   'public class ${1:ClassName} {\n\t${0}\n}',
      'class declaration', 'Declare a public class'),

    snip('sol',
      'import java.util.*;\nimport java.io.*;\n\npublic class Main {\n\tpublic static void main(String[] args) throws IOException {\n\t\tBufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n\t\t${0}\n\t}\n}',
      'Competitive prog template (BufferedReader)', 'Fastest input for competitive programming'),

    snip('solsc',
      'import java.util.*;\n\npublic class Main {\n\tpublic static void main(String[] args) {\n\t\tScanner sc = new Scanner(System.in);\n\t\t${0}\n\t}\n}',
      'Competitive prog template (Scanner)', 'Standard Scanner input template'),

    snip('method',  'public ${1:void} ${2:methodName}(${3}) {\n\t${0}\n}',
      'method declaration'),

    snip('smethod', 'public static ${1:int} ${2:solve}(${3}) {\n\t${0}\n}',
      'static method'),

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 2 — INPUT READING
    // ════════════════════════════════════════════════════════════════════════
    snip('sc',      'Scanner sc = new Scanner(System.in);',
      'Scanner declaration', '**Scanner** — standard competitive programming input'),

    snip('scint',   'int ${1:n} = sc.nextInt();',
      'read int', '`nextInt()` reads next integer token'),

    snip('sclong',  'long ${1:n} = sc.nextLong();',
      'read long'),

    snip('scdbl',   'double ${1:d} = sc.nextDouble();',
      'read double'),

    snip('scstr',   'String ${1:s} = sc.next();',
      'read String token'),

    snip('scline',  'String ${1:line} = sc.nextLine();',
      'read full line'),

    snip('scn',     'int n = sc.nextInt();\nint[] arr = new int[n];\nfor (int i = 0; i < n; i++) arr[i] = sc.nextInt();',
      'read n + int array', 'Read n then n integers into array'),

    snip('sc2',     'int ${1:a} = sc.nextInt(), ${2:b} = sc.nextInt();',
      'read 2 ints'),

    snip('sc3',     'int ${1:a} = sc.nextInt(), ${2:b} = sc.nextInt(), ${3:c} = sc.nextInt();',
      'read 3 ints'),

    snip('br',
      'BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\nStringTokenizer st;\n',
      'BufferedReader setup', 'Fastest input — use for large inputs'),

    snip('brline',  'st = new StringTokenizer(br.readLine());\nint ${1:n} = Integer.parseInt(st.nextToken());',
      'read line with StringTokenizer'),

    snip('readints', 'st = new StringTokenizer(br.readLine());\nint[] ${1:arr} = new int[${2:n}];\nfor (int i = 0; i < ${2:n}; i++) ${1:arr}[i] = Integer.parseInt(st.nextToken());',
      'read int array from line'),

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 3 — OUTPUT
    // ════════════════════════════════════════════════════════════════════════
    snip('sout',    'System.out.println(${1});',
      'System.out.println', 'Print with newline'),

    snip('sop',     'System.out.print(${1});',
      'System.out.print', 'Print without newline'),

    snip('spf',     'System.out.printf("${1:%d%n}", ${2});',
      'System.out.printf', 'Formatted output. %d=int %s=string %f=float %.2f=2 decimals %n=newline'),

    snip('sb',      'StringBuilder sb = new StringBuilder();\n${0}\nSystem.out.println(sb);',
      'StringBuilder output', 'Build output string then print once — faster than many printlns'),

    snip('sbw',
      'PrintWriter pw = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));\n${0}\npw.flush();',
      'PrintWriter (fast output)', 'Fastest output for competitive programming'),

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 4 — CONTROL FLOW
    // ════════════════════════════════════════════════════════════════════════
    snip('fori',    'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${0}\n}',
      'for loop'),

    snip('forr',    'for (int ${1:i} = ${2:n} - 1; ${1:i} >= 0; ${1:i}--) {\n\t${0}\n}',
      'for loop reversed'),

    snip('fore',    'for (${1:int} ${2:item} : ${3:collection}) {\n\t${0}\n}',
      'for-each loop'),

    snip('while',   'while (${1:condition}) {\n\t${0}\n}',
      'while loop'),

    snip('dowhile', 'do {\n\t${0}\n} while (${1:condition});',
      'do-while loop'),

    snip('tern',    '${1:condition} ? ${2:a} : ${3:b}',
      'ternary operator'),

    snip('ifel',    'if (${1:condition}) {\n\t${2}\n} else {\n\t${3}\n}',
      'if-else'),

    snip('sw',      'switch (${1:var}) {\n\tcase ${2:val}: ${0} break;\n\tdefault: break;\n}',
      'switch statement'),

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 5 — DATA STRUCTURES
    // ════════════════════════════════════════════════════════════════════════

    // Arrays
    snip('arrint',  'int[] ${1:arr} = new int[${2:n}];',
      'int array', 'Default value: 0'),
    snip('arrlong', 'long[] ${1:arr} = new long[${2:n}];',
      'long array'),
    snip('arr2d',   'int[][] ${1:grid} = new int[${2:rows}][${3:cols}];',
      '2D int array'),
    snip('arrfill', 'Arrays.fill(${1:arr}, ${2:val});',
      'Arrays.fill'),
    snip('arrsort', 'Arrays.sort(${1:arr});',
      'Arrays.sort'),
    snip('arrstr',  'System.out.println(Arrays.toString(${1:arr}));',
      'print array'),

    // ArrayList
    snip('al',      'List<${1:Integer}> ${2:list} = new ArrayList<>();',
      'ArrayList<T>'),
    snip('alstr',   'List<String> ${1:list} = new ArrayList<>();',
      'ArrayList<String>'),

    // LinkedList
    snip('ll',      'LinkedList<${1:Integer}> ${2:list} = new LinkedList<>();',
      'LinkedList<T>'),

    // HashMap
    snip('hm',      'Map<${1:String}, ${2:Integer}> ${3:map} = new HashMap<>();',
      'HashMap<K,V>'),
    snip('hmget',   '${1:map}.getOrDefault(${2:key}, ${3:0})',
      'map.getOrDefault', 'Returns value or default if key missing'),
    snip('hmmerge', '${1:map}.merge(${2:key}, 1, Integer::sum);',
      'freq count with merge', 'Idiomatic frequency counter: absent→1, present→add 1'),
    snip('hmcomp',  '${1:map}.computeIfAbsent(${2:key}, k -> new ArrayList<>())',
      'computeIfAbsent'),
    snip('hmiter',  'for (Map.Entry<${1:String}, ${2:Integer}> entry : ${3:map}.entrySet()) {\n\t${1:String} key = entry.getKey();\n\t${2:Integer} val = entry.getValue();\n\t${0}\n}',
      'iterate HashMap entries'),

    // TreeMap
    snip('tm',      'TreeMap<${1:Integer}, ${2:Integer}> ${3:map} = new TreeMap<>();',
      'TreeMap<K,V> (sorted)', 'Keys sorted in natural order. floorKey/ceilingKey available.'),

    // HashSet
    snip('hs',      'Set<${1:Integer}> ${2:set} = new HashSet<>();',
      'HashSet<T>'),

    // TreeSet
    snip('ts',      'TreeSet<${1:Integer}> ${2:set} = new TreeSet<>();',
      'TreeSet<T> (sorted)', 'Sorted unique elements. first/last/floor/ceiling available.'),

    // PriorityQueue
    snip('pq',      'PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>();',
      'PriorityQueue (min-heap)', 'poll() returns minimum element. O(log n) offer/poll.'),
    snip('pqmax',   'PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>(Collections.reverseOrder());',
      'PriorityQueue (max-heap)', 'poll() returns maximum element.'),
    snip('pqcmp',   'PriorityQueue<${1:int[]}> ${2:pq} = new PriorityQueue<>((a, b) -> ${3:a[0] - b[0]});',
      'PriorityQueue (custom comparator)'),
    snip('pqpair',  'PriorityQueue<long[]> ${1:pq} = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));',
      'PriorityQueue of long[] pairs (min dist)', 'Common for Dijkstra: [distance, node]'),

    // Deque / Stack
    snip('deque',   'Deque<${1:Integer}> ${2:dq} = new ArrayDeque<>();',
      'ArrayDeque (fast Deque)', 'Preferred over Stack and LinkedList for queue/stack'),
    snip('stack',   'Deque<${1:Integer}> ${2:stack} = new ArrayDeque<>();\n// push: stack.push(x)  pop: stack.pop()  peek: stack.peek()',
      'Stack via ArrayDeque'),
    snip('mono',    'Deque<Integer> ${1:mono} = new ArrayDeque<>();\nfor (int i = 0; i < n; i++) {\n\twhile (!${1:mono}.isEmpty() && ${2:arr}[${1:mono}.peekLast()] ${3:>=} ${2:arr}[i])\n\t\t${1:mono}.pollLast();\n\t${1:mono}.offerLast(i);\n\t${0}\n}',
      'Monotonic deque', 'Sliding window min/max in O(n). Change >= to <= for min stack.'),

    // Union-Find
    snip('uf',
      'int[] parent = new int[${1:n}], rank = new int[${1:n}];\nfor (int i = 0; i < ${1:n}; i++) parent[i] = i;\n\nstatic int find(int[] p, int x) { return p[x]==x ? x : (p[x]=find(p,p[x])); }\nstatic boolean union(int[] p, int[] r, int a, int b) {\n\ta=find(p,a); b=find(p,b);\n\tif (a==b) return false;\n\tif (r[a]<r[b]) { int t=a;a=b;b=t; }\n\tp[b]=a; if (r[a]==r[b]) r[a]++; return true;\n}',
      'Union-Find (Disjoint Set Union)', 'Path compression + union by rank. O(α(n)) ≈ O(1) per op.'),

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 6 — ALGORITHM TEMPLATES
    // ════════════════════════════════════════════════════════════════════════

    // Binary Search
    snip('bs',
      'int ${1:lo} = 0, ${2:hi} = ${3:arr}.length - 1;\nwhile (${1:lo} <= ${2:hi}) {\n\tint ${4:mid} = ${1:lo} + (${2:hi} - ${1:lo}) / 2;\n\tif (${3:arr}[${4:mid}] == ${5:target}) return ${4:mid};\n\telse if (${3:arr}[${4:mid}] < ${5:target}) ${1:lo} = ${4:mid} + 1;\n\telse ${2:hi} = ${4:mid} - 1;\n}\nreturn -1; // not found',
      'Binary search (exact match)', 'O(log n). Avoids lo+hi overflow with mid=lo+(hi-lo)/2.'),

    snip('bsleft',
      '// Find leftmost index where arr[i] >= target\nint ${1:lo} = 0, ${2:hi} = ${3:n};\nwhile (${1:lo} < ${2:hi}) {\n\tint ${4:mid} = ${1:lo} + (${2:hi} - ${1:lo}) / 2;\n\tif (${3:arr}[${4:mid}] < ${5:target}) ${1:lo} = ${4:mid} + 1;\n\telse ${2:hi} = ${4:mid};\n}\nreturn ${1:lo}; // insertion point',
      'Binary search (lower bound)', 'Returns leftmost position where arr[i] >= target'),

    snip('bsans',
      '// Binary search on answer\nlong ${1:lo} = 0, ${2:hi} = ${3:1_000_000_000L};\nwhile (${1:lo} < ${2:hi}) {\n\tlong ${4:mid} = ${1:lo} + (${2:hi} - ${1:lo}) / 2;\n\tif (canDo(${4:mid})) ${2:hi} = ${4:mid};\n\telse ${1:lo} = ${4:mid} + 1;\n}\nreturn ${1:lo};',
      'Binary search on answer (min satisfying value)',
      'Classic pattern: "find minimum X such that canDo(X) is true"'),

    // Two Pointers
    snip('twopt',
      'int ${1:left} = 0, ${2:right} = ${3:arr}.length - 1;\nwhile (${1:left} < ${2:right}) {\n\tint sum = ${3:arr}[${1:left}] + ${3:arr}[${2:right}];\n\tif (sum == ${4:target}) {\n\t\t// found\n\t\t${0}\n\t\t${1:left}++; ${2:right}--;\n\t} else if (sum < ${4:target}) ${1:left}++;\n\telse ${2:right}--;\n}',
      'Two pointer (sorted array)', 'O(n). Find pair summing to target.'),

    // Sliding Window
    snip('sw',
      'int ${1:left} = 0, ${2:maxLen} = 0;\n// Add your window state (e.g. sum, freq map)\nfor (int ${3:right} = 0; ${3:right} < ${4:n}; ${3:right}++) {\n\t// expand: include arr[right]\n\t${0}\n\twhile (/* window invalid */) {\n\t\t// shrink: remove arr[left]\n\t\t${1:left}++;\n\t}\n\t${2:maxLen} = Math.max(${2:maxLen}, ${3:right} - ${1:left} + 1);\n}',
      'Sliding window template', 'Variable-size window. O(n) — each element added/removed once.'),

    snip('swfixed',
      'int ${1:sum} = 0;\nfor (int i = 0; i < ${2:k}; i++) ${1:sum} += ${3:arr}[i];\nint ${4:best} = ${1:sum};\nfor (int i = ${2:k}; i < ${5:n}; i++) {\n\t${1:sum} += ${3:arr}[i] - ${3:arr}[i - ${2:k}];\n\t${4:best} = Math.max(${4:best}, ${1:sum});\n}',
      'Fixed-size sliding window', 'O(n) — slide window of size k, track running sum'),

    // BFS
    snip('bfs',
      'Queue<${1:Integer}> queue = new LinkedList<>();\nboolean[] visited = new boolean[${2:n}];\nqueue.offer(${3:start});\nvisited[${3:start}] = true;\nint level = 0;\nwhile (!queue.isEmpty()) {\n\tint size = queue.size();\n\tfor (int i = 0; i < size; i++) {\n\t\t${1:Integer} node = queue.poll();\n\t\t${0}\n\t\t// for each neighbor: if (!visited[nb]) { visited[nb]=true; queue.offer(nb); }\n\t}\n\tlevel++;\n}',
      'BFS (level-order)', 'O(V+E). Level variable tracks distance from source.'),

    snip('bfsgrid',
      'int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};\nQueue<int[]> q = new LinkedList<>();\nq.offer(new int[]{${1:sr}, ${2:sc}});\nboolean[][] vis = new boolean[${3:rows}][${4:cols}];\nvis[${1:sr}][${2:sc}] = true;\nwhile (!q.isEmpty()) {\n\tint[] cur = q.poll();\n\tint r = cur[0], c = cur[1];\n\t${0}\n\tfor (int[] d : dirs) {\n\t\tint nr = r+d[0], nc = c+d[1];\n\t\tif (nr>=0 && nr<${3:rows} && nc>=0 && nc<${4:cols} && !vis[nr][nc]) {\n\t\t\tvis[nr][nc] = true;\n\t\t\tq.offer(new int[]{nr, nc});\n\t\t}\n\t}\n}',
      'BFS on 2D grid', '4-directional BFS with bounds checking and visited tracking'),

    // DFS
    snip('dfs',
      'boolean[] visited = new boolean[${1:n}];\nList<List<Integer>> graph = new ArrayList<>();\nfor (int i = 0; i < ${1:n}; i++) graph.add(new ArrayList<>());\n\nvoid dfs(int node) {\n\tvisited[node] = true;\n\t${0}\n\tfor (int nb : graph.get(node))\n\t\tif (!visited[nb]) dfs(nb);\n}',
      'DFS on graph'),

    snip('dfsgrid',
      'void dfs(int[][] grid, boolean[][] vis, int r, int c) {\n\tif (r<0||r>=grid.length||c<0||c>=grid[0].length||vis[r][c]) return;\n\tvis[r][c] = true;\n\t${0}\n\tdfs(grid, vis, r+1, c); dfs(grid, vis, r-1, c);\n\tdfs(grid, vis, r, c+1); dfs(grid, vis, r, c-1);\n}',
      'DFS on 2D grid'),

    // Dynamic Programming
    snip('dp1d',
      'int[] dp = new int[${1:n} + 1];\ndp[0] = ${2:0};\nfor (int i = 1; i <= ${1:n}; i++) {\n\tdp[i] = ${0};\n}',
      '1D DP array'),

    snip('dp2d',
      'int[][] dp = new int[${1:m} + 1][${2:n} + 1];\n// Initialize base cases\nfor (int i = 0; i <= ${1:m}; i++) dp[i][0] = ${3:0};\nfor (int j = 0; j <= ${2:n}; j++) dp[0][j] = ${4:0};\nfor (int i = 1; i <= ${1:m}; i++) {\n\tfor (int j = 1; j <= ${2:n}; j++) {\n\t\t${0}\n\t}\n}',
      '2D DP (classic LCS/knapsack layout)'),

    snip('memo',
      'Map<String, ${1:Integer}> memo = new HashMap<>();\n\n${1:Integer} solve(${2:int n}) {\n\tString key = String.valueOf(${2:n});\n\tif (memo.containsKey(key)) return memo.get(key);\n\t// base case\n\tif (${3:n <= 0}) return 0;\n\t${1:Integer} result = ${0};\n\tmemo.put(key, result);\n\treturn result;\n}',
      'Memoized recursion (top-down DP)'),

    // Sorting with comparator
    snip('sort2d',
      'Arrays.sort(${1:arr}, (a, b) -> ${2:a[0] - b[0]});',
      'Sort 2D array by first column'),

    snip('sortlist',
      '${1:list}.sort((a, b) -> ${2:Integer.compare(a, b)});',
      'Sort list with comparator'),

    snip('sortcmp',
      'Arrays.sort(${1:arr}, Comparator.comparingInt(${2:a -> a[0]}).thenComparingInt(${3:a -> a[1]}));',
      'Sort with chained comparator'),

    // Dijkstra
    snip('dijkstra',
      'int[] dist = new int[${1:n}];\nArrays.fill(dist, Integer.MAX_VALUE);\ndist[${2:src}] = 0;\nPriorityQueue<int[]> pq = new PriorityQueue<>((a,b)->a[0]-b[0]);\npq.offer(new int[]{0, ${2:src}});\nwhile (!pq.isEmpty()) {\n\tint[] cur = pq.poll();\n\tint d = cur[0], u = cur[1];\n\tif (d > dist[u]) continue;\n\tfor (int[] edge : adj.get(u)) {\n\t\tint v = edge[0], w = edge[1];\n\t\tif (dist[u] + w < dist[v]) {\n\t\t\tdist[v] = dist[u] + w;\n\t\t\tpq.offer(new int[]{dist[v], v});\n\t\t}\n\t}\n}',
      'Dijkstra shortest path', 'O((V+E) log V). Works for non-negative weights only.'),

    // Prefix sum
    snip('prefix',
      'int[] prefix = new int[${1:n} + 1];\nfor (int i = 0; i < ${1:n}; i++) prefix[i+1] = prefix[i] + ${2:arr}[i];\n// Range sum [l, r]: prefix[r+1] - prefix[l]',
      'Prefix sum array', 'O(n) build, O(1) range sum query'),

    snip('prefix2d',
      'int[][] p = new int[${1:m}+1][${2:n}+1];\nfor (int i=1;i<=${1:m};i++)\n\tfor (int j=1;j<=${2:n};j++)\n\t\tp[i][j] = ${3:grid}[i-1][j-1] + p[i-1][j] + p[i][j-1] - p[i-1][j-1];\n// Sum (r1,c1)-(r2,c2): p[r2+1][c2+1]-p[r1][c2+1]-p[r2+1][c1]+p[r1][c1]',
      '2D prefix sum'),

    // Bit manipulation
    snip('bits',
      '// Set bit k:   n | (1<<k)\n// Clear bit k: n & ~(1<<k)\n// Toggle bit k:n ^ (1<<k)\n// Check bit k: (n >> k) & 1\n// Count bits:  Integer.bitCount(n)\n// Lowest set:  n & (-n)\n// Remove lowest set: n & (n-1)\n',
      'Bit manipulation cheatsheet'),

    snip('bitmask',
      'for (int mask = 0; mask < (1 << ${1:n}); mask++) {\n\t// iterate all subsets\n\tfor (int i = 0; i < ${1:n}; i++) {\n\t\tif ((mask >> i & 1) == 1) {\n\t\t\t${0} // bit i is set\n\t\t}\n\t}\n}',
      'Bitmask subset enumeration', 'Iterate all 2^n subsets. O(2^n * n)'),

    // GCD / LCM
    snip('gcd',
      'static long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }\nstatic long lcm(long a, long b) { return a / gcd(a, b) * b; }',
      'GCD + LCM', 'Euclidean algorithm. O(log min(a,b))'),

    // Modular arithmetic
    snip('mod',
      'final long MOD = 1_000_000_007L;\n// (a + b) % MOD\n// (a * b) % MOD\n// Use modpow for a^b % MOD',
      'MOD constant (10^9+7)'),

    snip('modpow',
      'static long modpow(long base, long exp, long mod) {\n\tlong result = 1; base %= mod;\n\twhile (exp > 0) {\n\t\tif ((exp & 1) == 1) result = result * base % mod;\n\t\tbase = base * base % mod;\n\t\texp >>= 1;\n\t}\n\treturn result;\n}',
      'Fast modular exponentiation', 'a^b mod m in O(log b). Used for Fermat inverse, combination.'),

    // Topological sort
    snip('topo',
      'int[] inDeg = new int[${1:n}];\nList<List<Integer>> adj = new ArrayList<>();\nfor (int i=0;i<${1:n};i++) adj.add(new ArrayList<>());\n// build graph: adj.get(u).add(v); inDeg[v]++;\nQueue<Integer> q = new LinkedList<>();\nfor (int i=0;i<${1:n};i++) if (inDeg[i]==0) q.offer(i);\nList<Integer> order = new ArrayList<>();\nwhile (!q.isEmpty()) {\n\tint u = q.poll(); order.add(u);\n\tfor (int v : adj.get(u)) if (--inDeg[v]==0) q.offer(v);\n}\n// if order.size() < n: cycle exists',
      'Kahn BFS topological sort', 'O(V+E). order.size() < n means cycle exists.'),

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 7 — STDLIB METHOD COMPLETIONS
    // ════════════════════════════════════════════════════════════════════════

    // Arrays methods
    method('Arrays.sort',        'Arrays.sort(${1:arr})',        'Arrays.sort(arr)', HOVER_DOCS['Arrays.sort']),
    method('Arrays.sort_range',  'Arrays.sort(${1:arr}, ${2:from}, ${3:to})', 'Arrays.sort(arr, from, to)', 'Sort range [from, to)'),
    method('Arrays.sort_comp',   'Arrays.sort(${1:arr}, (a,b) -> ${2:a-b})', 'Arrays.sort(arr, comparator)', 'Sort with custom comparator (only for Object arrays)'),
    method('Arrays.fill',        'Arrays.fill(${1:arr}, ${2:val})',             'Arrays.fill(arr, val)',          HOVER_DOCS['Arrays.fill']),
    method('Arrays.fill_range',  'Arrays.fill(${1:arr}, ${2:from}, ${3:to}, ${4:val})', 'Arrays.fill(arr, from, to, val)', 'Fill range [from, to) with val'),
    method('Arrays.copyOf',      'Arrays.copyOf(${1:arr}, ${2:newLen})',        'Arrays.copyOf(arr, len)',        HOVER_DOCS['Arrays.copyOf']),
    method('Arrays.copyOfRange', 'Arrays.copyOfRange(${1:arr}, ${2:from}, ${3:to})', 'Arrays.copyOfRange(arr, from, to)', HOVER_DOCS['Arrays.copyOfRange']),
    method('Arrays.toString',    'Arrays.toString(${1:arr})',                   'Arrays.toString(arr)',           HOVER_DOCS['Arrays.toString']),
    method('Arrays.deepToString','Arrays.deepToString(${1:arr})',               'Arrays.deepToString(arr)',       HOVER_DOCS['Arrays.deepToString']),
    method('Arrays.binarySearch','Arrays.binarySearch(${1:arr}, ${2:key})',     'Arrays.binarySearch(arr, key)',  HOVER_DOCS['Arrays.binarySearch']),
    method('Arrays.equals',      'Arrays.equals(${1:a}, ${2:b})',               'Arrays.equals(a, b)',            HOVER_DOCS['Arrays.equals']),
    method('Arrays.asList',      'Arrays.asList(${1:items})',                   'Arrays.asList(...)',             'Returns fixed-size List backed by array. Cannot add/remove.'),
    method('Arrays.stream',      'Arrays.stream(${1:arr})',                     'Arrays.stream(arr)',             HOVER_DOCS['Arrays.stream']),

    // Collections methods
    method('Collections.sort',          'Collections.sort(${1:list})',                    'Collections.sort(list)',             HOVER_DOCS['Collections.sort']),
    method('Collections.sort_comp',     'Collections.sort(${1:list}, (a,b) -> ${2:})',   'Collections.sort(list, comparator)', 'Sort with custom comparator'),
    method('Collections.reverse',       'Collections.reverse(${1:list})',                 'Collections.reverse(list)',          HOVER_DOCS['Collections.reverse']),
    method('Collections.shuffle',       'Collections.shuffle(${1:list})',                 'Collections.shuffle(list)',          HOVER_DOCS['Collections.shuffle']),
    method('Collections.min',           'Collections.min(${1:coll})',                     'Collections.min(coll)',              HOVER_DOCS['Collections.min']),
    method('Collections.max',           'Collections.max(${1:coll})',                     'Collections.max(coll)',              HOVER_DOCS['Collections.max']),
    method('Collections.frequency',     'Collections.frequency(${1:coll}, ${2:obj})',     'Collections.frequency(coll, obj)',   HOVER_DOCS['Collections.frequency']),
    method('Collections.reverseOrder',  'Collections.reverseOrder()',                     'Collections.reverseOrder()',         HOVER_DOCS['Collections.reverseOrder']),
    method('Collections.swap',          'Collections.swap(${1:list}, ${2:i}, ${3:j})',    'Collections.swap(list, i, j)',       HOVER_DOCS['Collections.swap']),
    method('Collections.fill_list',     'Collections.fill(${1:list}, ${2:val})',          'Collections.fill(list, val)',        HOVER_DOCS['Collections.fill']),
    method('Collections.nCopies',       'Collections.nCopies(${1:n}, ${2:val})',          'Collections.nCopies(n, val)',        HOVER_DOCS['Collections.nCopies']),

    // Math methods
    method('Math.max',   'Math.max(${1:a}, ${2:b})',      'Math.max(a, b)',      HOVER_DOCS['Math.max']),
    method('Math.min',   'Math.min(${1:a}, ${2:b})',      'Math.min(a, b)',      HOVER_DOCS['Math.min']),
    method('Math.abs',   'Math.abs(${1:x})',               'Math.abs(x)',         HOVER_DOCS['Math.abs']),
    method('Math.pow',   'Math.pow(${1:a}, ${2:b})',      'Math.pow(a, b)',      HOVER_DOCS['Math.pow']),
    method('Math.sqrt',  'Math.sqrt(${1:x})',              'Math.sqrt(x)',        HOVER_DOCS['Math.sqrt']),
    method('Math.log',   'Math.log(${1:x})',               'Math.log(x)',         HOVER_DOCS['Math.log']),
    method('Math.log10', 'Math.log10(${1:x})',             'Math.log10(x)',       HOVER_DOCS['Math.log10']),
    method('Math.floor', 'Math.floor(${1:x})',             'Math.floor(x)',       HOVER_DOCS['Math.floor']),
    method('Math.ceil',  'Math.ceil(${1:x})',              'Math.ceil(x)',        HOVER_DOCS['Math.ceil']),
    method('Math.round', 'Math.round(${1:x})',             'Math.round(x)',       HOVER_DOCS['Math.round']),
    method('Math.log2',  'Math.log(${1:x}) / Math.log(2)','Math.log2(x) — workaround', 'Java has no Math.log2. Use this expression.'),
    method('Math.clamp', 'Math.max(${1:lo}, Math.min(${2:hi}, ${3:val}))', 'clamp(val, lo, hi)', 'Clamp value to [lo, hi] range'),

    // Integer utilities
    constant('INT_MAX',  'Integer.MAX_VALUE', 'Integer.MAX_VALUE = 2147483647', HOVER_DOCS['Integer.MAX_VALUE']),
    constant('INT_MIN',  'Integer.MIN_VALUE', 'Integer.MIN_VALUE = -2147483648', HOVER_DOCS['Integer.MIN_VALUE']),
    constant('LONG_MAX', 'Long.MAX_VALUE',    'Long.MAX_VALUE = 9223372036854775807', HOVER_DOCS['Long.MAX_VALUE']),
    constant('INF',      '(int) 1e9',         'INF = 10^9 (safe for int sums)', 'Use 1e18 for long, 1e9 for int'),
    constant('LINF',     '(long) 1e18',       'LINF = 10^18 (safe for long sums)'),
    method('Integer.parseInt',   'Integer.parseInt(${1:s})',          'parseInt(String)',   HOVER_DOCS['Integer.parseInt']),
    method('Integer.toString',   'Integer.toString(${1:i})',          'toString(int)',      HOVER_DOCS['Integer.toString']),
    method('Integer.bitCount',   'Integer.bitCount(${1:n})',          'bitCount(int)',      HOVER_DOCS['Integer.bitCount']),
    method('Integer.toBinaryStr','Integer.toBinaryString(${1:n})',    'toBinaryString(int)',HOVER_DOCS['Integer.toBinaryString']),
    method('Integer.highestBit', 'Integer.highestOneBit(${1:n})',     'highestOneBit(int)', HOVER_DOCS['Integer.highestOneBit']),
    method('Integer.compare',    'Integer.compare(${1:a}, ${2:b})',   'Integer.compare(a,b)', 'Safe int comparison for Comparators — avoids overflow from a-b'),
    method('Long.compare',       'Long.compare(${1:a}, ${2:b})',      'Long.compare(a,b)',    'Safe long comparison'),
    method('Long.parseLong',     'Long.parseLong(${1:s})',            'parseLong(String)',  HOVER_DOCS['Long.parseLong']),

    // Character utilities
    method('Character.isDigit',    'Character.isDigit(${1:c})',     'isDigit(char)',     'True if c is 0-9'),
    method('Character.isLetter',   'Character.isLetter(${1:c})',    'isLetter(char)',    'True if c is a-z or A-Z'),
    method('Character.isUpperCase','Character.isUpperCase(${1:c})', 'isUpperCase(char)', 'True if c is A-Z'),
    method('Character.isLowerCase','Character.isLowerCase(${1:c})', 'isLowerCase(char)', 'True if c is a-z'),
    method('Character.toUpperCase','Character.toUpperCase(${1:c})', 'toUpperCase(char)'),
    method('Character.toLowerCase','Character.toLowerCase(${1:c})', 'toLowerCase(char)'),

    // String.valueOf shortcuts
    method('strval', 'String.valueOf(${1:x})', 'String.valueOf(x)', HOVER_DOCS['String.valueOf']),

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 8 — JAVA KEYWORDS
    // ════════════════════════════════════════════════════════════════════════
    kw('public',    'public '),
    kw('private',   'private '),
    kw('protected', 'protected '),
    kw('static',    'static '),
    kw('final',     'final '),
    kw('void',      'void '),
    kw('return',    'return ${1};', 'return value'),
    kw('new',       'new ${1}(${2})', 'new instance'),
    kw('null',      'null'),
    kw('true',      'true'),
    kw('false',     'false'),
    kw('this',      'this'),
    kw('super',     'super'),
    kw('instanceof','instanceof ${1:ClassName}'),
    kw('try',       'try {\n\t${1}\n} catch (${2:Exception} e) {\n\t${3:e.printStackTrace();}\n}', 'try-catch block'),
    kw('throw',     'throw new ${1:RuntimeException}("${2:message}");', 'throw exception'),
  ];
}