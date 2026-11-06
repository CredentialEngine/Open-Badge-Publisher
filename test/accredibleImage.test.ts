import { assert, test } from 'vitest';
import {
	isAccredibleSignedImageUrl,
	redirectTargetFromProxyData
} from '../src/lib/utils/accredible.js';
import { IMAGE_URL_MAX_LENGTH, imageUrlTooLong } from '../src/lib/utils/badges.js';

const signed =
	'https://sandbox.pdf.ms.credential.net/design/image?signed-data=%7B%22design%22%3A%22abc%22%7D&refresh=true';
const s3 = 'https://s3.amazonaws.com/staging_accredible_api_mails/design/abc_def.png';

test('recognizes Accredible signed render URLs only', () => {
	assert.isTrue(isAccredibleSignedImageUrl(signed));
	assert.isTrue(isAccredibleSignedImageUrl('https://pdf.ms.credential.net/design/image?x=1'));
	assert.isFalse(isAccredibleSignedImageUrl(s3));
	assert.isFalse(isAccredibleSignedImageUrl('https://evilpdf.ms.credential.net/design/image'));
	assert.isFalse(isAccredibleSignedImageUrl('http://pdf.ms.credential.net/design/image'));
	assert.isFalse(isAccredibleSignedImageUrl('https://pdf.ms.credential.net/other'));
	assert.isFalse(isAccredibleSignedImageUrl('not a url'));
});

test('extracts https redirect target from a 3xx proxy response', () => {
	const data = { StatusCode: 303, Headers: [{ Name: 'location', Value: s3 }] };
	assert.equal(redirectTargetFromProxyData(data, signed), s3);
	assert.equal(redirectTargetFromProxyData({ ...data, StatusCode: '303' }, signed), s3);
});

test('ignores non-redirect, missing, or non-https targets', () => {
	assert.equal(redirectTargetFromProxyData({ StatusCode: 200, Headers: [] }, signed), '');
	assert.equal(redirectTargetFromProxyData({ StatusCode: 303, Headers: [] }, signed), '');
	assert.equal(
		redirectTargetFromProxyData(
			{ StatusCode: 302, Headers: [{ Name: 'Location', Value: 'http://example.com/x.png' }] },
			signed
		),
		''
	);
	assert.equal(redirectTargetFromProxyData(undefined, signed), '');
});

test('flags image URLs over the Publisher limit', () => {
	assert.isFalse(imageUrlTooLong(undefined));
	assert.isFalse(imageUrlTooLong('x'.repeat(IMAGE_URL_MAX_LENGTH)));
	assert.isTrue(imageUrlTooLong('x'.repeat(IMAGE_URL_MAX_LENGTH + 1)));
});
