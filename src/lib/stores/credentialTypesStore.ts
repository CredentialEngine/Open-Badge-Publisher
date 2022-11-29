import { readable } from 'svelte/store';

const DEFAULT_TYPES = [
	{
		Id: 12,
		URI: 'ceterms:Badge',
		Name: 'Badge',
		Description:
			'A credential designed to be displayed as a marker of accomplishment, activity, achievement, skill, interest, association, or identity. Digital Badge (digitalBadge) - A badge offered in digital form. Open Badge (openBadge) An Open Badge is a visual symbol that contains verifiable claims in accordance with the Open Badges specification and is delivered digitally.',
		Icon: ''
	},
	{
		Id: 2204,
		URI: 'ceterms:DigitalBadge',
		Name: 'Digital Badge',
		Description: 'A badge offered in digital form.',
		Icon: ''
	},
	{
		Id: 2205,
		URI: 'ceterms:OpenBadge',
		Name: 'Open Badge',
		Description:
			'An Open Badge is a visual symbol that contains verifiable claims in accordance with the Open Badges specification and is delivered digitally.',
		Icon: ''
	},
	{
		Id: 18,
		URI: 'ceterms:Certificate',
		Name: 'Certificate',
		Description:
			'A credential that designates requisite mastery of the knowledge and skills of an occupation, profession, or academic program.',
		Icon: ''
	},
	{
		Id: 2577,
		URI: 'ceterms:CertificateOfCompletion',
		Name: 'Certificate of Completion',
		Description:
			'Credential that acknowledges completion of an assignment, training or other activity.',
		Icon: ''
	},
	{
		Id: 2203,
		URI: 'ceterms:ApprenticeshipCertificate',
		Name: 'Apprenticeship Certificate',
		Description:
			'A credential earned through work-based learning and postsecondary earn-and-learn models that meet national standards and are applicable to industry trades and professions.',
		Icon: ''
	},
	{
		Id: 2317,
		URI: 'ceterms:JourneymanCertificate',
		Name: 'Journeyman Certificate',
		Description:
			'A credential awarded to skilled workers on successful completion of an apprenticeship in industry trades and professions.',
		Icon: ''
	},
	{
		Id: 2318,
		URI: 'ceterms:MasterCertificate',
		Name: 'Master Certificate',
		Description:
			'A credential awarded upon demonstration through apprenticeship of the highest level of skills and performance in industry trades and professions.',
		Icon: ''
	},
	{
		Id: 14,
		URI: 'ceterms:Certification',
		Name: 'Certification',
		Description:
			'A time-limited, renewable non-degree credential awarded by an authoritative body to an individual or organization for demonstrating the designated knowledge, skills, and abilities to perform a specific job.',
		Icon: ''
	},
	{
		Id: 13,
		URI: 'ceterms:Diploma',
		Name: 'Diploma',
		Description:
			'A award by an educational institution for successful completion of the requirements of a course of study or equivalent.',
		Icon: ''
	},
	{
		Id: 2209,
		URI: 'ceterms:GeneralEducationDevelopment',
		Name: 'General Education Development (GED)',
		Description:
			'A credential awarded by examination that demonstrates that an individual has acquired secondary school-level academic skills.',
		Icon: ''
	},
	{
		Id: 1173,
		URI: 'ceterms:SecondarySchoolDiploma',
		Name: 'Secondary School Diploma',
		Description:
			'A award by secondary educational institutions for successfully completion of a course of study.',
		Icon: ''
	},
	{
		Id: 71,
		URI: 'ceterms:AssociateDegree',
		Name: "Associate's Degree",
		Description:
			'An award level that normally requires at least 2 but less than 4 years of full-time equivalent college-level work.',
		Icon: ''
	},
	{
		Id: 72,
		URI: 'ceterms:BachelorDegree',
		Name: "Bachelor's Degree",
		Description:
			'An award level that normally requires at least 4 but not more than 5 years of full-time equivalent college-level work.',
		Icon: ''
	},
	{
		Id: 73,
		URI: 'ceterms:MasterDegree',
		Name: "Master's Degree",
		Description:
			"An award level that requires the successful completion of a program of study of at least the full-time equivalent of 1 but not more than 2 academic years of work beyond the bachelor's degree.",
		Icon: ''
	},
	{
		Id: 74,
		URI: 'ceterms:DoctoralDegree',
		Name: 'Doctoral Degree',
		Description: 'The highest award level to be earned for postsecondary study.',
		Icon: ''
	},
	{
		Id: 2207,
		URI: 'ceterms:ProfessionalDoctorate',
		Name: 'Professional Doctorate Degree',
		Description:
			'A doctoral degree conferred upon completion of a program providing the knowledge and skills for the recognition, credential, or license required for professional practice.',
		Icon: ''
	},
	{
		Id: 2208,
		URI: 'ceterms:ResearchDoctorate',
		Name: 'Research Doctorate Degree',
		Description:
			'A doctoral degree conferred for advanced work beyond the master level, including the preparation and defense of a thesis or dissertation based on original research, or the planning and execution of an original project demonstrating substantial artistic or scholarly achievement.',
		Icon: ''
	},
	{
		Id: 15,
		URI: 'ceterms:License',
		Name: 'License',
		Description:
			'A credential awarded by a government agency that constitutes legal authority to do a specific job and/or utilize a specific item, system or infrastructure and are typically earned through some combination of degree or certificate attainment, certifications, assessments, work experience, and/or fees, and are time-limited and must be renewed periodically.',
		Icon: ''
	},
	{
		Id: 16,
		URI: 'ceterms:MicroCredential',
		Name: 'Micro-Credential',
		Description:
			'A credential that attests to achievement of a specific knowledge, skill, or competency.',
		Icon: ''
	},
	{
		Id: 1177,
		URI: 'ceterms:QualityAssuranceCredential',
		Name: 'Quality Assurance Credential',
		Description:
			'A credential assuring that an organization, program, or awarded credential meets prescribed requirements and may include development and administration of qualifying examinations.',
		Icon: ''
	}
];

export const credentialTypesStore = readable(DEFAULT_TYPES);
// todo: trigger a request on load and refresh list from /publisher/StagingApi/Load/CredentialTypes
