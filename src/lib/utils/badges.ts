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
	image: string;
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
