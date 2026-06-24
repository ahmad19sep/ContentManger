import { expect, test } from 'vitest';
import { hasMarkers, parsePostOutput } from './lib/parsePostOutput';

const SAMPLE = `[[HEADLINE]]
OpenAI launches GPT-5.5
[[ARTICLE]]
A long article body
across two lines.
[[X_POST]]
Big news today. https://example.com
[[RISK_LEVEL]]
low`;

test('parses marker blocks into fields', () => {
  const p = parsePostOutput(SAMPLE);
  expect(p.headline).toBe('OpenAI launches GPT-5.5');
  expect(p.article).toBe('A long article body\nacross two lines.');
  expect(p.xPost).toBe('Big news today. https://example.com');
  expect(p.riskLevel).toBe('low');
});

test('ignores unknown markers and empty input', () => {
  expect(parsePostOutput('[[BOGUS]]\nx')).toEqual({});
  expect(parsePostOutput('')).toEqual({});
  expect(hasMarkers('no markers here')).toBe(false);
  expect(hasMarkers(SAMPLE)).toBe(true);
});
