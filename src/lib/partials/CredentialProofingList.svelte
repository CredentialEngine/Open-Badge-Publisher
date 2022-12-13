<script lang="ts">
	import { slide } from 'svelte/transition';
	import Icon from 'svelte-icons-pack/Icon.svelte';
	import FaSolidExternalLinkAlt from 'svelte-icons-pack/fa/FaSolidExternalLinkAlt.js';
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import EditableCredentialDetail from '$lib/components/credential/EditableCredentialDetail.svelte';
	import Heading from '$lib/components/typography/Heading.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import TagLink from '$lib/components/TagLink.svelte';
	import abbreviate from '$lib/utils/abbreviate.js';
	import { ctdlCredentials } from '$lib/stores/publisherStore.js';

	let currentlyEditing: { [key: string]: boolean } = {};
	const handleEditCredential = (credentialId: string) => {
		currentlyEditing[credentialId] = true;
	};
	const handleFinishEditingCredential = (credentialId: string) => {
		currentlyEditing[credentialId] = false;
	};
</script>

<BodyText>
	Check to see that the following Credential definitions are correct. You can customize options for
	each badge before saving to the publisher.
</BodyText>

<ul class="space-y-4">
	{#each $ctdlCredentials as credential (credential.Credential.CredentialId)}
		<li>
			{#if currentlyEditing[credential.Credential.CredentialId]}
				<EditableCredentialDetail {credential} {handleFinishEditingCredential} />
			{:else}
				<!-- Fields shown own CE detail page - https://sandbox.credentialengine.org/publisher/credential/7259
                {Name},
                Issuer Name
                {CredentialType}

                About This Credential:          {image}         Owned By
                {Description}                                   {Issuer Name}
                                                                "Offered By" "Owned By"
                Status: {Status}                                (other issuer metadata values as tags)
                Credential Type:
                {Credential Type (again):}

                Additional Information
                In Language: {InLanguage}

                {Competencies}
                {RequirementProfiles}
                -->
				<div
					class="flex flex-col md:flex-row w-full bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700"
					transition:slide
				>
					<div class="flex-initial max-w-xs mx-auto p-6">
						<img
							class="aspect-square"
							width="160"
							src={credential.Credential.Image || 'https://placekitten.com/400/400'}
							alt={`The badge image is a symbolic representation of ${credential.Credential.Name}`}
						/>
					</div>
					<div class="p-6 flex-auto">
						<Heading><h4>{credential.Credential.Name}</h4></Heading>
						<div class="space-x-2">
							<Tag>{credential.Credential.CredentialType}</Tag>
							<Tag>{credential.Credential.CredentialStatusType}</Tag>
							<Tag>{credential.Credential.InLanguage.join(', ')}</Tag>
							<a href={credential.Credential.CredentialId} target="new"
								><TagLink>
									{abbreviate(credential.Credential.CredentialId, 28)}
									<Icon
										src={FaSolidExternalLinkAlt}
										color="currentColor"
										className="inline-block"
										size="0.8em"
									/>
								</TagLink></a
							>
						</div>
						<BodyText>
							<span class="text-sm">{abbreviate(credential.Credential.Description, 280)}</span>
						</BodyText>
						<button
							type="button"
							class="text-gray-900 text-sm px-5 py-2.5 bg-white hover:bg-gray-100 hover:text-blue-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:border-gray-600 focus:outline-none dark:focus:ring-gray-700"
							on:click={() => handleEditCredential(credential.Credential.CredentialId)}
						>
							Edit
						</button>
					</div>
				</div>
			{/if}
		</li>
	{/each}
</ul>
