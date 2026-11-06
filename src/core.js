/**
 * Boyer-Moore substring search with bad-character and good-suffix heuristics.
 *
 * The implementation returns the index of the first occurrence of `pattern`
 * in `text`, or -1 if the pattern is not present. The search is performed
 * left-to-right over the text, but the pattern is compared right-to-left,
 * which allows large skips when a mismatch occurs.
 *
 * Why these heuristics?
 * - The bad-character rule is cheap to compute and often gives a decent skip.
 * - The good-suffix rule handles repeated suffixes within the pattern, which
 *   the bad-character rule alone can miss, especially for patterns like
 *   "ababab".
 *
 * The shift is the maximum of the two rules, which is the standard
 * Boyer-Moore approach and guarantees correctness.
 */

/**
 * Build the bad-character shift table for a pattern.
 *
 * For each byte value 0..255, the table stores how far the pattern can be
 * shifted when a mismatch occurs at a given pattern position and the text
 * character is the one that caused the mismatch. If the character does not
 * appear in the pattern, the whole pattern can be shifted past it.
 *
 * We use a Uint32Array of length 256 because we operate on bytes of a
 * Buffer/Uint8Array, and 256 covers all possible byte values. This keeps
 * the table compact and fast.
 *
 * @param {Uint8Array} pattern - The pattern bytes.
 * @returns {Uint32Array} A 256-entry table of shift distances.
 */
function buildBadCharTable(pattern) {
  const m = pattern.length;
  const table = new Uint32Array(256);
  // Default shift: move the whole pattern past the mismatched character.
  table.fill(m);
  for (let i = 0; i < m - 1; i++) {
    // The last occurrence of a character determines the shift; we overwrite
    // earlier values so that the final table holds the rightmost index.
    table[pattern[i]] = m - 1 - i;
  }
  return table;
}

/**
 * Build the good-suffix shift table for a pattern.
 *
 * The good-suffix rule says: if a mismatch occurs after matching a suffix
 * of the pattern, we can shift the pattern so that the longest proper
 * suffix of the matched part aligns with an earlier occurrence of that
 * suffix, or with a prefix of the pattern.
 *
 * This implementation uses the standard preprocessing from the original
 * Boyer-Moore paper. It computes two arrays:
 *   - `suffix`: for each position i, the length of the longest suffix of
 *     pattern[0..i] that is also a suffix of the whole pattern.
 *   - `shift`: the actual shift distances.
 *
 * The algorithm is O(m) and uses only integer arithmetic.
 *
 * @param {Uint8Array} pattern - The pattern bytes.
 * @returns {Uint32Array} An array of length m+1 with shift distances.
 */
function buildGoodSuffixTable(pattern) {
  const m = pattern.length;
  const shift = new Uint32Array(m + 1);
  const suffix = new Uint32Array(m + 1);

  // Case 1: the matched suffix does not occur elsewhere in the pattern.
  // We shift so that the longest prefix of the pattern that is also a
  // suffix of the matched part aligns with the text.
  let i = m;
  let j = m + 1;
  suffix[i] = j;
  while (i > 0) {
    while (j <= m && pattern[i - 1] !== pattern[j - 1]) {
      if (shift[j] === 0) {
        shift[j] = j - i;
      }
      j = suffix[j];
    }
    i--;
    j--;
    suffix[i] = j;
  }

  // Case 2: the matched suffix occurs elsewhere in the pattern.
  // We shift so that the next occurrence of the suffix aligns.
  j = suffix[0];
  for (i = 0; i <= m; i++) {
    if (shift[i] === 0) {
      shift[i] = j;
    }
    if (i === j) {
      j = suffix[j];
    }
  }

  return shift;
}

/**
 * Find the first occurrence of `pattern` in `text` using Boyer-Moore.
 *
 * Both arguments are converted to Uint8Array views. Strings are encoded as
 * UTF-8, which means the search is byte-oriented. For ASCII text this is
 * exactly the expected behaviour. For multi-byte characters the pattern
 * must match at a byte boundary; this is the standard behaviour of
 * byte-oriented search and avoids the complexity of character indexing.
 *
 * @param {string|Uint8Array} text - The haystack.
 * @param {string|Uint8Array} pattern - The needle.
 * @returns {number} The index of the first occurrence, or -1 if not found.
 */
export function boyerMooreSearch(text, pattern) {
  const t = typeof text === 'string' ? new TextEncoder().encode(text) : text;
  const p = typeof pattern === 'string' ? new TextEncoder().encode(pattern) : pattern;

  const n = t.length;
  const m = p.length;

  // Empty pattern: by convention, an empty pattern matches at index 0.
  if (m === 0) return 0;
  // Pattern longer than text: cannot match.
  if (m > n) return -1;

  const badChar = buildBadCharTable(p);
  const goodSuffix = buildGoodSuffixTable(p);

  let s = 0; // shift of the pattern with respect to the text
  while (s <= n - m) {
    let j = m - 1;
    // Compare right-to-left.
    while (j >= 0 && p[j] === t[s + j]) {
      j--;
    }
    if (j < 0) {
      return s; // match found
    }
    // Mismatch at p[j] vs t[s+j]. Compute shift.
    const badCharShift = badChar[t[s + j]] - (m - 1 - j);
    const goodSuffixShift = goodSuffix[j + 1];
    const shift = Math.max(badCharShift, goodSuffixShift);
    // The shift must be at least 1 to avoid an infinite loop.
    s += Math.max(1, shift);
  }
  return -1;
}

/**
 * Find all occurrences of `pattern` in `text` using Boyer-Moore.
 *
 * Returns an array of starting indices, in ascending order. Overlapping
 * matches are included. The implementation repeatedly calls the single
 * search and advances by one position after a match to allow overlaps.
 *
 * @param {string|Uint8Array} text - The haystack.
 * @param {string|Uint8Array} pattern - The needle.
 * @returns {number[]} Array of starting indices.
 */
export function boyerMooreSearchAll(text, pattern) {
  const t = typeof text === 'string' ? new TextEncoder().encode(text) : text;
  const p = typeof pattern === 'string' ? new TextEncoder().encode(pattern) : pattern;

  const m = p.length;
  if (m === 0) {
    // Empty pattern matches at every position, including the end.
    const n = t.length;
    const result = [];
    for (let i = 0; i <= n; i++) result.push(i);
    return result;
  }

  const result = [];
  let start = 0;
  while (start <= t.length - m) {
    const idx = boyerMooreSearch(t.subarray(start), p);
    if (idx === -1) break;
    result.push(start + idx);
    start += idx + 1; // allow overlapping matches
  }
  return result;
}
