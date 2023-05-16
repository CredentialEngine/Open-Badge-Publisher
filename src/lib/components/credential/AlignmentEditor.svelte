<script lang="ts">
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import SingleEditableAlignment from '$lib/components/credential/SingleEditableAlignment.svelte';

	import type { CtdlCredentialDraft } from '$lib/stores/publisherStore.js';

	export let credential: CtdlCredentialDraft;
</script>

<BodyText>
	Open Badges alignments can describe a wide variety of relationships. The default is a "required
	Competency". Here you can customize the type of aligned resource and its connection to the
	credential.
</BodyText>

{#each Object.keys(credential.obAlignments) as alignmentKey (alignmentKey)}
	{#if credential.obAlignments[alignmentKey].sourceData.targetFramework != 'Credentials Transparency Description Language'}
		<!-- TODO: the above CTDL self-references may be already filtered out at obAlignment creation time.-->
		<SingleEditableAlignment {credential} ac={credential.obAlignments[alignmentKey]} />
	{/if}
{/each}
