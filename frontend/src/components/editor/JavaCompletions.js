// ─────────────────────────────────────────────────────────────────────────────
// JavaCompletions.js
// Full Java IDE completions: stdlib methods, snippets, algorithm templates
// Hover documentation for all major APIs
// ─────────────────────────────────────────────────────────────────────────────

// ── Hover documentation map ───────────────────────────────────────────────────
// Keys: "Class.method" for static/utility calls; bare "method" for instance methods.
// Hover provider checks full-key match in line context first, then word-only match.
export const HOVER_DOCS = {

  // ════════════════════════════════════════════════════════════════════════════
  // SYSTEM
  // ════════════════════════════════════════════════════════════════════════════
  'System.out.println': '**void println(Object x)**\nPrints the argument + newline to stdout. Accepts any type — calls `toString()` on objects.\n\n**Example:**\n```java\nSystem.out.println("Hello");  // Hello\nSystem.out.println(42);       // 42\nSystem.out.println(null);     // null\n```',

  'System.out.print': '**void print(Object x)**\nPrints the argument without a trailing newline.',

  'System.out.printf': '**void printf(String fmt, Object... args)**\nFormatted output. Common specifiers:\n- `%d` int, `%s` String, `%f` float, `%.2f` 2 decimals, `%n` newline\n- `%5d` right-align, `%-5d` left-align, `%05d` zero-pad\n\n**Example:**\n```java\nSystem.out.printf("%-10s %5d%n", "Alice", 42);\n```',

  'System.exit': '**void System.exit(int status)**\nTerminates the JVM immediately. `0` = normal exit, non-zero = error.\n\n⚠️ Skips finally blocks and shutdown hooks in some contexts.',

  'System.currentTimeMillis': '**long System.currentTimeMillis()**\nWall-clock time in milliseconds since Unix epoch (1970-01-01 UTC). Use for coarse timing.\n\n**Example:**\n```java\nlong start = System.currentTimeMillis();\n// ... work ...\nSystem.out.println(System.currentTimeMillis() - start + " ms");\n```',

  'System.nanoTime': '**long System.nanoTime()**\nHigh-resolution nanosecond timer. Only meaningful as a difference — not wall-clock time.\n\n**Example:**\n```java\nlong t0 = System.nanoTime();\n// ... work ...\nlong ns = System.nanoTime() - t0;\n```',

  'System.arraycopy': '**void System.arraycopy(Object src, int srcPos, Object dest, int destPos, int length)**\nFast native array copy. Faster than a manual loop.\n\n**Parameters:**\n- `src` — source array\n- `srcPos` — start index in source\n- `dest` — destination array\n- `destPos` — start index in destination\n- `length` — number of elements to copy\n\n**Example:**\n```java\nint[] a = {1,2,3,4,5};\nint[] b = new int[3];\nSystem.arraycopy(a, 1, b, 0, 3);  // b = [2,3,4]\n```',

  // ════════════════════════════════════════════════════════════════════════════
  // ARRAYS (java.util.Arrays)
  // ════════════════════════════════════════════════════════════════════════════
  'Arrays.sort': '**void Arrays.sort(T[] a)**\nSorts array in-place. **O(n log n)**.\n- Primitive arrays (`int[]`, `long[]`, `char[]`) → dual-pivot quicksort\n- Object arrays → TimSort (stable)\n\n**Overloads:**\n- `Arrays.sort(a, fromIdx, toIdx)` — sort subarray `[from, to)`\n- `Arrays.sort(T[] a, Comparator<T> c)` — custom comparator (objects only)\n\n**Example:**\n```java\nint[] arr = {5, 2, 8, 1};\nArrays.sort(arr);         // [1, 2, 5, 8]\nArrays.sort(arr, 0, 2);   // sort only first 2 elements\n```',

  'Arrays.fill': '**void Arrays.fill(T[] a, T val)**\nFills entire array with `val`. **O(n)**.\n\n**Overload:** `Arrays.fill(a, fromIdx, toIdx, val)` — fill subrange.\n\n**Example:**\n```java\nint[] dp = new int[10];\nArrays.fill(dp, Integer.MAX_VALUE);  // sentinel fill\nArrays.fill(dp, 2, 5, 0);           // fill indices [2,5)\n```',

  'Arrays.copyOf': '**T[] Arrays.copyOf(T[] original, int newLength)**\nReturns a new array. If `newLength > original.length`, pads with `0`/`false`/`null`.\n\n**Example:**\n```java\nint[] a = {1, 2, 3};\nint[] b = Arrays.copyOf(a, 5);  // [1, 2, 3, 0, 0]\nint[] c = Arrays.copyOf(a, 2);  // [1, 2]\n```',

  'Arrays.copyOfRange': '**T[] Arrays.copyOfRange(T[] a, int from, int to)**\nCopies range `[from, to)` into a new array.\n\n**Example:**\n```java\nint[] a = {1, 2, 3, 4, 5};\nint[] sub = Arrays.copyOfRange(a, 1, 4);  // [2, 3, 4]\n```',

  'Arrays.toString': '**String Arrays.toString(int[] a)**\nReturns readable `[1, 2, 3]` format. Works for all primitive array types.\nFor nested arrays use `Arrays.deepToString`.\n\n**Example:**\n```java\nSystem.out.println(Arrays.toString(new int[]{1,2,3}));  // [1, 2, 3]\n```',

  'Arrays.deepToString': '**String Arrays.deepToString(Object[] a)**\nReturns nested format like `[[1, 2], [3, 4]]` for 2D arrays.\n\n**Example:**\n```java\nint[][] grid = {{1,2},{3,4}};\nSystem.out.println(Arrays.deepToString(grid));  // [[1, 2], [3, 4]]\n```',

  'Arrays.binarySearch': '**int Arrays.binarySearch(T[] a, T key)**\nBinary search on a **sorted** array. Returns the index, or `-(insertion point) - 1` if not found.\n\n**⚠️ Array must be sorted first!**\n\n**Example:**\n```java\nint[] a = {1, 3, 5, 7};\nint i = Arrays.binarySearch(a, 5);   // 2\nint j = Arrays.binarySearch(a, 4);   // -3  (would insert at index 2)\n```',

  'Arrays.equals': '**boolean Arrays.equals(T[] a, T[] b)**\nElement-wise equality check for 1D arrays. For nested use `Arrays.deepEquals`.',

  'Arrays.stream': '**Stream<T> Arrays.stream(T[] a)**\nWraps array in a Stream for pipeline operations.\n\n**Example:**\n```java\nint sum = Arrays.stream(nums).sum();\nint max = Arrays.stream(nums).max().getAsInt();\nlong count = Arrays.stream(nums).filter(x -> x > 0).count();\n```',

  'Arrays.asList': '**List<T> Arrays.asList(T... a)**\nReturns a **fixed-size** List backed by the array — cannot add/remove, but can set.\nTo get a resizable list: `new ArrayList<>(Arrays.asList(...))`\n\n**Example:**\n```java\nList<String> fixed = Arrays.asList("a", "b", "c");\nList<String> mutable = new ArrayList<>(Arrays.asList("a", "b"));\n```',

  // ════════════════════════════════════════════════════════════════════════════
  // COLLECTIONS (java.util.Collections)
  // ════════════════════════════════════════════════════════════════════════════
  'Collections.sort': '**void Collections.sort(List<T> list)**\nSorts list in natural (ascending) order. **O(n log n)** — TimSort.\n\n**Overload:** `Collections.sort(list, comparator)`\n\n**Example:**\n```java\nList<Integer> list = new ArrayList<>(Arrays.asList(3, 1, 2));\nCollections.sort(list);                     // [1, 2, 3]\nCollections.sort(list, Comparator.reverseOrder()); // [3, 2, 1]\n```',

  'Collections.reverse': '**void Collections.reverse(List<?> list)**\nReverses list in-place. **O(n)**.\n\n**Example:**\n```java\nList<Integer> list = Arrays.asList(1, 2, 3);\nCollections.reverse(list);  // [3, 2, 1]\n```',

  'Collections.shuffle': '**void Collections.shuffle(List<?> list)**\nRandomly permutes the list. **O(n)**. Overload accepts a `Random` for deterministic shuffle.',

  'Collections.min': '**T Collections.min(Collection<T> c)**\nReturns the minimum element according to natural ordering.\n**Throws:** `NoSuchElementException` if collection is empty.',

  'Collections.max': '**T Collections.max(Collection<T> c)**\nReturns the maximum element according to natural ordering.\n**Throws:** `NoSuchElementException` if collection is empty.',

  'Collections.frequency': '**int Collections.frequency(Collection<?> c, Object o)**\nCounts how many elements in `c` equal `o`. **O(n)**.',

  'Collections.fill': '**void Collections.fill(List<T> list, T obj)**\nReplaces every element in the list with `obj`. **O(n)**.',

  'Collections.nCopies': '**List<T> Collections.nCopies(int n, T o)**\nReturns an **immutable** list with `n` copies of `o`.\n\n**Example:**\n```java\nList<Integer> zeros = Collections.nCopies(5, 0);  // [0, 0, 0, 0, 0]\n```',

  'Collections.unmodifiableList': '**List<T> Collections.unmodifiableList(List<T> list)**\nWraps list so mutations throw `UnsupportedOperationException`.',

  'Collections.reverseOrder': '**Comparator<T> Collections.reverseOrder()**\nComparator that imposes reverse natural ordering. Useful for max-heaps:\n```java\nPriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());\n```',

  'Collections.disjoint': '**boolean Collections.disjoint(Collection<?> c1, Collection<?> c2)**\nReturns `true` if the two collections have no elements in common.',

  'Collections.swap': '**void Collections.swap(List<?> list, int i, int j)**\nSwaps elements at indices `i` and `j` in the list.',

  'Collections.binarySearch': '**int Collections.binarySearch(List<T> list, T key)**\nBinary search on a **sorted** list. Returns index or negative insertion-point value.\n**⚠️ List must be sorted!**',

  // ════════════════════════════════════════════════════════════════════════════
  // MATH
  // ════════════════════════════════════════════════════════════════════════════
  'Math.max': '**T Math.max(T a, T b)**\nReturns the larger of `a` and `b`. Works for `int`, `long`, `double`, `float`.\n\n**Example:**\n```java\nMath.max(3, 7)       // 7\nMath.max(-1, -5)     // -1\n```',

  'Math.min': '**T Math.min(T a, T b)**\nReturns the smaller of `a` and `b`. Works for `int`, `long`, `double`, `float`.',

  'Math.abs': '**T Math.abs(T x)**\nAbsolute value.\n\n⚠️ `Math.abs(Integer.MIN_VALUE)` returns `Integer.MIN_VALUE` (overflow)!\nUse `Math.abs((long) x)` to be safe.\n\n**Example:**\n```java\nMath.abs(-5)   // 5\nMath.abs(3)    // 3\n```',

  'Math.pow': '**double Math.pow(double a, double b)**\nReturns `a` raised to the power `b`. **Result is always `double`**.\nFor modular exponentiation or integer powers, use a custom fast-power function.\n\n**Example:**\n```java\nMath.pow(2, 10)   // 1024.0\nMath.pow(9, 0.5)  // 3.0 (same as sqrt)\n```',

  'Math.sqrt': '**double Math.sqrt(double a)**\nSquare root. For integer root: `(int) Math.sqrt(n)`.\n\n**Example:**\n```java\nMath.sqrt(16)    // 4.0\nMath.sqrt(2)     // 1.4142...\n(int)Math.sqrt(8) // 2\n```',

  'Math.log': '**double Math.log(double a)**\nNatural logarithm (base *e*). For log base 2: `Math.log(n) / Math.log(2)`.\n\n**Example:**\n```java\nMath.log(Math.E)          // 1.0\nMath.log(8) / Math.log(2) // 3.0  (log₂ 8)\n```',

  'Math.log10': '**double Math.log10(double a)**\nLogarithm base 10.\n\n**Example:**\n```java\nMath.log10(1000)  // 3.0\nMath.log10(100)   // 2.0\n```',

  'Math.floor': '**double Math.floor(double a)**\nLargest integer ≤ `a`.\n\n**Example:**\n```java\nMath.floor(3.9)   // 3.0\nMath.floor(-3.1)  // -4.0\n```',

  'Math.ceil': '**double Math.ceil(double a)**\nSmallest integer ≥ `a`.\n\n**Example:**\n```java\nMath.ceil(3.1)   // 4.0\nMath.ceil(-3.9)  // -3.0\n```',

  'Math.round': '**long Math.round(double a)**\nRounds to nearest integer (ties round up).\n\n**Example:**\n```java\nMath.round(3.5)   // 4\nMath.round(3.4)   // 3\nMath.round(-3.5)  // -3\n```',

  'Math.random': '**double Math.random()**\nReturns a pseudo-random `double` in `[0.0, 1.0)`.\n\n**Example:**\n```java\nint rand = (int)(Math.random() * 10);  // [0, 9]\n// Prefer: new Random().nextInt(bound)\n```',

  'Math.hypot': '**double Math.hypot(double x, double y)**\nReturns `√(x² + y²)` without intermediate overflow/underflow.\n\n**Example:**\n```java\nMath.hypot(3, 4)   // 5.0  (Pythagorean triple)\n```',

  'Math.floorDiv': '**int Math.floorDiv(int x, int y)**\nInteger division rounding **towards negative infinity** (unlike `/` which truncates towards zero).\n\n**Example:**\n```java\nMath.floorDiv(-7, 2)   // -4  (vs -7/2 = -3)\nMath.floorDiv(7, 2)    //  3\n```',

  'Math.floorMod': '**int Math.floorMod(int x, int y)**\nModulo that always returns a non-negative result when `y > 0`. Unlike `%` which can be negative.\n\n**Example:**\n```java\nMath.floorMod(-1, 10)  // 9   (vs -1%10 = -1)\nMath.floorMod(11, 10)  // 1\n```',

  'Math.PI': '**double Math.PI = 3.141592653589793**\nThe mathematical constant π.',

  'Math.E': '**double Math.E = 2.718281828459045**\nEuler\'s number *e*, the base of natural logarithm.',

  'Math.gcd': '**Note:** Java has no `Math.gcd`. Use `BigInteger.gcd()` or write your own:\n```java\nstatic int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }\nstatic int lcm(int a, int b) { return a / gcd(a, b) * b; }\n```',

  'Math.toRadians': '**double Math.toRadians(double degrees)**\nConverts degrees to radians. `degrees × π / 180`.',

  'Math.toDegrees': '**double Math.toDegrees(double radians)**\nConverts radians to degrees. `radians × 180 / π`.',

  // ════════════════════════════════════════════════════════════════════════════
  // INTEGER / LONG / CHARACTER
  // ════════════════════════════════════════════════════════════════════════════
  'Integer.MAX_VALUE': '**int Integer.MAX_VALUE = 2,147,483,647** (2³¹ − 1)\n\n⚠️ Adding 1 overflows to `Integer.MIN_VALUE`. Use `long` for sums that might exceed this.',

  'Integer.MIN_VALUE': '**int Integer.MIN_VALUE = −2,147,483,648** (−2³¹)\n\n⚠️ `Math.abs(Integer.MIN_VALUE)` still returns `Integer.MIN_VALUE` (overflow).',

  'Integer.parseInt': '**int Integer.parseInt(String s)**\nParses a decimal integer string.\n\n**Overload:** `Integer.parseInt(s, radix)` — e.g. `parseInt("ff", 16)` = 255\n\n**Throws:** `NumberFormatException` if `s` is not a valid integer.\n\n**Example:**\n```java\nInteger.parseInt("42")       // 42\nInteger.parseInt("-17")      // -17\nInteger.parseInt("1010", 2)  // 10 (binary)\n```',

  'Integer.toString': '**String Integer.toString(int i)**\nConverts `int` to its decimal String representation.\n\n**Overload:** `Integer.toString(i, radix)` for other bases.',

  'Integer.toBinaryString': '**String Integer.toBinaryString(int i)**\nReturns unsigned binary String. e.g. `7` → `"111"`, `-1` → 32 `1`s.\n\n**Example:**\n```java\nInteger.toBinaryString(10)   // "1010"\nInteger.toBinaryString(-1)   // "11111111111111111111111111111111"\n```',

  'Integer.toHexString': '**String Integer.toHexString(int i)**\nReturns unsigned hex String. e.g. `255` → `"ff"`.',

  'Integer.bitCount': '**int Integer.bitCount(int i)**\nCounts the number of `1` bits (population count). Useful for bitmask DP.\n\n**Example:**\n```java\nInteger.bitCount(7)    // 3  (0b111)\nInteger.bitCount(12)   // 2  (0b1100)\n```',

  'Integer.highestOneBit': '**int Integer.highestOneBit(int i)**\nReturns the value with only the highest set bit. `0` if `i == 0`.\n\n**Example:**\n```java\nInteger.highestOneBit(10)  // 8  (0b1000)\nInteger.highestOneBit(1)   // 1\n```',

  'Integer.numberOfLeadingZeros': '**int Integer.numberOfLeadingZeros(int i)**\nNumber of zero bits before the highest set bit.\n\n**Example:**\n```java\nInteger.numberOfLeadingZeros(1)  // 31\nInteger.numberOfLeadingZeros(8)  // 28\n```',

  'Integer.numberOfTrailingZeros': '**int Integer.numberOfTrailingZeros(int i)**\nNumber of zero bits after the lowest set bit.\n\n**Example:**\n```java\nInteger.numberOfTrailingZeros(8)  // 3  (0b1000)\nInteger.numberOfTrailingZeros(1)  // 0\n```',

  'Integer.compare': '**int Integer.compare(int x, int y)**\nComparable-style comparison: negative if x < y, 0 if equal, positive if x > y.\nPrefer over `x - y` subtraction (which can overflow).\n\n**Example:**\n```java\nIntger.compare(3, 5)   // -1\nInteger.compare(5, 3)  // 1\n```',

  'Integer.valueOf': '**Integer Integer.valueOf(int i)**\nBoxes an `int` into an `Integer`. Values in `[-128, 127]` are cached.\nPrefer auto-boxing (`Integer x = 5;`) over explicit `valueOf` in modern Java.',

  'Long.MAX_VALUE': '**long Long.MAX_VALUE = 9,223,372,036,854,775,807** (2⁶³ − 1)\n\nUse when `int` might overflow (e.g. prefix sums on large arrays).',

  'Long.MIN_VALUE': '**long Long.MIN_VALUE = −9,223,372,036,854,775,808** (−2⁶³)',

  'Long.parseLong': '**long Long.parseLong(String s)**\nParses a decimal long string.\n\n**Overload:** `Long.parseLong(s, radix)`\n\n**Throws:** `NumberFormatException` if invalid.',

  'Character.isDigit': '**boolean Character.isDigit(char ch)**\nReturns `true` if `ch` is `\'0\'`–`\'9\'`.\n\n**Example:**\n```java\nCharacter.isDigit(\'5\')   // true\nCharacter.isDigit(\'a\')   // false\n// Useful in: ch - \'0\' to get digit value\n```',

  'Character.isLetter': '**boolean Character.isLetter(char ch)**\nReturns `true` if `ch` is a letter (A-Z, a-z, or Unicode letters).',

  'Character.isLetterOrDigit': '**boolean Character.isLetterOrDigit(char ch)**\nReturns `true` if `ch` is a letter or digit.',

  'Character.isAlphabetic': '**boolean Character.isAlphabetic(char ch)**\nReturns `true` if `ch` is alphabetic (broader than `isLetter` for Unicode).',

  'Character.isUpperCase': '**boolean Character.isUpperCase(char ch)**\nReturns `true` if `ch` is an uppercase letter.',

  'Character.isLowerCase': '**boolean Character.isLowerCase(char ch)**\nReturns `true` if `ch` is a lowercase letter.',

  'Character.toUpperCase': '**char Character.toUpperCase(char ch)**\nConverts `ch` to uppercase.\n\n**Example:**\n```java\nchar c = Character.toUpperCase(\'a\');  // \'A\'\n```',

  'Character.toLowerCase': '**char Character.toLowerCase(char ch)**\nConverts `ch` to lowercase.\n\n**Example:**\n```java\nchar c = Character.toLowerCase(\'A\');  // \'a\'\n// Arithmetic: ch - \'a\' = 0-25 for lowercase letters\n```',

  'Character.isWhitespace': '**boolean Character.isWhitespace(char ch)**\nReturns `true` for space, tab, newline, etc.',

  // ════════════════════════════════════════════════════════════════════════════
  // STRING — static methods
  // ════════════════════════════════════════════════════════════════════════════
  'String.valueOf': '**String String.valueOf(Object obj)**\nConverts any value to its String representation. Null-safe — returns `"null"` for `null`.\n\n**Example:**\n```java\nString.valueOf(42)        // "42"\nString.valueOf(3.14)      // "3.14"\nString.valueOf(true)      // "true"\nString.valueOf(null)      // "null"\n```',

  'String.format': '**String String.format(String fmt, Object... args)**\nFormatted string (like C `sprintf`).\n\n**Common format specifiers:**\n- `%d` — decimal int\n- `%s` — String\n- `%f` / `%.2f` — float with 2 decimals\n- `%c` — char\n- `%b` — boolean\n- `%n` — newline (platform-safe)\n- `%5d` — right-align in width 5\n- `%-5s` — left-align\n\n**Example:**\n```java\nString.format("%s has %d items", "Cart", 3)  // "Cart has 3 items"\nString.format("%.2f", 3.14159)              // "3.14"\n```',

  'String.join': '**String String.join(CharSequence delimiter, Iterable<? extends CharSequence> elements)**\nJoins collection elements with a delimiter.\n\n**Example:**\n```java\nString.join(", ", List.of("a","b","c"))  // "a, b, c"\nString.join("-", "2024", "01", "15")    // "2024-01-15"\n```',

  // ════════════════════════════════════════════════════════════════════════════
  // STRING — instance methods (bare key = word-only match)
  // ════════════════════════════════════════════════════════════════════════════
  'length': '**int length()**\nReturns the number of characters. **O(1)**.\n\n**Used by:** `String`, `StringBuilder`, `StringBuffer`, arrays (via `.length` field, not method).\n\n**Example:**\n```java\n"hello".length()    // 5\nnew StringBuilder("hi").length()  // 2\n```',

  'charAt': '**char charAt(int index)**\nReturns the character at `index`. **O(1)**.\n\n**Throws:** `StringIndexOutOfBoundsException` if `index < 0` or `index >= length()`.\n\n**Example:**\n```java\n"hello".charAt(0)   // \'h\'\n"hello".charAt(4)   // \'o\'\n// Iterate: for (char c : s.toCharArray()) or for (int i=0;i<s.length();i++) s.charAt(i)\n```',

  'substring': '**String substring(int beginIndex)**\n**String substring(int beginIndex, int endIndex)**\nExtracts substring. **O(n)**.\n- One arg: from `beginIndex` to end\n- Two args: from `beginIndex` (inclusive) to `endIndex` (exclusive)\n\n**Example:**\n```java\n"hello".substring(2)     // "llo"\n"hello".substring(1, 4)  // "ell"\n```',

  'indexOf': '**int indexOf(String str)**\n**int indexOf(String str, int fromIndex)**\nReturns the index of the first occurrence of `str`, or `-1` if not found. **O(n·m)**.\n\n**Example:**\n```java\n"abcabc".indexOf("bc")     // 1\n"abcabc".indexOf("bc", 2)  // 4\n"hello".indexOf("x")       // -1\n```',

  'lastIndexOf': '**int lastIndexOf(String str)**\nReturns the index of the **last** occurrence of `str`, or `-1` if not found.\n\n**Example:**\n```java\n"abcabc".lastIndexOf("bc")  // 4\n```',

  'contains': '**boolean contains(CharSequence s)**\nReturns `true` if this string contains `s`. **O(n·m)**.\n\n**Example:**\n```java\n"hello world".contains("world")  // true\n"hello".contains("xyz")          // false\n```',

  'startsWith': '**boolean startsWith(String prefix)**\nReturns `true` if the string begins with `prefix`.\n\n**Example:**\n```java\n"https://foo".startsWith("https")  // true\n```',

  'endsWith': '**boolean endsWith(String suffix)**\nReturns `true` if the string ends with `suffix`.\n\n**Example:**\n```java\n"file.java".endsWith(".java")  // true\n```',

  'replace': '**String replace(CharSequence target, CharSequence replacement)**\nReplaces **all** occurrences of `target` with `replacement`. Returns new String.\n\n**Overload:** `replace(char oldChar, char newChar)` — single char replacement.\n\n**Example:**\n```java\n"hello world".replace("world", "Java")  // "hello Java"\n"aabbcc".replace("b", "X")              // "aaXXcc"\n```',

  'replaceAll': '**String replaceAll(String regex, String replacement)**\nReplaces all matches of `regex` with `replacement`.\n\n⚠️ `regex` is a full regular expression — escape special chars with `\\\\`.\n\n**Example:**\n```java\n"a1b2c3".replaceAll("[0-9]", "")  // "abc"\n"foo  bar".replaceAll("\\\\s+", " ") // "foo bar"\n```',

  'split': '**String[] split(String regex)**\nSplits string around matches of `regex`. Empty trailing strings are discarded.\n\n**Overload:** `split(regex, limit)` — limit number of parts.\n\n**Example:**\n```java\n"a,b,c".split(",")          // ["a","b","c"]\n"a  b  c".split("\\\\s+")     // ["a","b","c"]\n"a:b:c".split(":", 2)       // ["a","b:c"]\n```',

  'trim': '**String trim()**\nRemoves leading and trailing ASCII whitespace (chars ≤ `\\u0020`).\nFor Unicode whitespace use `strip()` (Java 11+).',

  'strip': '**String strip()**  *(Java 11+)*\nRemoves leading and trailing whitespace per Unicode. Preferred over `trim()`.\n\n**Related:** `stripLeading()`, `stripTrailing()`.',

  'toUpperCase': '**String toUpperCase()**\nConverts all characters to uppercase using default locale.\n\n**Example:**\n```java\n"hello".toUpperCase()  // "HELLO"\n```',

  'toLowerCase': '**String toLowerCase()**\nConverts all characters to lowercase using default locale.\n\n**Example:**\n```java\n"HELLO".toLowerCase()  // "hello"\n```',

  'equals': '**boolean equals(Object obj)**\nContent equality. **Always use `equals()` for Strings — never `==`.**\n`==` checks reference identity, not content.\n\n**Example:**\n```java\n"abc".equals("abc")  // true\n"abc" == "abc"       // true only due to String pool (unreliable)\nnew String("abc") == new String("abc")  // false!\n```',

  'equalsIgnoreCase': '**boolean equalsIgnoreCase(String other)**\nCase-insensitive content equality.\n\n**Example:**\n```java\n"Hello".equalsIgnoreCase("hello")  // true\n```',

  'compareTo': '**int compareTo(String other)**\nLexicographic comparison.\n- Returns `< 0` if this < other\n- Returns `0` if equal\n- Returns `> 0` if this > other\n\n**Example:**\n```java\n"apple".compareTo("banana")  // negative\n"b".compareTo("a")           // positive\n// Use in Comparator: Comparator.comparing(String::compareTo)\n```',

  'isEmpty': '**boolean isEmpty()**\nReturns `true` if `length() == 0`.\n\n**Note:** Does NOT check for whitespace-only strings. Use `isBlank()` for that.',

  'isBlank': '**boolean isBlank()**  *(Java 11+)*\nReturns `true` if empty or contains only whitespace.\n\n**Example:**\n```java\n"   ".isBlank()  // true\n"".isBlank()     // true\n"a".isBlank()    // false\n```',

  'toCharArray': '**char[] toCharArray()**\nConverts String to a new `char[]`. Useful for in-place manipulation.\n\n**Example:**\n```java\nchar[] chars = "hello".toCharArray();\nchars[0] = \'H\';\nString result = new String(chars);  // "Hello"\n```',

  'intern': '**String intern()**\nReturns the canonical pooled representation of this String.\nUsed to force String pool deduplication. Rarely needed in modern Java.',

  'repeat': '**String repeat(int count)**  *(Java 11+)*\nRepeats the string `count` times.\n\n**Example:**\n```java\n"ab".repeat(3)   // "ababab"\n"-".repeat(20)   // "--------------------"\n```',

  'matches': '**boolean matches(String regex)**\nReturns `true` if the entire String matches the regular expression.\n\n**Example:**\n```java\n"12345".matches("[0-9]+")       // true\n"hello".matches("[a-z]{3,10}")  // true\n```',

  'chars': '**IntStream chars()**  *(Java 8+)*\nReturns an `IntStream` of char values. Cast back with `(char)`.\n\n**Example:**\n```java\nlong vowels = s.chars()\n    .filter(c -> "aeiou".indexOf(c) >= 0)\n    .count();\n```',

  'formatted': '**String formatted(Object... args)**  *(Java 15+)*\nInstance-method equivalent of `String.format(this, args)`.\n\n**Example:**\n```java\n"Hello %s, you are %d".formatted("Alice", 30)  // "Hello Alice, you are 30"\n```',

  // ════════════════════════════════════════════════════════════════════════════
  // STRINGBUILDER
  // ════════════════════════════════════════════════════════════════════════════
  'StringBuilder.append': '**StringBuilder append(Object obj)**\nAppends the String representation of `obj`. Chainable.\nAccepts: `String`, `int`, `char`, `boolean`, `long`, `double`, `char[]`, etc.\n\n**Example:**\n```java\nStringBuilder sb = new StringBuilder();\nsb.append("Hello").append(" ").append(42);  // "Hello 42"\n```',

  'StringBuilder.insert': '**StringBuilder insert(int offset, Object obj)**\nInserts `obj` at position `offset`. Shifts existing characters right. **O(n)**.',

  'StringBuilder.delete': '**StringBuilder delete(int start, int end)**\nDeletes characters in range `[start, end)`. **O(n)**.\n\n**Example:**\n```java\nnew StringBuilder("hello").delete(1, 3)  // "hlo"\n```',

  'StringBuilder.deleteCharAt': '**StringBuilder deleteCharAt(int index)**\nRemoves the character at `index`. **O(n)**.',

  'StringBuilder.reverse': '**StringBuilder reverse()**\nReverses the character sequence in-place. **O(n)**.\n\n**Example:**\n```java\nnew StringBuilder("hello").reverse().toString()  // "olleh"\n```',

  'StringBuilder.toString': '**String toString()**\nConverts to an immutable `String`. Call when done building.',

  'StringBuilder.length': '**int length()**\nCurrent number of characters in the buffer.',

  'StringBuilder.charAt': '**char charAt(int index)**\nReturns character at `index`.',

  'StringBuilder.setCharAt': '**void setCharAt(int index, char ch)**\nReplaces character at `index` with `ch`. **O(1)**.',

  'StringBuilder.indexOf': '**int indexOf(String str)**\nFirst occurrence of `str` in this builder, or `-1`.',

  'StringBuilder.replace': '**StringBuilder replace(int start, int end, String str)**\nReplaces `[start, end)` with `str`.',

  // ════════════════════════════════════════════════════════════════════════════
  // SCANNER
  // ════════════════════════════════════════════════════════════════════════════
  'Scanner.nextInt': '**int nextInt()**\nReads the next token and parses it as `int`.\n\n⚠️ Does NOT consume the trailing newline. Call `sc.nextLine()` after if needed.\n\n**Throws:** `InputMismatchException` if not a valid int.',

  'Scanner.nextLong': '**long nextLong()**\nReads the next token as `long`.',

  'Scanner.nextDouble': '**double nextDouble()**\nReads the next token as `double`.',

  'Scanner.next': '**String next()**\nReads the next whitespace-delimited token (stops at space/tab/newline).',

  'Scanner.nextLine': '**String nextLine()**\nReads the rest of the current line (including trailing spaces, but not the `\\n`).\n\n⚠️ After `nextInt()`/`nextLong()` call `nextLine()` once to skip the leftover newline.',

  'Scanner.hasNext': '**boolean hasNext()**\nReturns `true` if there is another token to read.',

  'Scanner.hasNextInt': '**boolean hasNextInt()**\nReturns `true` if the next token is a valid `int`.',

  'Scanner.hasNextLine': '**boolean hasNextLine()**\nReturns `true` if there is another line.',

  // ════════════════════════════════════════════════════════════════════════════
  // ARRAYLIST / LIST  (instance methods)
  // ════════════════════════════════════════════════════════════════════════════
  'add': '**boolean add(E e)**\nAppends element to the end. **O(1)** amortized.\n\n**Overload:** `add(int index, E e)` — inserts at index, **O(n)**.\n\n**Used by:** `ArrayList`, `LinkedList`, `ArrayDeque`, `HashSet`, `TreeSet`, `PriorityQueue`.\n\n**Example:**\n```java\nList<Integer> list = new ArrayList<>();\nlist.add(1); list.add(2); list.add(0, 0);  // [0, 1, 2]\n```',

  'get': '**E get(int index)**\nReturns element at `index`. **O(1)** for `ArrayList`, **O(n)** for `LinkedList`.\n\n**Throws:** `IndexOutOfBoundsException` if index is out of range.\n\n**Example:**\n```java\nlist.get(0)   // first element\nlist.get(list.size() - 1)  // last element\n```',

  'set': '**E set(int index, E element)**\nReplaces element at `index`. Returns the old value. **O(1)** for `ArrayList`.\n\n**Example:**\n```java\nlist.set(2, 99)  // replace index 2 with 99\n```',

  'remove': '**E remove(int index)**\n**boolean remove(Object o)**\nRemoves by index (**O(n)**) or by value (**O(n)**). Returns removed element or `true/false`.\n\n⚠️ For `List<Integer>`, `remove(1)` removes index 1; `remove(Integer.valueOf(1))` removes value 1.\n\n**Used by:** `ArrayList`, `LinkedList`, `HashSet`, `TreeSet`, `HashMap`, `PriorityQueue`.',

  'size': '**int size()**\nReturns the number of elements. **O(1)**.\n\n**Used by:** all Collection types.',

  'contains': '**boolean contains(Object o)**\nReturns `true` if the collection contains `o`.\n- `ArrayList`/`LinkedList`: **O(n)** linear scan\n- `HashSet`/`HashMap`: **O(1)** average\n- `TreeSet`/`TreeMap`: **O(log n)**\n\n**Example:**\n```java\nlist.contains(42)   // true/false\nset.contains("hi")  // O(1) for HashSet\n```',

  'clear': '**void clear()**\nRemoves all elements. **O(n)** (or O(1) for LinkedList amortized).\n\n**Used by:** all Collection types.',

  'isEmpty': '**boolean isEmpty()**\nReturns `true` if `size() == 0`. **O(1)**.',

  'subList': '**List<E> subList(int from, int to)**\nReturns a **view** of `[from, to)`. Mutations affect the original list.\n\n**Example:**\n```java\nList<Integer> sub = list.subList(1, 4);  // view of indices 1,2,3\n```',

  'sort': '**void sort(Comparator<? super E> c)**\nSorts this list using the comparator. Pass `null` for natural order.\n\n**Example:**\n```java\nlist.sort(null);                            // natural order\nlist.sort(Comparator.reverseOrder());        // descending\nlist.sort(Comparator.comparing(s -> s.length())); // by length\n```',

  'iterator': '**Iterator<E> iterator()**\nReturns an iterator for explicit iteration with `hasNext()` / `next()` / `remove()`.\nPrefer enhanced `for` loop or `forEach` in most cases.',

  'forEach': '**void forEach(Consumer<? super T> action)**\nPerforms `action` for each element.\n\n**Example:**\n```java\nlist.forEach(System.out::println);\nmap.forEach((k, v) -> System.out.println(k + "=" + v));\n```',

  'toArray': '**Object[] toArray()**\n**T[] toArray(T[] a)**\nConverts collection to array.\n\n**Example:**\n```java\nInteger[] arr = list.toArray(new Integer[0]);\n// Java 11+:\nInteger[] arr = list.toArray(Integer[]::new);\n```',

  'addAll': '**boolean addAll(Collection<? extends E> c)**\nAdds all elements from `c`. Returns `true` if the collection changed.\n\n**Overload:** `addAll(int index, c)` for `List` — inserts at index.',

  // ════════════════════════════════════════════════════════════════════════════
  // HASHMAP / MAP  (instance methods)
  // ════════════════════════════════════════════════════════════════════════════
  'put': '**V put(K key, V value)**\nInserts or replaces key-value pair. Returns previous value or `null`. **O(1)** average for `HashMap`.\n\n**Example:**\n```java\nmap.put("alice", 1);\nmap.put("alice", 2);  // returns 1 (old value)\n```',

  'getOrDefault': '**V getOrDefault(Object key, V defaultValue)**\nReturns the value for `key`, or `defaultValue` if key is absent.\n\n**Example:**\n```java\nmap.getOrDefault("x", 0)  // 0 if "x" not in map\n// Frequency count pattern:\nmap.put(c, map.getOrDefault(c, 0) + 1);\n```',

  'containsKey': '**boolean containsKey(Object key)**\nReturns `true` if map contains `key`. **O(1)** for `HashMap`, **O(log n)** for `TreeMap`.',

  'containsValue': '**boolean containsValue(Object value)**\nReturns `true` if map contains `value`. **O(n)** — requires full scan.',

  'keySet': '**Set<K> keySet()**\nReturns a Set view of all keys. Backed by the map.\n\n**Example:**\n```java\nfor (String key : map.keySet()) { ... }\n```',

  'values': '**Collection<V> values()**\nReturns a Collection view of all values. Backed by the map.\n\n**Example:**\n```java\nfor (int val : map.values()) sum += val;\n```',

  'entrySet': '**Set<Map.Entry<K,V>> entrySet()**\nReturns a Set of key-value pairs. Most efficient way to iterate both keys and values.\n\n**Example:**\n```java\nfor (Map.Entry<String, Integer> e : map.entrySet()) {\n    System.out.println(e.getKey() + "=" + e.getValue());\n}\n```',

  'computeIfAbsent': '**V computeIfAbsent(K key, Function<K,V> mappingFn)**\nIf `key` is absent, computes value using `mappingFn` and inserts it. Returns the (new or existing) value.\n\n**Example:**\n```java\n// Group words by first letter:\nmap.computeIfAbsent(word.charAt(0), k -> new ArrayList<>()).add(word);\n// Default HashMap of lists pattern\n```',

  'merge': '**V merge(K key, V value, BiFunction<V,V,V> remappingFn)**\nIf key is absent → inserts `value`. If present → applies `remappingFn(oldVal, value)`.\n\n**Example:**\n```java\n// Frequency count (cleaner than getOrDefault):\nmap.merge(key, 1, Integer::sum);\n// Concatenate strings:\nmap.merge(key, "new", (old, v) -> old + "," + v);\n```',

  'putIfAbsent': '**V putIfAbsent(K key, V value)**\nInserts `key=value` only if key is not already present. Returns previous value or `null`.',

  'replace': '**V replace(K key, V value)**\nReplaces the entry for `key` only if it currently exists. Returns old value or `null`.',

  // ════════════════════════════════════════════════════════════════════════════
  // TREEMAP  (additional methods)
  // ════════════════════════════════════════════════════════════════════════════
  'firstKey': '**K firstKey()**\nReturns the lowest key in this TreeMap.\n**Throws:** `NoSuchElementException` if empty.',

  'lastKey': '**K lastKey()**\nReturns the highest key in this TreeMap.',

  'floorKey': '**K floorKey(K key)**\nReturns the greatest key ≤ `key`, or `null` if none.\n\n**Example:**\n```java\ntreeMap.floorKey(5)   // largest key ≤ 5\n```',

  'ceilingKey': '**K ceilingKey(K key)**\nReturns the smallest key ≥ `key`, or `null` if none.',

  'lowerKey': '**K lowerKey(K key)**\nReturns the greatest key strictly < `key`, or `null`.',

  'higherKey': '**K higherKey(K key)**\nReturns the smallest key strictly > `key`, or `null`.',

  'headMap': '**SortedMap<K,V> headMap(K toKey)**\nView of all entries with keys strictly < `toKey`.',

  'tailMap': '**SortedMap<K,V> tailMap(K fromKey)**\nView of all entries with keys ≥ `fromKey`.',

  // ════════════════════════════════════════════════════════════════════════════
  // TREESET  (additional methods)
  // ════════════════════════════════════════════════════════════════════════════
  'first': '**E first()**\nReturns the lowest element in the sorted set.\n**Throws:** `NoSuchElementException` if empty.\n\n**Used by:** `TreeSet`, `TreeMap`.',

  'last': '**E last()**\nReturns the highest element in the sorted set.',

  'floor': '**E floor(E e)**\nReturns the greatest element ≤ `e`, or `null` if none.\n\n**Used by:** `TreeSet`, `TreeMap`.',

  'ceiling': '**E ceiling(E e)**\nReturns the smallest element ≥ `e`, or `null` if none.',

  'lower': '**E lower(E e)**\nReturns the greatest element strictly < `e`, or `null`.',

  'higher': '**E higher(E e)**\nReturns the smallest element strictly > `e`, or `null`.',

  'headSet': '**SortedSet<E> headSet(E toElement)**\nView of elements strictly < `toElement`.',

  'tailSet': '**SortedSet<E> tailSet(E fromElement)**\nView of elements ≥ `fromElement`.',

  // ════════════════════════════════════════════════════════════════════════════
  // PRIORITYQUEUE  (Heap)
  // ════════════════════════════════════════════════════════════════════════════
  'offer': '**boolean offer(E e)**\nInserts element into the priority queue. **O(log n)**.\nSame as `add(e)` — returns `false` if capacity-restricted (never for unbounded PQ).\n\n**Example:**\n```java\nPriorityQueue<Integer> minHeap = new PriorityQueue<>();\nminHeap.offer(5);\nminHeap.offer(1);  // heap: [1, 5]\n```',

  'poll': '**E poll()**\nRetrieves and removes the head (minimum for min-heap). **O(log n)**.\nReturns `null` if empty.\n\n**Example:**\n```java\nminHeap.poll()  // removes and returns 1\n```',

  'peek': '**E peek()**\nReturns the head element **without removing** it. **O(1)**.\nReturns `null` if empty.\n\n**Used by:** `PriorityQueue`, `ArrayDeque`, `LinkedList`.',

  // ════════════════════════════════════════════════════════════════════════════
  // ARRAYDEQUE  (Stack / Queue)
  // ════════════════════════════════════════════════════════════════════════════
  'push': '**void push(E e)**\nPushes element onto the stack (inserts at front). **O(1)**.\nEquivalent to `addFirst(e)`.\n\n**Used by:** `ArrayDeque` (as stack).',

  'pop': '**E pop()**\nPops from the stack (removes and returns from front). **O(1)**.\n**Throws:** `NoSuchElementException` if empty.\n\n**Used by:** `ArrayDeque`.',

  'addFirst': '**void addFirst(E e)**\nInserts `e` at the front. **O(1)**.',

  'addLast': '**void addLast(E e)**\nInserts `e` at the back. **O(1)**.',

  'peekFirst': '**E peekFirst()**\nReturns (but does not remove) the first element, or `null` if empty.',

  'peekLast': '**E peekLast()**\nReturns (but does not remove) the last element, or `null` if empty.',

  'pollFirst': '**E pollFirst()**\nRemoves and returns the first element, or `null` if empty.',

  'pollLast': '**E pollLast()**\nRemoves and returns the last element, or `null` if empty.',

  // ════════════════════════════════════════════════════════════════════════════
  // STREAM  (java.util.stream)
  // ════════════════════════════════════════════════════════════════════════════
  'filter': '**Stream<T> filter(Predicate<T> predicate)**\nKeeps only elements matching the predicate. **Lazy / intermediate operation.**\n\n**Example:**\n```java\nlist.stream()\n    .filter(x -> x > 0)\n    .collect(Collectors.toList());\n```',

  'map': '**Stream<R> map(Function<T,R> mapper)**\nTransforms each element. **Lazy / intermediate.**\n\n**Variants:** `mapToInt`, `mapToLong`, `mapToDouble` for primitive streams.\n\n**Example:**\n```java\nList<String> names = people.stream()\n    .map(Person::getName)\n    .collect(Collectors.toList());\n```',

  'flatMap': '**Stream<R> flatMap(Function<T, Stream<R>> mapper)**\nMaps each element to a stream, then flattens all streams into one.\n\n**Example:**\n```java\n// Flatten list of lists:\nList<Integer> flat = lists.stream()\n    .flatMap(Collection::stream)\n    .collect(Collectors.toList());\n```',

  'sorted': '**Stream<T> sorted()**\n**Stream<T> sorted(Comparator<T> comparator)**\nSorts stream elements. **O(n log n)**. Stable sort.\n\n**Example:**\n```java\nstream.sorted()                              // natural order\nstream.sorted(Comparator.reverseOrder())     // descending\nstream.sorted(Comparator.comparing(s -> s.length()))  // by length\n```',

  'distinct': '**Stream<T> distinct()**\nRemoves duplicate elements (uses `equals()`). **Lazy.**\n\n**Example:**\n```java\nList.of(1,1,2,3,2).stream().distinct().toList()  // [1, 2, 3]\n```',

  'limit': '**Stream<T> limit(long maxSize)**\nTruncates stream to at most `maxSize` elements. **Lazy.**',

  'skip': '**Stream<T> skip(long n)**\nDiscards the first `n` elements. **Lazy.**',

  'collect': '**R collect(Collector<T,A,R> collector)**\n**Terminal operation.** Accumulates stream elements into a container.\n\n**Common collectors:**\n```java\n.collect(Collectors.toList())\n.collect(Collectors.toSet())\n.collect(Collectors.joining(", "))\n.collect(Collectors.groupingBy(fn))\n.collect(Collectors.counting())\n.collect(Collectors.toMap(k -> k, v -> v))\n```',

  'reduce': '**Optional<T> reduce(BinaryOperator<T> accumulator)**\n**T reduce(T identity, BinaryOperator<T> accumulator)**\nFolds stream elements into a single value.\n\n**Example:**\n```java\nint sum = stream.reduce(0, Integer::sum);\nOptional<Integer> max = stream.reduce(Integer::max);\n```',

  'count': '**long count()**\n**Terminal.** Returns the number of elements in the stream.',

  'anyMatch': '**boolean anyMatch(Predicate<T> p)**\n**Terminal.** `true` if at least one element matches. Short-circuits.',

  'allMatch': '**boolean allMatch(Predicate<T> p)**\n**Terminal.** `true` if all elements match. Short-circuits on first failure.',

  'noneMatch': '**boolean noneMatch(Predicate<T> p)**\n**Terminal.** `true` if no elements match.',

  'findFirst': '**Optional<T> findFirst()**\n**Terminal.** Returns the first element, or empty `Optional`.\n\n**Example:**\n```java\nOptional<Integer> first = list.stream().filter(x -> x > 5).findFirst();\nfirst.orElse(-1);\n```',

  'mapToInt': '**IntStream mapToInt(ToIntFunction<T> mapper)**\nMaps to a primitive `int` stream. Enables `sum()`, `average()`, `min()`, `max()`.\n\n**Example:**\n```java\nint total = list.stream().mapToInt(Integer::intValue).sum();\ndouble avg = list.stream().mapToInt(x -> x).average().getAsDouble();\n```',

  'toList': '**List<T> toList()**  *(Java 16+)*\nShorthand terminal operation for `collect(Collectors.toUnmodifiableList())`.\n\n**Example:**\n```java\nList<String> result = stream.filter(...).toList();\n```',

  // ════════════════════════════════════════════════════════════════════════════
  // OPTIONAL
  // ════════════════════════════════════════════════════════════════════════════
  'Optional.of': '**Optional<T> Optional.of(T value)**\nWraps a non-null value.\n**Throws:** `NullPointerException` if `value` is null. Use `ofNullable` for nullable values.',

  'Optional.ofNullable': '**Optional<T> Optional.ofNullable(T value)**\nWraps a potentially-null value — returns empty `Optional` if `value` is `null`.',

  'Optional.empty': '**Optional<T> Optional.empty()**\nReturns an empty `Optional`.',

  'isPresent': '**boolean isPresent()**\nReturns `true` if a value is present.\n\n**Note:** Prefer `ifPresent(consumer)` or `orElse` over `if (opt.isPresent()) opt.get()`.',

  'orElse': '**T orElse(T other)**\nReturns the value if present, otherwise returns `other`.\n\n**Example:**\n```java\nString name = opt.orElse("Unknown");\n```',

  'orElseGet': '**T orElseGet(Supplier<T> supplier)**\nReturns the value if present, otherwise calls `supplier.get()`. Lazier than `orElse`.\n\n**Example:**\n```java\nString name = opt.orElseGet(() -> computeDefault());\n```',

  'orElseThrow': '**T orElseThrow()**\n**T orElseThrow(Supplier<X> exceptionSupplier)**\nReturns value or throws exception.\n\n**Example:**\n```java\nString name = opt.orElseThrow(() -> new RuntimeException("not found"));\n```',

  'ifPresent': '**void ifPresent(Consumer<T> action)**\nExecutes `action` only if a value is present.\n\n**Example:**\n```java\nopt.ifPresent(System.out::println);\n```',

  // ════════════════════════════════════════════════════════════════════════════
  // COLLECTORS  (java.util.stream.Collectors)
  // ════════════════════════════════════════════════════════════════════════════
  'Collectors.toList': '**Collector Collectors.toList()**\nCollects stream elements into a mutable `ArrayList`.\n\n**Java 16+ alternative:** `.toList()` (returns unmodifiable list).',

  'Collectors.toSet': '**Collector Collectors.toSet()**\nCollects into a `HashSet`, removing duplicates.',

  'Collectors.toMap': '**Collector Collectors.toMap(keyMapper, valueMapper)**\nCollects into a `HashMap`.\n\n**Example:**\n```java\nMap<String,Integer> m = list.stream()\n    .collect(Collectors.toMap(s -> s, String::length));\n// With merge function to handle duplicate keys:\n.collect(Collectors.toMap(k, v, (a,b) -> a));\n```',

  'Collectors.groupingBy': '**Collector Collectors.groupingBy(classifier)**\nGroups elements by a key function into `Map<K, List<V>>`.\n\n**Example:**\n```java\nMap<Integer, List<String>> byLength = words.stream()\n    .collect(Collectors.groupingBy(String::length));\n```',

  'Collectors.joining': '**Collector Collectors.joining()**\n**Collector Collectors.joining(delimiter)**\n**Collector Collectors.joining(delimiter, prefix, suffix)**\nConcatenates stream of strings.\n\n**Example:**\n```java\nwords.stream().collect(Collectors.joining(", ", "[", "]"))\n// ["apple", "banana", "cherry"]\n```',

  'Collectors.counting': '**Collector Collectors.counting()**\nCounts stream elements. Returns `Long`.',

  'Collectors.summingInt': '**Collector Collectors.summingInt(ToIntFunction mapper)**\nSums an int-valued function applied to each element.',

  'Collectors.partitioningBy': '**Collector Collectors.partitioningBy(Predicate)**\nPartitions into `Map<Boolean, List<T>>` — `true` and `false` groups.\n\n**Example:**\n```java\nMap<Boolean, List<Integer>> parts = nums.stream()\n    .collect(Collectors.partitioningBy(n -> n % 2 == 0));\n```',

  // ════════════════════════════════════════════════════════════════════════════
  // COMPARATOR
  // ════════════════════════════════════════════════════════════════════════════
  'Comparator.comparing': '**Comparator<T> Comparator.comparing(Function<T,U> keyExtractor)**\nCreates a comparator that sorts by the extracted key.\n\n**Example:**\n```java\nlist.sort(Comparator.comparing(Person::getAge));\nlist.sort(Comparator.comparing(String::length));\n```',

  'Comparator.comparingInt': '**Comparator<T> Comparator.comparingInt(ToIntFunction<T> keyExtractor)**\nLike `comparing` but optimized for `int` keys (avoids boxing).\n\n**Example:**\n```java\nlist.sort(Comparator.comparingInt(String::length));\n```',

  'Comparator.thenComparing': '**Comparator<T> thenComparing(Comparator<T> other)**\nBreaks ties using a secondary comparator. Chainable.\n\n**Example:**\n```java\nComparator<Person> c = Comparator.comparing(Person::getLastName)\n    .thenComparing(Person::getFirstName);\n```',

  'Comparator.reversed': '**Comparator<T> reversed()**\nReturns a reversed-order view of this comparator.\n\n**Example:**\n```java\nComparator.comparing(String::length).reversed()  // longest first\n```',

  'Comparator.naturalOrder': '**Comparator<T> Comparator.naturalOrder()**\nReturns a comparator that imposes natural ascending order.',

  'Comparator.reverseOrder': '**Comparator<T> Comparator.reverseOrder()**\nReturns a comparator that imposes reverse natural order (descending).',

  // ════════════════════════════════════════════════════════════════════════════
  // OBJECTS  (java.util.Objects)
  // ════════════════════════════════════════════════════════════════════════════
  'Objects.isNull': '**boolean Objects.isNull(Object obj)**\nNull-safe check: returns `true` if `obj == null`.\nUseful as a method reference: `.filter(Objects::isNull)`',

  'Objects.nonNull': '**boolean Objects.nonNull(Object obj)**\nNull-safe check: returns `true` if `obj != null`.\nUseful as: `.filter(Objects::nonNull)` to remove nulls from stream.',

  'Objects.requireNonNull': '**T Objects.requireNonNull(T obj)**\n**T Objects.requireNonNull(T obj, String message)**\nThrows `NullPointerException` with optional message if `obj` is null.\n\n**Example:**\n```java\nthis.name = Objects.requireNonNull(name, "name must not be null");\n```',

  'Objects.equals': '**boolean Objects.equals(Object a, Object b)**\nNull-safe equality. Returns `true` if both are `null` or `a.equals(b)`.\n\n**Example:**\n```java\nObjects.equals(null, null)   // true\nObjects.equals(null, "x")    // false (no NPE)\n```',

  'Objects.hash': '**int Objects.hash(Object... values)**\nGenerates a hash code from multiple values.\n\n**Example:**\n```java\n@Override\npublic int hashCode() {\n    return Objects.hash(id, name, email);\n}\n```',

  'Objects.toString': '**String Objects.toString(Object o)**\n**String Objects.toString(Object o, String nullDefault)**\nNull-safe toString. Returns `"null"` or the supplied default for null objects.\n\n**Example:**\n```java\nObjects.toString(obj, "N/A")  // "N/A" if obj is null\n```',

  // ════════════════════════════════════════════════════════════════════════════
  // THREAD / CONCURRENCY
  // ════════════════════════════════════════════════════════════════════════════
  'Thread.sleep': '**void Thread.sleep(long millis)**\nPauses the current thread for at least `millis` milliseconds.\n\n**Throws:** `InterruptedException` — must be caught or declared.\n\n**Example:**\n```java\ntry {\n    Thread.sleep(1000);  // sleep 1 second\n} catch (InterruptedException e) {\n    Thread.currentThread().interrupt();\n}\n```',

  'Thread.currentThread': '**Thread Thread.currentThread()**\nReturns the currently executing thread.',

  'CompletableFuture.supplyAsync': '**CompletableFuture<T> CompletableFuture.supplyAsync(Supplier<T> supplier)**\nRuns `supplier` asynchronously on the common ForkJoinPool.\n\n**Example:**\n```java\nCompletableFuture<String> future = CompletableFuture.supplyAsync(() -> fetchData());\n```',

  'CompletableFuture.thenApply': '**CompletableFuture<U> thenApply(Function<T,U> fn)**\nTransforms the result when it\'s ready (like `map` for futures).\n\n**Example:**\n```java\nfuture.thenApply(String::toUpperCase)\n      .thenAccept(System.out::println);\n```',

  'CompletableFuture.exceptionally': '**CompletableFuture<T> exceptionally(Function<Throwable,T> fn)**\nHandles exceptions from the future. Returns a default value.\n\n**Example:**\n```java\nfuture.exceptionally(ex -> "default value");\n```',

  'CompletableFuture.allOf': '**CompletableFuture<Void> CompletableFuture.allOf(CompletableFuture<?>... cfs)**\nReturns a future that completes when **all** provided futures complete.',

  // ════════════════════════════════════════════════════════════════════════════
  // FILES / PATH  (java.nio.file)
  // ════════════════════════════════════════════════════════════════════════════
  'Files.readAllLines': '**List<String> Files.readAllLines(Path path)**\nReads all lines of a file into a `List<String>`. Uses UTF-8 by default.\n\n**Throws:** `IOException`.\n\n**Example:**\n```java\nList<String> lines = Files.readAllLines(Path.of("data.txt"));\n```',

  'Files.readString': '**String Files.readString(Path path)**  *(Java 11+)*\nReads entire file content as a single String.\n\n**Throws:** `IOException`.',

  'Files.write': '**Path Files.write(Path path, byte[] bytes, OpenOption... options)**\nWrites bytes to a file. Creates file if absent, overwrites by default.\n\n**Example:**\n```java\nFiles.write(Path.of("out.txt"), "hello".getBytes());\nFiles.writeString(Path.of("out.txt"), "hello"); // Java 11+\n```',

  'Files.exists': '**boolean Files.exists(Path path)**\nReturns `true` if the file/directory exists.',

  'Path.of': '**Path Path.of(String first, String... more)**  *(Java 11+)*\nCreates a `Path` from string segments.\n\n**Example:**\n```java\nPath p = Path.of("src", "main", "java", "Main.java");\n// older:\nPath p = Paths.get("src/main/java/Main.java");\n```',

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
    // SECTION 8 — PRIMITIVE TYPES
    // ════════════════════════════════════════════════════════════════════════
    {label:'int',     insertText:'int ',     detail:'primitive int (32-bit)',                  kind:Kind.Keyword,  documentation:{value:'32-bit signed integer. Range: -2,147,483,648 to 2,147,483,647'},  range, insertTextRules:Snippet},
    {label:'long',    insertText:'long ',    detail:'primitive long (64-bit)',                 kind:Kind.Keyword,  documentation:{value:'64-bit signed integer. Range: -9.2×10¹⁸ to 9.2×10¹⁸. Add `L` suffix: `123L`'}, range, insertTextRules:Snippet},
    {label:'double',  insertText:'double ',  detail:'primitive double (64-bit float)',         kind:Kind.Keyword,  documentation:{value:'64-bit floating point. Use for decimal numbers. e.g. `3.14`'}, range, insertTextRules:Snippet},
    {label:'float',   insertText:'float ',   detail:'primitive float (32-bit)',                kind:Kind.Keyword,  documentation:{value:'32-bit float. Add `f` suffix: `3.14f`. Prefer double for precision.'}, range, insertTextRules:Snippet},
    {label:'boolean', insertText:'boolean ', detail:'primitive boolean (true/false)',          kind:Kind.Keyword,  documentation:{value:'Boolean value: `true` or `false`. Used in conditions.'}, range, insertTextRules:Snippet},
    {label:'char',    insertText:'char ',    detail:"primitive char (16-bit Unicode)",         kind:Kind.Keyword,  documentation:{value:"Single Unicode character. e.g. `char c = 'A'`. Supports arithmetic: `'a' + 1 = 'b'`"}, range, insertTextRules:Snippet},
    {label:'byte',    insertText:'byte ',    detail:'primitive byte (8-bit, -128 to 127)',     kind:Kind.Keyword,  documentation:{value:'8-bit signed integer. Range: -128 to 127.'}, range, insertTextRules:Snippet},
    {label:'short',   insertText:'short ',   detail:'primitive short (16-bit)',                kind:Kind.Keyword,  documentation:{value:'16-bit signed integer. Range: -32768 to 32767. Rarely used.'}, range, insertTextRules:Snippet},
    {label:'void',    insertText:'void ',    detail:'no return value',                         kind:Kind.Keyword,  documentation:{value:'Indicates a method returns nothing.'}, range, insertTextRules:Snippet},

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 9 — WRAPPER & COMMON CLASSES
    // ════════════════════════════════════════════════════════════════════════
    {label:'String',       insertText:'String ',       detail:'java.lang.String — immutable text',    kind:Kind.Class, documentation:{value:'Immutable sequence of characters. Use `StringBuilder` for concatenation in loops.\n\nCommon: `length()` `charAt(i)` `substring(a,b)` `contains()` `split()` `trim()` `toCharArray()`'}, range, insertTextRules:Snippet},
    {label:'Integer',      insertText:'Integer ',      detail:'java.lang.Integer — int wrapper',      kind:Kind.Class, documentation:{value:'Wrapper for `int`. Useful for:\n- `Integer.MAX_VALUE` / `MIN_VALUE`\n- `Integer.parseInt(str)`\n- `Integer.bitCount(n)`\n- `Integer.toBinaryString(n)`'}, range, insertTextRules:Snippet},
    {label:'Long',         insertText:'Long ',         detail:'java.lang.Long — long wrapper',        kind:Kind.Class, documentation:{value:'Wrapper for `long`. `Long.MAX_VALUE` = 9.2×10¹⁸\n- `Long.parseLong(str)`\n- `Long.compare(a, b)`'}, range, insertTextRules:Snippet},
    {label:'Double',       insertText:'Double ',       detail:'java.lang.Double — double wrapper',    kind:Kind.Class, documentation:{value:'Wrapper for `double`. `Double.parseDouble(str)` `Double.isNaN(d)`'}, range, insertTextRules:Snippet},
    {label:'Boolean',      insertText:'Boolean ',      detail:'java.lang.Boolean — boolean wrapper',  kind:Kind.Class, documentation:{value:'Wrapper for `boolean`. `Boolean.parseBoolean("true")` → true'}, range, insertTextRules:Snippet},
    {label:'Character',    insertText:'Character ',    detail:'java.lang.Character — char wrapper',   kind:Kind.Class, documentation:{value:'Wrapper for `char`.\n- `Character.isDigit(c)` `isLetter(c)` `isUpperCase(c)`\n- `Character.toLowerCase(c)` `toUpperCase(c)`\n- `c - \'a\'` gives 0-25 index for lowercase letters'}, range, insertTextRules:Snippet},
    {label:'Object',       insertText:'Object ',       detail:'java.lang.Object — root class',        kind:Kind.Class, documentation:{value:'Root of all Java classes. Methods: `equals()` `hashCode()` `toString()` `getClass()`'}, range, insertTextRules:Snippet},
    {label:'Math',         insertText:'Math.',         detail:'java.lang.Math — math functions',      kind:Kind.Class, documentation:{value:'Static math methods:\n- `Math.max/min(a,b)` `Math.abs(x)`\n- `Math.sqrt(x)` `Math.pow(a,b)`\n- `Math.floor/ceil/round(x)`\n- `Math.log(x)` `Math.PI`'}, range, insertTextRules:Snippet},
    {label:'System',       insertText:'System.',       detail:'java.lang.System — I/O and system',    kind:Kind.Class, documentation:{value:'System utilities:\n- `System.out.println(x)` — print with newline\n- `System.out.print(x)` — print without newline\n- `System.out.printf(fmt, args)` — formatted\n- `System.in` — standard input (pass to Scanner)\n- `System.exit(0)` — terminate program'}, range, insertTextRules:Snippet},
    {label:'Scanner',      insertText:'Scanner ',      detail:'java.util.Scanner — input reading',    kind:Kind.Class, documentation:{value:'Reads input tokens:\n```java\nScanner sc = new Scanner(System.in);\nint n = sc.nextInt();\nString s = sc.next();\nString line = sc.nextLine();\n```\nAfter `nextInt()`, call `nextLine()` once to consume the newline.'}, range, insertTextRules:Snippet},
    {label:'Arrays',       insertText:'Arrays.',       detail:'java.util.Arrays — array utilities',   kind:Kind.Class, documentation:{value:'Static array utilities:\n- `Arrays.sort(arr)` — O(n log n) sort\n- `Arrays.fill(arr, val)` — fill all\n- `Arrays.copyOf(arr, len)` — copy with new length\n- `Arrays.toString(arr)` — `[1, 2, 3]` format\n- `Arrays.binarySearch(arr, key)` — needs sorted'}, range, insertTextRules:Snippet},
    {label:'Collections',  insertText:'Collections.',  detail:'java.util.Collections — collection utils', kind:Kind.Class, documentation:{value:'Static collection utilities:\n- `Collections.sort(list)` `reverse(list)` `shuffle(list)`\n- `Collections.min(c)` `max(c)`\n- `Collections.frequency(c, obj)`\n- `Collections.reverseOrder()` — for max-heap'}, range, insertTextRules:Snippet},
    {label:'StringBuilder',insertText:'StringBuilder ',detail:'java.lang.StringBuilder — mutable string', kind:Kind.Class, documentation:{value:'Mutable string buffer. Faster than `+` concatenation in loops.\n```java\nStringBuilder sb = new StringBuilder();\nsb.append(val).append("\\n");\nSystem.out.print(sb);\n```\nMethods: `append()` `insert()` `delete()` `reverse()` `toString()`'}, range, insertTextRules:Snippet},
    {label:'ArrayList',    insertText:'ArrayList<${1:Integer}>()',    detail:'java.util.ArrayList<T>',          kind:Kind.Class, documentation:{value:'Resizable array. O(1) get/set, O(1) amortized add.\n```java\nList<Integer> list = new ArrayList<>();\nlist.add(x); list.get(i); list.size(); list.remove(i);\n```'}, range, insertTextRules:Snippet},
    {label:'LinkedList',   insertText:'LinkedList<${1:Integer}>()',   detail:'java.util.LinkedList<T>',         kind:Kind.Class, documentation:{value:'Doubly-linked list. O(1) add/remove at ends. O(n) random access.\nPrefer `ArrayDeque` for queue/stack operations.'}, range, insertTextRules:Snippet},
    {label:'HashMap',      insertText:'HashMap<${1:String}, ${2:Integer}>()',    detail:'java.util.HashMap<K,V>',  kind:Kind.Class, documentation:{value:'Hash table. O(1) average get/put/containsKey.\n```java\nMap<String, Integer> map = new HashMap<>();\nmap.put(key, val);\nmap.getOrDefault(key, 0);\nmap.merge(key, 1, Integer::sum); // freq count\n```'}, range, insertTextRules:Snippet},
    {label:'TreeMap',      insertText:'TreeMap<${1:Integer}, ${2:Integer}>()',   detail:'java.util.TreeMap<K,V> — sorted', kind:Kind.Class, documentation:{value:'Red-black tree. O(log n) all ops. Keys sorted.\n```java\nTreeMap<Integer, Integer> tm = new TreeMap<>();\ntm.floorKey(x);   // largest key ≤ x\ntm.ceilingKey(x); // smallest key ≥ x\ntm.firstKey(); tm.lastKey();\n```'}, range, insertTextRules:Snippet},
    {label:'LinkedHashMap',insertText:'LinkedHashMap<${1:String}, ${2:Integer}>()', detail:'java.util.LinkedHashMap — insertion ordered', kind:Kind.Class, documentation:{value:'HashMap that maintains insertion order. O(1) ops.\nUsed for LRU cache: `new LinkedHashMap<>(cap, 0.75f, true)` with `removeEldestEntry`.'}, range, insertTextRules:Snippet},
    {label:'HashSet',      insertText:'HashSet<${1:Integer}>()',   detail:'java.util.HashSet<T>',       kind:Kind.Class, documentation:{value:'Hash-based set. O(1) add/contains/remove.\n```java\nSet<Integer> set = new HashSet<>();\nset.add(x); set.contains(x); set.remove(x);\n```'}, range, insertTextRules:Snippet},
    {label:'TreeSet',      insertText:'TreeSet<${1:Integer}>()',   detail:'java.util.TreeSet<T> — sorted', kind:Kind.Class, documentation:{value:'Sorted unique elements. O(log n) ops.\n```java\nTreeSet<Integer> ts = new TreeSet<>();\nts.floor(x);   // largest ≤ x\nts.ceiling(x); // smallest ≥ x\nts.first(); ts.last();\n```'}, range, insertTextRules:Snippet},
    {label:'PriorityQueue',insertText:'PriorityQueue<${1:Integer}>()', detail:'java.util.PriorityQueue — min-heap', kind:Kind.Class, documentation:{value:'Binary heap. O(log n) offer/poll, O(1) peek.\nDefault = **min-heap** (smallest element first).\n```java\nPriorityQueue<Integer> pq = new PriorityQueue<>();\npq.offer(x); pq.poll(); pq.peek();\n// Max-heap:\nnew PriorityQueue<>(Collections.reverseOrder());\n```'}, range, insertTextRules:Snippet},
    {label:'ArrayDeque',   insertText:'ArrayDeque<${1:Integer}>()',   detail:'java.util.ArrayDeque — fast deque', kind:Kind.Class, documentation:{value:'Double-ended queue. Preferred over `Stack` and `LinkedList`.\n```java\nDeque<Integer> dq = new ArrayDeque<>();\n// Stack: dq.push(x) / dq.pop() / dq.peek()\n// Queue: dq.offer(x) / dq.poll() / dq.peek()\n// Both ends: offerFirst/offerLast/pollFirst/pollLast\n```'}, range, insertTextRules:Snippet},
    {label:'Comparator',   insertText:'Comparator.',  detail:'java.util.Comparator — sorting strategy', kind:Kind.Class, documentation:{value:'```java\nComparator.comparingInt(a -> a[0])  // by first element\n  .thenComparingInt(a -> a[1])       // tiebreak\n  .reversed()                         // descending\n(a, b) -> Integer.compare(a, b)      // explicit\n```'}, range, insertTextRules:Snippet},
    {label:'Optional',     insertText:'Optional<${1:String}>',  detail:'java.util.Optional<T>',   kind:Kind.Class, documentation:{value:'Container that may or may not hold a value.\n```java\nOptional.of(val)\nOptional.ofNullable(mayBeNull)\n.map(fn).filter(pred).orElse(default)\n```'}, range, insertTextRules:Snippet},
    {label:'List',         insertText:'List<${1:Integer}>',      detail:'java.util.List<T> interface',   kind:Kind.Interface, documentation:{value:'Ordered collection interface. Implementations: `ArrayList` (prefer), `LinkedList`.\n```java\nList<Integer> list = new ArrayList<>();\nList<Integer> immutable = List.of(1, 2, 3);\n```'}, range, insertTextRules:Snippet},
    {label:'Map',          insertText:'Map<${1:String}, ${2:Integer}>',  detail:'java.util.Map<K,V> interface',  kind:Kind.Interface, documentation:{value:'Key-value map interface. Implementations: `HashMap` `TreeMap` `LinkedHashMap`\n```java\nMap<String, Integer> map = new HashMap<>();\n```'}, range, insertTextRules:Snippet},
    {label:'Set',          insertText:'Set<${1:Integer}>',       detail:'java.util.Set<T> interface',    kind:Kind.Interface, documentation:{value:'Unique elements interface. Implementations: `HashSet` `TreeSet` `LinkedHashSet`\n```java\nSet<Integer> set = new HashSet<>();\n```'}, range, insertTextRules:Snippet},
    {label:'Queue',        insertText:'Queue<${1:Integer}>',     detail:'java.util.Queue<T> interface',  kind:Kind.Interface, documentation:{value:'FIFO queue interface.\n```java\nQueue<Integer> q = new LinkedList<>();\nq.offer(x); q.poll(); q.peek();\n```\nPrefer `ArrayDeque` over `LinkedList`.'}, range, insertTextRules:Snippet},
    {label:'Deque',        insertText:'Deque<${1:Integer}>',     detail:'java.util.Deque<T> interface',  kind:Kind.Interface, documentation:{value:'Double-ended queue.\n```java\nDeque<Integer> dq = new ArrayDeque<>();\n// use as stack: push/pop/peek\n// use as queue: offer/poll/peek\n```'}, range, insertTextRules:Snippet},
    {label:'Iterable',     insertText:'Iterable<${1:T}>',        detail:'java.lang.Iterable<T> interface', kind:Kind.Interface, documentation:{value:'Can be used in for-each loops.'}, range, insertTextRules:Snippet},
    {label:'Comparable',   insertText:'Comparable<${1:T}>',      detail:'java.lang.Comparable<T>',       kind:Kind.Interface, documentation:{value:'Implement to define natural ordering.\n```java\nclass MyClass implements Comparable<MyClass> {\n  public int compareTo(MyClass other) { ... }\n}\n```'}, range, insertTextRules:Snippet},

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 10 — CONTROL FLOW KEYWORDS (with smart insert text)
    // ════════════════════════════════════════════════════════════════════════
    {label:'if',         insertText:'if (${1:condition}) {\n\t${0}\n}',                              detail:'if statement',       kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'if-else',    insertText:'if (${1:condition}) {\n\t${2}\n} else {\n\t${0}\n}',            detail:'if-else',            kind:Kind.Keyword, insertTextRules:Snippet, range, sortText:'if-else'},
    {label:'else',       insertText:'else {\n\t${0}\n}',                                             detail:'else block',         kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'else if',    insertText:'else if (${1:condition}) {\n\t${0}\n}',                         detail:'else if',            kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'for',        insertText:'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${0}\n}', detail:'for loop',           kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'for-each',   insertText:'for (${1:int} ${2:item} : ${3:collection}) {\n\t${0}\n}',       detail:'for-each loop',      kind:Kind.Keyword, insertTextRules:Snippet, range, sortText:'for-each'},
    {label:'while',      insertText:'while (${1:condition}) {\n\t${0}\n}',                           detail:'while loop',         kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'do-while',   insertText:'do {\n\t${0}\n} while (${1:condition});',                       detail:'do-while loop',      kind:Kind.Keyword, insertTextRules:Snippet, range, sortText:'do-while'},
    {label:'switch',     insertText:'switch (${1:var}) {\n\tcase ${2:val}:\n\t\t${0}\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}', detail:'switch statement', kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'switch-expr',insertText:'int ${1:result} = switch (${2:var}) {\n\tcase ${3:val} -> ${4:0};\n\tdefault -> ${5:0};\n};', detail:'switch expression (Java 14+)', kind:Kind.Keyword, insertTextRules:Snippet, range, sortText:'switch-expr'},
    {label:'break',      insertText:'break;',                                                        detail:'break out of loop',  kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'continue',   insertText:'continue;',                                                     detail:'skip to next iteration', kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'return',     insertText:'return ${1};',                                                  detail:'return value',       kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'return void',insertText:'return;',                                                       detail:'return (void)',      kind:Kind.Keyword, insertTextRules:Snippet, range, sortText:'returnv'},
    {label:'try',        insertText:'try {\n\t${1}\n} catch (${2:Exception} e) {\n\t${3:e.printStackTrace();}\n}', detail:'try-catch block', kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'try-finally',insertText:'try {\n\t${1}\n} catch (${2:Exception} e) {\n\t${3}\n} finally {\n\t${0}\n}', detail:'try-catch-finally', kind:Kind.Keyword, insertTextRules:Snippet, range, sortText:'try-f'},
    {label:'try-resources',insertText:'try (${1:Resource} ${2:res} = new ${1:Resource}()) {\n\t${0}\n} catch (${3:Exception} e) {\n\t${4:e.printStackTrace();}\n}', detail:'try-with-resources (auto-close)', kind:Kind.Keyword, insertTextRules:Snippet, range, sortText:'try-r'},
    {label:'catch',      insertText:'catch (${1:Exception} e) {\n\t${0}\n}',                        detail:'catch block',        kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'finally',    insertText:'finally {\n\t${0}\n}',                                         detail:'finally block',      kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'throw',      insertText:'throw new ${1:RuntimeException}("${2:message}");',              detail:'throw exception',    kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'throws',     insertText:'throws ${1:Exception}',                                        detail:'throws declaration', kind:Kind.Keyword, insertTextRules:Snippet, range},

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 11 — OOP KEYWORDS
    // ════════════════════════════════════════════════════════════════════════
    {label:'class',      insertText:'class ${1:ClassName} {\n\t${0}\n}',                            detail:'class declaration',      kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'interface',  insertText:'interface ${1:InterfaceName} {\n\t${0}\n}',                    detail:'interface declaration',  kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'enum',       insertText:'enum ${1:EnumName} {\n\t${2:VALUE1}, ${3:VALUE2};\n}',          detail:'enum declaration',       kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'extends',    insertText:'extends ${1:ParentClass}',                                     detail:'inherit from class',     kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'implements', insertText:'implements ${1:Interface}',                                    detail:'implement interface',    kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'abstract',   insertText:'abstract ',                                                    detail:'abstract modifier',      kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'interface-method', insertText:'${1:void} ${2:method}(${3});\n',                         detail:'interface method (no body)', kind:Kind.Keyword, insertTextRules:Snippet, range, sortText:'interface-m'},
    {label:'override',   insertText:'@Override\n${0}',                                              detail:'@Override annotation',   kind:Kind.Keyword, insertTextRules:Snippet, range, sortText:'00override'},
    {label:'new',        insertText:'new ${1:ClassName}(${2})',                                     detail:'create object',          kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'instanceof', insertText:'instanceof ${1:ClassName}',                                    detail:'type check',             kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'this',       insertText:'this',                                                         detail:'current instance',       kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'super',      insertText:'super',                                                        detail:'parent class reference', kind:Kind.Keyword, insertTextRules:Snippet, range},

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 12 — MODIFIERS & MISC KEYWORDS
    // ════════════════════════════════════════════════════════════════════════
    {label:'public',      insertText:'public ',                  detail:'public access',           kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'private',     insertText:'private ',                 detail:'private access',          kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'protected',   insertText:'protected ',               detail:'protected access',        kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'static',      insertText:'static ',                  detail:'static member',           kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'final',       insertText:'final ',                   detail:'cannot be overridden/changed', kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'null',        insertText:'null',                     detail:'null reference',          kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'true',        insertText:'true',                     detail:'boolean true',            kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'false',       insertText:'false',                    detail:'boolean false',           kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'synchronized',insertText:'synchronized ',            detail:'thread-safe block',       kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'volatile',    insertText:'volatile ',                detail:'always read from main memory', kind:Kind.Keyword, documentation:{value:'Prevents CPU from caching this variable. Ensures all threads see the latest value. NOT atomic — use `AtomicInteger` for counters.'}, insertTextRules:Snippet, range},
    {label:'transient',   insertText:'transient ',               detail:'skip during serialization', kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'import',      insertText:'import ${1:java.util.*};', detail:'import statement',        kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'package',     insertText:'package ${1:com.example};',detail:'package declaration',     kind:Kind.Keyword, insertTextRules:Snippet, range},
    {label:'var',         insertText:'var ',                     detail:'local type inference (Java 10+)', kind:Kind.Keyword, documentation:{value:'Java 10+ local variable type inference.\n```java\nvar list = new ArrayList<String>(); // inferred as ArrayList<String>\nvar map  = new HashMap<String, Integer>();\n```'}, insertTextRules:Snippet, range},

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 13 — COMMON EXCEPTION CLASSES
    // ════════════════════════════════════════════════════════════════════════
    {label:'Exception',                insertText:'Exception',                detail:'java.lang.Exception — checked',          kind:Kind.Class, insertTextRules:Snippet, range},
    {label:'RuntimeException',         insertText:'RuntimeException',         detail:'java.lang.RuntimeException — unchecked', kind:Kind.Class, insertTextRules:Snippet, range},
    {label:'IllegalArgumentException', insertText:'IllegalArgumentException("${1:message}")', detail:'invalid argument exception', kind:Kind.Class, insertTextRules:Snippet, range},
    {label:'IllegalStateException',    insertText:'IllegalStateException("${1:message}")',    detail:'invalid state exception',    kind:Kind.Class, insertTextRules:Snippet, range},
    {label:'NullPointerException',     insertText:'NullPointerException',     detail:'null dereference',     kind:Kind.Class, insertTextRules:Snippet, range},
    {label:'ArrayIndexOutOfBoundsException', insertText:'ArrayIndexOutOfBoundsException', detail:'array index out of bounds', kind:Kind.Class, insertTextRules:Snippet, range},
    {label:'NumberFormatException',    insertText:'NumberFormatException',    detail:'invalid number format', kind:Kind.Class, insertTextRules:Snippet, range},
    {label:'StackOverflowError',       insertText:'StackOverflowError',       detail:'stack overflow (infinite recursion)', kind:Kind.Class, documentation:{value:'Usually caused by infinite recursion. Check your base case!'}, insertTextRules:Snippet, range},
    {label:'ArithmeticException',      insertText:'ArithmeticException',      detail:'arithmetic error (e.g. divide by zero)', kind:Kind.Class, insertTextRules:Snippet, range},
    {label:'IOException',              insertText:'IOException',              detail:'java.io.IOException — I/O error', kind:Kind.Class, insertTextRules:Snippet, range},
  ];
}