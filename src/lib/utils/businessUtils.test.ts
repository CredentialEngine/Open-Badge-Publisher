import { describe, expect, it } from 'vitest';
import abbreviate from './abbreviate.js';
import { listOf } from './jsonld.js';
import { pluralize, pluralizeFrom } from './pluralize.js';
import { haveSameDomain } from './urls.js';

describe('business and data-normalization helpers', () => {
	it('abbreviates only strings longer than the allowed length', () => {
		expect(abbreviate('hello', 5)).toBe('hello');
		expect(abbreviate('hello world', 6)).toBe('hello…');
	});

	it('normalizes scalar JSON-LD values into arrays', () => {
		expect(listOf('BadgeClass')).toEqual(['BadgeClass']);
		expect(listOf(['BadgeClass', 'Achievement'])).toEqual(['BadgeClass', 'Achievement']);
	});

	it('pluralizes singular and plural labels', () => {
		expect(pluralize(1, 'credential')).toBe('credential');
		expect(pluralize(0, 'credential')).toBe('credentials');
		expect(pluralize(2, 'box', 'es')).toBe('boxes');
		expect(pluralizeFrom(0, 'none', 'one', 'many')).toBe('none');
		expect(pluralizeFrom(1, 'none', 'one', 'many')).toBe('one');
		expect(pluralizeFrom(2, 'none', 'one', 'many')).toBe('many');
	});

	it('compares hostnames and ports without accepting unrelated subdomains', () => {
		expect(haveSameDomain('https://example.org/a', 'https://example.org/b')).toBe(true);
		expect(haveSameDomain('https://example.org', 'https://evil.example.org')).toBe(false);
		expect(haveSameDomain('https://example.org:8443', 'https://example.org')).toBe(false);
		expect(haveSameDomain('not a valid URL http://', 'https://example.org')).toBe(false);
	});
});
