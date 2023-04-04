import * as jsonld from 'jsonld';
import * as yup from 'yup';
import { OB_V2_V3_EXPERIMENTAL_HYBRID_CONTEXT } from '$lib/utils/contexts/openbadges_v2.js';
import { listOf } from '$lib/utils/jsonld.js';

export interface Alignment {
	targetName: string;
	targetUrl: string;
	targetDescription: string;
	targetFramework?: string;
	targetCode?: string;
}

export interface BadgeClassBasic {
	id: string;
	name: string;
	image?: string;
	description: string;
	issuer: string;
	achievementType?: string | null;
	tags: string[];
	criteria: {
		id?: string | null;
		narrative?: string | null;
	};
	alignment: Alignment[];
}

export interface BadgeClassCTDLExtended extends BadgeClassBasic {
	'ceterms:dateEffective'?: string;
}

interface MaybeABadgeClass {
	'@context'?: string;
	type?: string;
	id?: string;
	image?: string | { id: string };
	name?: string;
	description?: string;
	issuer?: string | { id: string };
	achievementType?: string | null;
	tag?: string[];
	tags?: string[];
	criteria?: {
		id?: string | null;
		narrative?: string | null;
	};
	alignment?: Alignment[];
}

const badgeClassBasicSchema = yup.object().shape({
	id: yup.string().default('').required(),
	name: yup.string().default('').required(),
	image: yup
		.string()
		.default('')
		.transform((value): string => {
			try {
				if (typeof value === 'string') return value;
				else if (value['id']) return value['id'];
				throw new yup.ValidationError('Could not identify Image URI from input.');
			} catch {
				throw new yup.ValidationError('Could not identify Image URI from input.');
			}
			return '';
		})
		.url(
			'Image URLs must be fully qualified URLs. Data URIs are not accepted by the Credential Registry at this time.'
		),
	description: yup.string().default('').required(),
	issuer: yup
		.string()
		.default('')
		.transform((value): string => {
			try {
				if (typeof value === 'string') return value;
				else if (value['id']) return value['id'];
			} catch {
				return '';
			}
			return '';
		}),
	tags: yup.array().default([]).ensure().of(yup.string()),
	criteria: yup
		.object()
		.shape({
			id: yup.string().url(),
			narrative: yup.string()
		})
		.required(),
	alignment: yup
		.array()
		.default([])
		.ensure()
		.of(
			yup.object().shape({
				targetName: yup.string().required(),
				targetDescription: yup.string(),
				targetUrl: yup.string().required().url(),
				targetFramework: yup.string(),
				targetCode: yup.string()
			})
		)
});

const ob2ToBasic = (b: MaybeABadgeClass): BadgeClassBasic => {
	let image_url: string = '';
	let issuer_id: string = '';

	if (typeof b.image === 'string') image_url = b.image;
	else if (b.image?.hasOwnProperty('id')) image_url = b.image['id'] || '';

	if (typeof b.issuer === 'string') issuer_id = b.issuer;
	else if (b.issuer?.hasOwnProperty('id')) issuer_id = b.issuer['id'] || '';

	return {
		id: b['id'] || '',
		name: b['name'] || '',
		image: image_url,
		description: b['description'] || '',
		issuer: issuer_id,
		achievementType: b['achievementType'] || undefined,
		tags: b['tags'] || [],
		criteria: b['criteria'] || {},
		alignment: b['alignment'] || []
	};
};

const ob3ToBasic = (b: MaybeABadgeClass): BadgeClassBasic => {
	let image_url: string = '';
	let issuer_id: string = '';

	if (typeof b.image === 'string') image_url = b.image;
	else if (b.image?.hasOwnProperty('id')) image_url = b.image['id'] || '';

	if (typeof b.issuer === 'string') issuer_id = b.issuer;
	else if (b.issuer?.hasOwnProperty('id')) issuer_id = b.issuer['id'] || '';

	return {
		id: b['id'] || '',
		name: b['name'] || '',
		image: image_url,
		description: b['description'] || '',
		issuer: issuer_id,
		achievementType: b['achievementType'] || undefined,
		tags: b['tag'] || [],
		criteria: b['criteria'] || {},
		alignment: b['alignment'] || []
	};
};

// Throws yup.ValidationError for errors
export const validateSingleBadge = async (b: MaybeABadgeClass): Promise<BadgeClassBasic> => {
	const to_validate = {
		...b,
		'@context': OB_V2_V3_EXPERIMENTAL_HYBRID_CONTEXT
	};
	let compacted;
	let validationInput;

	try {
		compacted = (await jsonld.compact(
			to_validate,
			OB_V2_V3_EXPERIMENTAL_HYBRID_CONTEXT
		)) as MaybeABadgeClass;

		console.log('Compacted, that looks like:');
		console.log(compacted);

		const nodeTypes = listOf(compacted['type']);

		if (nodeTypes.includes('Achievement')) validationInput = ob3ToBasic(compacted);
		else if (nodeTypes.includes('BadgeClass')) validationInput = ob2ToBasic(compacted);
		else
			throw new yup.ValidationError(
				'No type found when compacted into experimental hybrid OB2/OB3 context.'
			);

		console.log('Processed to basic model:');
		console.log(validationInput);
	} catch (e) {
		throw new yup.ValidationError('JSON-LD compaction error: ' + e.message);
	}
	const validationResults = await badgeClassBasicSchema.validate(validationInput, {
		abortEarly: false
	});
	return validationResults as BadgeClassBasic;
};
