import { defineEnvVars } from '@sveltejs/kit/env';

// Public values are visible in the browser. Never put real OAuth client secrets here.
// Use a public OAuth client with PKCE or a backend exchange for confidential clients.
export const variables = defineEnvVars({
	PUBLIC_ACCREDIBLE_FETCH_GROUP_SKILLS: {
		public: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_BASEURL: { public: true, static: true },
	PUBLIC_CANVAS_AU_ENABLED: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_CANVAS_AU_LOGIN_CLIENT_ID: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_CANVAS_AU_LOGIN_CLIENT_SECRET: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_CANVAS_CA_ENABLED: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_CANVAS_CA_LOGIN_CLIENT_ID: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_CANVAS_CA_LOGIN_CLIENT_SECRET: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_CANVAS_EU_ENABLED: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_CANVAS_EU_LOGIN_CLIENT_ID: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_CANVAS_EU_LOGIN_CLIENT_SECRET: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_CANVAS_TEST_ENABLED: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_CANVAS_TEST_LOGIN_CLIENT_ID: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_CANVAS_TEST_LOGIN_CLIENT_SECRET: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_CANVAS_US_ENABLED: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_CANVAS_US_LOGIN_CLIENT_ID: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_CANVAS_US_LOGIN_CLIENT_SECRET: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_DEV_BYPASS_PUBLISHER_LOGIN: {
		public: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_DEV_PUBLISHER_ORG_CTID: {
		public: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_DEV_PUBLISHER_ORG_NAME: {
		public: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_AU_ENABLED: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_AU_LOGIN_CLIENT_ID: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_AU_LOGIN_CLIENT_SECRET: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_CA_ENABLED: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_CA_LOGIN_CLIENT_ID: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_CA_LOGIN_CLIENT_SECRET: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_EU_ENABLED: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_EU_LOGIN_CLIENT_ID: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_EU_LOGIN_CLIENT_SECRET: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_SG_ENABLED: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_SG_LOGIN_CLIENT_ID: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_SG_LOGIN_CLIENT_SECRET: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_TEST_ENABLED: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_TEST_LOGIN_CLIENT_ID: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_TEST_LOGIN_CLIENT_SECRET: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_US_ENABLED: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_US_LOGIN_CLIENT_ID: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PARCHMENT_US_LOGIN_CLIENT_SECRET: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_PUBLISHER_API_BASEURL: { public: true, static: true },
	PUBLIC_PUBLISHER_API_ENV_LABEL: {
		public: true,
		static: true,
		schema: (value: string | undefined) => value ?? ''
	},
	PUBLIC_UI_API_BASEURL: { public: true, static: true }
});
