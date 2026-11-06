import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boyerMooreSearch, boyerMooreSearchAll } from '../src/index.js';

test('finds a simple match', () => {
  assert.equal(boyerMooreSearch('hello world', 'world'), 6);
});

test('returns -1 when pattern is not present', () => {
  assert.equal(boyerMooreSearch('hello world', 'xyz'), -1);
});

test('empty pattern matches at index 0', () => {
  assert.equal(boyerMooreSearch('abc', ''), 0);
});

test('pattern longer than text returns -1', () => {
  assert.equal(boyerMooreSearch('ab', 'abc'), -1);
});

test('finds overlapping occurrences with searchAll', () => {
  assert.deepEqual(boyerMooreSearchAll('aaaaa', 'aa'), [0, 1, 2, 3]);
});

test('searchAll with empty pattern returns all positions including end', () => {
  assert.deepEqual(boyerMooreSearchAll('abc', ''), [0, 1, 2, 3]);
});

test('works with Uint8Array input', () => {
  const text = new Uint8Array([1, 2, 3, 4, 5]);
  const pattern = new Uint8Array([3, 4]);
  assert.equal(boyerMooreSearch(text, pattern), 2);
});

test('handles pattern with repeated suffix correctly', () => {
  // This exercises the good-suffix rule.
  assert.equal(boyerMooreSearch('abababab', 'abab'), 0);
  assert.equal(boyerMooreSearch('bbababab', 'abab'), 2);
});

test('finds match at the end of text', () => {
  assert.equal(boyerMooreSearch('abcdef', 'def'), 3);
});

test('finds no match when text is empty', () => {
  assert.equal(boyerMooreSearch('', 'a'), -1);
});

test('searchAll returns empty array when no match', () => {
  assert.deepEqual(boyerMooreSearchAll('abc', 'd'), []);
});

test('searchAll finds non-overlapping and overlapping mixed', () => {
  assert.deepEqual(boyerMooreSearchAll('ababa', 'aba'), [0, 2]);
});
