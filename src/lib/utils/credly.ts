export interface CredlyIssuerBasic {
	id: string;
	name: string;
	vanity_url: string;
	badge_count: number;
}

export interface CredlyBadgeBasic {
	id: string;
	name: string;
	description: string;
	image_url: string;
	alignments: Array<{
		id: string;
		name: string;
		description: string;
		url: string;
	}>;
	skills: Array<{
		id: string;
		name: string;
		vanity_slug: string;
	}>;
	badge_template_activities: Array<{
		id: string;
		activity_type: string;
		required_badge_template_id?: string | null;
		title: string;
		url?: string | null;
	}>;
	url?: string | null;
}
