export const OB_V2_CONTEXT = {
	'@context': {
		id: '@id',
		type: '@type',

		extensions: 'https://w3id.org/openbadges/extensions#',
		obi: 'https://w3id.org/openbadges#',
		validation: 'obi:validation',

		cred: 'https://w3id.org/credentials#',
		dc: 'http://purl.org/dc/terms/',
		schema: 'http://schema.org/',
		sec: 'https://w3id.org/security#',
		xsd: 'http://www.w3.org/2001/XMLSchema#',

		AlignmentObject: 'schema:AlignmentObject',
		CryptographicKey: 'sec:Key',
		Endorsement: 'cred:Credential',

		Assertion: 'obi:Assertion',
		BadgeClass: 'obi:BadgeClass',
		Criteria: 'obi:Criteria',
		Evidence: 'obi:Evidence',
		Extension: 'obi:Extension',
		FrameValidation: 'obi:FrameValidation',
		IdentityObject: 'obi:IdentityObject',
		Image: 'obi:Image',
		HostedBadge: 'obi:HostedBadge',
		hosted: 'obi:HostedBadge',
		Issuer: 'obi:Issuer',
		Profile: 'obi:Profile',
		RevocationList: 'obi:RevocationList',
		SignedBadge: 'obi:SignedBadge',
		signed: 'obi:SignedBadge',
		TypeValidation: 'obi:TypeValidation',
		VerificationObject: 'obi:VerificationObject',

		author: { '@id': 'schema:author', '@type': '@id' },
		caption: { '@id': 'schema:caption' },
		claim: { '@id': 'cred:claim', '@type': '@id' },
		created: { '@id': 'dc:created', '@type': 'xsd:dateTime' },
		creator: { '@id': 'dc:creator', '@type': '@id' },
		description: { '@id': 'schema:description' },
		email: { '@id': 'schema:email' },
		endorsement: { '@id': 'cred:credential', '@type': '@id' },
		expires: { '@id': 'sec:expiration', '@type': 'xsd:dateTime' },
		genre: { '@id': 'schema:genre' },
		image: { '@id': 'schema:image', '@type': '@id' },
		name: { '@id': 'schema:name' },
		owner: { '@id': 'sec:owner', '@type': '@id' },
		publicKey: { '@id': 'sec:publicKey', '@type': '@id' },
		publicKeyPem: { '@id': 'sec:publicKeyPem' },
		related: { '@id': 'dc:relation', '@type': '@id' },
		startsWith: { '@id': 'http://purl.org/dqm-vocabulary/v1/dqm#startsWith' },
		tags: { '@id': 'schema:keywords' },
		targetDescription: { '@id': 'schema:targetDescription' },
		targetFramework: { '@id': 'schema:targetFramework' },
		targetName: { '@id': 'schema:targetName' },
		targetUrl: { '@id': 'schema:targetUrl' },
		telephone: { '@id': 'schema:telephone' },
		url: { '@id': 'schema:url', '@type': '@id' },
		version: { '@id': 'schema:version' },

		alignment: { '@id': 'obi:alignment', '@type': '@id' },
		allowedOrigins: { '@id': 'obi:allowedOrigins' },
		audience: { '@id': 'obi:audience' },
		badge: { '@id': 'obi:badge', '@type': '@id' },
		criteria: { '@id': 'obi:criteria', '@type': '@id' },
		endorsementComment: { '@id': 'obi:endorsementComment' },
		evidence: { '@id': 'obi:evidence', '@type': '@id' },
		hashed: { '@id': 'obi:hashed', '@type': 'xsd:boolean' },
		identity: { '@id': 'obi:identityHash' },
		issuedOn: { '@id': 'obi:issueDate', '@type': 'xsd:dateTime' },
		issuer: { '@id': 'obi:issuer', '@type': '@id' },
		narrative: { '@id': 'obi:narrative' },
		recipient: { '@id': 'obi:recipient', '@type': '@id' },
		revocationList: { '@id': 'obi:revocationList', '@type': '@id' },
		revocationReason: { '@id': 'obi:revocationReason' },
		revoked: { '@id': 'obi:revoked', '@type': 'xsd:boolean' },
		revokedAssertions: { '@id': 'obi:revoked' },
		salt: { '@id': 'obi:salt' },
		targetCode: { '@id': 'obi:targetCode' },
		uid: { '@id': 'obi:uid' },
		validatesType: 'obi:validatesType',
		validationFrame: 'obi:validationFrame',
		validationSchema: 'obi:validationSchema',
		verification: { '@id': 'obi:verify', '@type': '@id' },
		verificationProperty: { '@id': 'obi:verificationProperty' },
		verify: 'verification'
	}
};

export const OB_V3_CONTEXT = {
	'@context': {
		id: '@id',
		type: '@type',
		xsd: 'https://www.w3.org/2001/XMLSchema#',

		OpenBadgeCredential: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#OpenBadgeCredential'
		},
		Achievement: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Achievement',
			'@context': {
				achievementType: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#achievementType',
					'@type': 'xsd:string'
				},
				alignment: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#alignment',
					'@container': '@set'
				},
				creator: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Profile'
				},
				creditsAvailable: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#creditsAvailable',
					'@type': 'xsd:float'
				},
				criteria: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Criteria',
					'@type': '@id'
				},
				fieldOfStudy: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#fieldOfStudy',
					'@type': 'xsd:string'
				},
				humanCode: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#humanCode',
					'@type': 'xsd:string'
				},
				otherIdentifier: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#otherIdentifier',
					'@container': '@set'
				},
				related: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#related',
					'@container': '@set'
				},
				resultDescription: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#resultDescription',
					'@container': '@set'
				},
				specialization: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#specialization',
					'@type': 'xsd:string'
				},
				tag: {
					'@id': 'https://schema.org/keywords',
					'@type': 'xsd:string',
					'@container': '@set'
				},
				version: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#version',
					'@type': 'xsd:string'
				}
			}
		},
		AchievementCredential: {
			'@id': 'OpenBadgeCredential'
		},
		AchievementSubject: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#AchievementSubject',
			'@context': {
				achievement: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Achievement'
				},
				activityEndDate: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#activityEndDate',
					'@type': 'xsd:date'
				},
				activityStartDate: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#activityStartDate',
					'@type': 'xsd:date'
				},
				creditsEarned: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#creditsEarned',
					'@type': 'xsd:float'
				},
				identifier: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#identifier',
					'@container': '@set'
				},
				licenseNumber: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#licenseNumber',
					'@type': 'xsd:string'
				},
				result: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#result',
					'@container': '@set'
				},
				role: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#role',
					'@type': 'xsd:string'
				},
				source: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#source'
				},
				term: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#term',
					'@type': 'xsd:string'
				}
			}
		},
		Address: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Address',
			'@context': {
				addressCountry: {
					'@id': 'https://schema.org/addressCountry',
					'@type': 'xsd:string'
				},
				addressCountryCode: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#CountryCode',
					'@type': 'xsd:string'
				},
				addressLocality: {
					'@id': 'https://schema.org/addressLocality',
					'@type': 'xsd:string'
				},
				addressRegion: {
					'@id': 'https://schema.org/addressRegion',
					'@type': 'xsd:string'
				},
				geo: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#GeoCoordinates'
				},
				postOfficeBoxNumber: {
					'@id': 'https://schema.org/postOfficeBoxNumber',
					'@type': 'xsd:string'
				},
				postalCode: {
					'@id': 'https://schema.org/postalCode',
					'@type': 'xsd:string'
				},
				streetAddress: {
					'@id': 'https://schema.org/streetAddress',
					'@type': 'xsd:string'
				}
			}
		},
		Alignment: {
			'@id': 'https://schema.org/Alignment',
			'@context': {
				targetCode: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#targetCode',
					'@type': 'xsd:string'
				},
				targetDescription: {
					'@id': 'https://schema.org/targetDescription',
					'@type': 'xsd:string'
				},
				targetFramework: {
					'@id': 'https://schema.org/targetFramework',
					'@type': 'xsd:string'
				},
				targetName: {
					'@id': 'https://schema.org/targetName',
					'@type': 'xsd:string'
				},
				targetType: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#targetType',
					'@type': 'xsd:string'
				},
				targetUrl: {
					'@id': 'https://schema.org/targetUrl',
					'@type': 'xsd:anyURI'
				}
			}
		},
		Criteria: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Criteria'
		},
		EndorsementCredential: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#EndorsementCredential'
		},
		EndorsementSubject: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#EndorsementSubject',
			'@context': {
				endorsementComment: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#endorsementComment',
					'@type': 'xsd:string'
				}
			}
		},
		Evidence: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Evidence',
			'@context': {
				audience: {
					'@id': 'https://schema.org/audience',
					'@type': 'xsd:string'
				},
				genre: {
					'@id': 'https://schema.org/genre',
					'@type': 'xsd:string'
				}
			}
		},
		GeoCoordinates: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#GeoCoordinates',
			'@context': {
				latitude: {
					'@id': 'https://schema.org/latitude',
					'@type': 'xsd:string'
				},
				longitude: {
					'@id': 'https://schema.org/longitude',
					'@type': 'xsd:string'
				}
			}
		},
		IdentifierEntry: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#IdentifierEntry',
			'@context': {
				identifier: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#identifier',
					'@type': 'xsd:string'
				},
				identifierType: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#identifierType',
					'@type': 'xsd:string'
				}
			}
		},
		IdentityObject: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#IdentityObject',
			'@context': {
				hashed: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#hashed',
					'@type': 'xsd:boolean'
				},
				identityHash: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#identityHash',
					'@type': 'xsd:string'
				},
				identityType: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#identityType',
					'@type': 'xsd:string'
				},
				salt: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#salt',
					'@type': 'xsd:string'
				}
			}
		},
		Image: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Image',
			'@context': {
				caption: {
					'@id': 'https://schema.org/caption',
					'@type': 'xsd:string'
				}
			}
		},
		Profile: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Profile',
			'@context': {
				additionalName: {
					'@id': 'https://schema.org/additionalName',
					'@type': 'xsd:string'
				},
				address: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Address'
				},
				dateOfBirth: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#dateOfBirth',
					'@type': 'xsd:date'
				},
				email: {
					'@id': 'https://schema.org/email',
					'@type': 'xsd:string'
				},
				familyName: {
					'@id': 'https://schema.org/familyName',
					'@type': 'xsd:string'
				},
				familyNamePrefix: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#familyNamePrefix',
					'@type': 'xsd:string'
				},
				givenName: {
					'@id': 'https://schema.org/givenName',
					'@type': 'xsd:string'
				},
				honorificPrefix: {
					'@id': 'https://schema.org/honorificPrefix',
					'@type': 'xsd:string'
				},
				honorificSuffix: {
					'@id': 'https://schema.org/honorificSuffix',
					'@type': 'xsd:string'
				},
				otherIdentifier: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#otherIdentifier',
					'@container': '@set'
				},
				parentOrg: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#parentOrg',
					'@type': 'xsd:string'
				},
				patronymicName: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#patronymicName',
					'@type': 'xsd:string'
				},
				phone: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#PhoneNumber',
					'@type': 'xsd:string'
				},
				official: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#official',
					'@type': 'xsd:string'
				}
			}
		},
		Related: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Related',
			'@context': {
				version: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#version',
					'@type': 'xsd:string'
				}
			}
		},
		Result: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Result',
			'@context': {
				achievedLevel: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#achievedLevel',
					'@type': 'xsd:anyURI'
				},
				resultDescription: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#resultDescription',
					'@type': 'xsd:anyURI'
				},
				status: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#status',
					'@type': 'xsd:string'
				},
				value: {
					'@id': 'https://schema.org/value',
					'@type': 'xsd:string'
				}
			}
		},
		ResultDescription: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#ResultDescription',
			'@context': {
				allowedValue: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#allowedValue',
					'@type': 'xsd:string',
					'@container': '@set'
				},
				requiredLevel: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#requiredLevel',
					'@type': 'xsd:anyURI'
				},
				requiredValue: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#requiredValue',
					'@type': 'xsd:string'
				},
				resultType: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#resultType',
					'@type': 'xsd:string'
				},
				rubricCriterionLevel: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#rubricCriterionLevel',
					'@container': '@set'
				},
				valueMax: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#valueMax',
					'@type': 'xsd:string'
				},
				valueMin: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#valueMin',
					'@type': 'xsd:string'
				}
			}
		},
		RubricCriterionLevel: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#RubricCriterionLevel',
			'@context': {
				level: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#level',
					'@type': 'xsd:string'
				},
				points: {
					'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#points',
					'@type': 'xsd:string'
				}
			}
		},
		alignment: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#alignment',
			'@container': '@set'
		},
		description: {
			'@id': 'https://schema.org/description',
			'@type': 'xsd:string'
		},
		endorsement: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#endorsement',
			'@container': '@set'
		},
		image: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#image'
		},
		name: {
			'@id': 'https://schema.org/name',
			'@type': 'xsd:string'
		},
		narrative: {
			'@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#narrative',
			'@type': 'xsd:string'
		},
		url: {
			'@id': 'https://schema.org/url',
			'@type': 'xsd:anyURI'
		}
	}
};

/*  This hybrid context enables us to not need to make any network requests
in order to use JSON-LD compact operation to get JSON-LD badge data into a 
predictable format. Because this context is forcibly inserted into input data
some input data may be lost, and it is not possible to import data that was not 
crafted using roughly the OB 2.0 or 3.0 context.
 */
export const OB_V2_V3_EXPERIMENTAL_HYBRID_CONTEXT = {
	'@context': {
		...OB_V2_CONTEXT['@context'],
		...OB_V3_CONTEXT['@context']
	}
};
