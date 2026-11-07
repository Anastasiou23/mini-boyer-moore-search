# mini-boyer-moore-search

A small, dependency-free implementation of the Boyer-Moore exact string search algorithm with bad-character and good-suffix heuristics.

## Usage

```js
import { boyerMooreSearch, boyerMooreSearchAll } from './src/index.js';

const index = boyerMooreSearch('hello world', 'world');
console.log(index); // 6

const all = boyerMooreSearchAll('aaaaa', 'aa');
console.log(all); // [0, 1, 2, 3]
```

The library exports two functions:

- `boyerMooreSearch(text, pattern)` returns the index of the first occurrence of `pattern` in `text`, or `-1` if not found.
- `boyerMooreSearchAll(text, pattern)` returns an array of all starting indices where `pattern` occurs, including overlapping matches. The indices are in ascending order.

Both functions accept either a string or a `Uint8Array`. Strings are encoded as UTF-8 before searching, so the search is byte-oriented. For ASCII text this matches the intuitive behaviour. For multi-byte characters, the pattern must match at a byte boundary; this is the standard behaviour for byte-oriented search and avoids the complexity of character indexing.

## Why this library exists

Boyer-Moore is a classic algorithm that can be significantly faster than naive search on large texts because it skips sections of the text using two heuristics. However, many implementations are either incomplete, rely on external packages, or only handle strings. This library provides a compact, correct implementation that works on both strings and raw bytes, with no dependencies.

The trade-off: the implementation is byte-oriented rather than character-oriented. This keeps the code simple and fast, and it is the right choice when searching binary data or ASCII text. If you need character-aware search for arbitrary Unicode, you would need to decode to code points first.

## Awkward edge

An empty pattern matches at index 0 for `boyerMooreSearch`, and `boyerMooreSearchAll` returns every index from 0 to the text length inclusive. This is a deliberate choice: it makes the behaviour total and predictable, and it mirrors how many string libraries treat empty search strings.
