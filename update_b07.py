import json

f = 'C:/Dev/devlearner/devlearner/learning-system/src/main/resources/seeds/B07-strings.json'
with open(f, encoding='utf-8') as fh:
    data = json.load(fh)

improvements = {
    1: {
        "description": "Reverse a string `s` **in-place** where `s` is given as a character array. Do not allocate extra space for another array.\n\n**Example 1:**\nInput: s = ['h','e','l','l','o']\nOutput: ['o','l','l','e','h']\n\n**Example 2:**\nInput: s = ['H','a','n','n','a','h']\nOutput: ['h','a','n','n','a','H']",
        "sampleInput": "['h','e','l','l','o']",
        "sampleOutput": "['o','l','l','e','h']"
    },
    2: {
        "description": "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s` — both strings contain the same characters with the same frequencies.\n\n**Example 1:**\nInput: s = \"anagram\", t = \"nagaram\"\nOutput: true\n\n**Example 2:**\nInput: s = \"rat\", t = \"car\"\nOutput: false\nExplanation: Different characters — 'r','a','t' vs 'c','a','r'.",
        "sampleInput": "s = \"anagram\", t = \"nagaram\"",
        "sampleOutput": "true"
    },
    3: {
        "description": "Given a string `s`, return `true` if it is a palindrome — ignoring non-alphanumeric characters and case differences.\n\n**Example 1:**\nInput: \"A man, a plan, a canal: Panama\"\nOutput: true\nExplanation: After filtering: \"amanaplanacanalpanama\" — reads the same forwards and backwards.\n\n**Example 2:**\nInput: \"race a car\"\nOutput: false\nExplanation: Filtered: \"raceacar\" — not a palindrome.",
        "sampleInput": "\"A man, a plan, a canal: Panama\"",
        "sampleOutput": "true"
    },
    4: {
        "description": "Find the **longest common prefix** string shared by all strings in an array. Return an empty string `\"\"` if no common prefix exists.\n\n**Example 1:**\nInput: [\"flower\",\"flow\",\"flight\"]\nOutput: \"fl\"\nExplanation: \"fl\" is the longest prefix all three strings share.\n\n**Example 2:**\nInput: [\"dog\",\"racecar\",\"car\"]\nOutput: \"\"\nExplanation: No common prefix among the three strings.",
        "sampleInput": "[\"flower\",\"flow\",\"flight\"]",
        "sampleOutput": "\"fl\""
    },
    5: {
        "description": "The count-and-say sequence is defined as: `1` → `\"11\"` (one 1) → `\"21\"` (two 1s) → `\"1211\"` (one 2, one 1) → ... Given `n`, return the nth term of the sequence.\n\n**Example 1:**\nInput: n = 1\nOutput: \"1\"\n\n**Example 2:**\nInput: n = 4\nOutput: \"1211\"\nExplanation: Term 1→\"1\", 2→\"11\", 3→\"21\", 4→\"1211\" (one 2, one 1).\n\n**Example 3:**\nInput: n = 5\nOutput: \"111221\"",
        "sampleInput": "4",
        "sampleOutput": "\"1211\""
    },
    6: {
        "description": "Convert an integer in the range `[1, 3999]` to its **Roman numeral** representation. Roman numerals use subtractive notation: IV=4, IX=9, XL=40, XC=90, CD=400, CM=900.\n\n**Example 1:**\nInput: 3\nOutput: \"III\"\n\n**Example 2:**\nInput: 1994\nOutput: \"MCMXCIV\"\nExplanation: M=1000, CM=900, XC=90, IV=4.\n\n**Example 3:**\nInput: 58\nOutput: \"LVIII\"\nExplanation: L=50, V=5, III=3.",
        "sampleInput": "1994",
        "sampleOutput": "\"MCMXCIV\""
    },
    7: {
        "description": "Given strings `s` and `t`, find the **minimum window substring** of `s` that contains all characters in `t` (including duplicates). Return `\"\"` if no such window exists.\n\n**Example 1:**\nInput: s = \"ADOBECODEBANC\", t = \"ABC\"\nOutput: \"BANC\"\nExplanation: \"BANC\" is the smallest window containing A, B, and C.\n\n**Example 2:**\nInput: s = \"a\", t = \"a\"\nOutput: \"a\"\n\n**Example 3:**\nInput: s = \"a\", t = \"aa\"\nOutput: \"\"\nExplanation: t requires two 'a's but s has only one.",
        "sampleInput": "s = \"ADOBECODEBANC\", t = \"ABC\"",
        "sampleOutput": "\"BANC\""
    },
    8: {
        "description": "Given an array of strings `strs`, group the **anagrams** together. Each group can appear in any order.\n\n**Example 1:**\nInput: [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]\nOutput: [[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]\nExplanation: Strings sharing the same sorted characters are anagrams of each other.\n\n**Example 2:**\nInput: [\"\"]\nOutput: [[\"\"]]\n\n**Example 3:**\nInput: [\"a\"]\nOutput: [[\"a\"]]",
        "sampleInput": "[\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]",
        "sampleOutput": "[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]"
    },
    9: {
        "description": "Given a string `s`, find the length of the **longest substring without repeating characters**.\n\n**Example 1:**\nInput: \"abcabcbb\"\nOutput: 3\nExplanation: \"abc\" is the longest substring without repeating characters.\n\n**Example 2:**\nInput: \"bbbbb\"\nOutput: 1\nExplanation: The answer is \"b\", with length 1.\n\n**Example 3:**\nInput: \"pwwkew\"\nOutput: 3\nExplanation: \"wke\" has length 3; note that \"pwke\" is a subsequence, not a substring.",
        "sampleInput": "\"abcabcbb\"",
        "sampleOutput": "3"
    },
    10: {
        "description": "Implement `atoi` which converts a string to a 32-bit signed integer. Rules: skip leading whitespace, handle optional `+`/`-` sign, read digits until a non-digit or end, clamp to `[Integer.MIN_VALUE, Integer.MAX_VALUE]`.\n\n**Example 1:**\nInput: \"42\"\nOutput: 42\n\n**Example 2:**\nInput: \"   -042\"\nOutput: -42\nExplanation: Leading spaces ignored, leading zeros ignored.\n\n**Example 3:**\nInput: \"1337c0d3\"\nOutput: 1337\nExplanation: Stops at the non-digit 'c'.",
        "sampleInput": "\"   -042\"",
        "sampleOutput": "-42"
    },
    11: {
        "description": "Given an encoded string like `\"3[a2[c]]\"`, decode it and return the expanded string. The encoding rule: `k[encoded_string]` means `encoded_string` repeated exactly `k` times. Brackets can be nested.\n\n**Example 1:**\nInput: \"3[a2[c]]\"\nOutput: \"accaccacc\"\nExplanation: 2[c]→\"cc\", then 3[a+cc]→\"accaccacc\".\n\n**Example 2:**\nInput: \"2[abc]3[cd]ef\"\nOutput: \"abcabccdcdcdef\"\n\n**Example 3:**\nInput: \"abc3[cd]xyz\"\nOutput: \"abccdcdcdxyz\"",
        "sampleInput": "\"3[a2[c]]\"",
        "sampleOutput": "\"accaccacc\""
    },
    12: {
        "description": "Given string `s` and a dictionary `wordDict`, return `true` if `s` can be segmented into one or more space-separated words that all exist in the dictionary.\n\n**Example 1:**\nInput: s = \"leetcode\", wordDict = [\"leet\",\"code\"]\nOutput: true\nExplanation: \"leet\" + \"code\" = \"leetcode\".\n\n**Example 2:**\nInput: s = \"applepenapple\", wordDict = [\"apple\",\"pen\"]\nOutput: true\nExplanation: \"apple\" + \"pen\" + \"apple\".\n\n**Example 3:**\nInput: s = \"catsandog\", wordDict = [\"cats\",\"dog\",\"sand\",\"and\",\"cat\"]\nOutput: false",
        "sampleInput": "s = \"leetcode\", wordDict = [\"leet\",\"code\"]",
        "sampleOutput": "true"
    },
    13: {
        "description": "Implement `strStr(haystack, needle)` using **KMP** algorithm: return the index of the first occurrence of `needle` in `haystack`, or `-1` if not found. Return `0` if `needle` is empty.\n\n**Example 1:**\nInput: haystack = \"sadbutsad\", needle = \"sad\"\nOutput: 0\nExplanation: \"sad\" occurs first at index 0.\n\n**Example 2:**\nInput: haystack = \"leetcode\", needle = \"leeto\"\nOutput: -1\nExplanation: \"leeto\" does not appear in \"leetcode\".",
        "sampleInput": "haystack = \"sadbutsad\", needle = \"sad\"",
        "sampleOutput": "0"
    },
    14: {
        "description": "Given a string `s`, partition it such that **every substring** in the partition is a palindrome. Return **all possible** palindrome partitioning results.\n\n**Example 1:**\nInput: \"aab\"\nOutput: [[\"a\",\"a\",\"b\"],[\"aa\",\"b\"]]\nExplanation: Both \"a\"/\"a\"/\"b\" and \"aa\"/\"b\" are valid palindrome partitions.\n\n**Example 2:**\nInput: \"a\"\nOutput: [[\"a\"]]\n\n**Example 3:**\nInput: \"aba\"\nOutput: [[\"a\",\"b\",\"a\"],[\"aba\"]]",
        "sampleInput": "\"aab\"",
        "sampleOutput": "[[\"a\",\"a\",\"b\"],[\"aa\",\"b\"]]"
    },
    15: {
        "description": "Implement regex matching with two special characters: `.` matches any single character, `*` matches zero or more of the preceding element. The match must cover the **entire** input string.\n\n**Example 1:**\nInput: s = \"aa\", p = \"a*\"\nOutput: true\nExplanation: 'a*' matches zero or more 'a' — here it matches \"aa\".\n\n**Example 2:**\nInput: s = \"ab\", p = \".*\"\nOutput: true\nExplanation: \".*\" matches any sequence of characters.\n\n**Example 3:**\nInput: s = \"aab\", p = \"c*a*b\"\nOutput: true\nExplanation: c*=0 c's, a*=2 a's, b=b.",
        "sampleInput": "s = \"aa\", p = \"a*\"",
        "sampleOutput": "true"
    },
    16: {
        "description": "Find the **longest palindromic substring** in string `s`. A palindrome reads the same forwards and backwards. Return any one if multiple exist with the same maximum length.\n\n**Example 1:**\nInput: \"babad\"\nOutput: \"bab\"\nExplanation: \"aba\" is also valid. Both have length 3.\n\n**Example 2:**\nInput: \"cbbd\"\nOutput: \"bb\"\nExplanation: \"bb\" is the longest palindromic substring.\n\n**Example 3:**\nInput: \"racecar\"\nOutput: \"racecar\"",
        "sampleInput": "\"babad\"",
        "sampleOutput": "\"bab\""
    },
    17: {
        "description": "Given strings `s1`, `s2`, and `s3`, return `true` if `s3` is formed by an **interleaving** of `s1` and `s2`. An interleaving preserves the relative order of characters from each string.\n\n**Example 1:**\nInput: s1 = \"aabcc\", s2 = \"dbbca\", s3 = \"aadbbcbcac\"\nOutput: true\n\n**Example 2:**\nInput: s1 = \"aabcc\", s2 = \"dbbca\", s3 = \"aadbbbaccc\"\nOutput: false\n\n**Example 3:**\nInput: s1 = \"\", s2 = \"\", s3 = \"\"\nOutput: true",
        "sampleInput": "s1 = \"aabcc\", s2 = \"dbbca\", s3 = \"aadbbcbcac\"",
        "sampleOutput": "true"
    },
    18: {
        "description": "Implement wildcard pattern matching: `?` matches any single character, `*` matches any sequence of characters (including empty). The match must cover the **entire** input string.\n\n**Example 1:**\nInput: s = \"aa\", p = \"*\"\nOutput: true\nExplanation: '*' matches the entire string.\n\n**Example 2:**\nInput: s = \"cb\", p = \"?a\"\nOutput: false\nExplanation: '?' matches 'c', but 'a' ≠ 'b'.\n\n**Example 3:**\nInput: s = \"adceb\", p = \"*a*b\"\nOutput: true",
        "sampleInput": "s = \"adceb\", p = \"*a*b\"",
        "sampleOutput": "true"
    },
    19: {
        "description": "Find the **shortest palindrome** that can be created by adding characters only to the **front** of the string. Equivalently, find the longest palindromic prefix and prepend the reverse of the remaining suffix.\n\n**Example 1:**\nInput: \"aacecaaa\"\nOutput: \"aaacecaaa\"\nExplanation: Add one 'a' to the front.\n\n**Example 2:**\nInput: \"abcd\"\nOutput: \"dcbabcd\"\nExplanation: The longest palindromic prefix is \"a\"; prepend reverse of \"bcd\" = \"dcb\".",
        "sampleInput": "\"aacecaaa\"",
        "sampleOutput": "\"aaacecaaa\""
    },
    20: {
        "description": "Given two strings `word1` and `word2`, return the **minimum number of operations** (insert, delete, or replace a single character) to convert `word1` into `word2` — the Levenshtein distance.\n\n**Example 1:**\nInput: word1 = \"horse\", word2 = \"ros\"\nOutput: 3\nExplanation: horse → rorse (replace h→r) → rose (delete r) → ros (delete e).\n\n**Example 2:**\nInput: word1 = \"intention\", word2 = \"execution\"\nOutput: 5",
        "sampleInput": "word1 = \"horse\", word2 = \"ros\"",
        "sampleOutput": "3"
    },
}

updated = 0
for topic in data['topics']:
    for p in topic.get('problems', []):
        order = p['displayOrder']
        if order in improvements:
            imp = improvements[order]
            p['description'] = imp['description']
            p['sampleInput'] = imp['sampleInput']
            p['sampleOutput'] = imp['sampleOutput']
            updated += 1

with open(f, 'w', encoding='utf-8') as fh:
    json.dump(data, fh, indent=2, ensure_ascii=False)
print(f"B07 updated: {updated} problems improved")
