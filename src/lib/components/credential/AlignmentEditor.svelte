<script lang="ts">
	import BodyText from '$lib/components/typography/BodyText.svelte';
	import SingleEditableAlignment from '$lib/components/credential/SingleEditableAlignment.svelte';

	import type { CtdlCredentialDraft } from '$lib/stores/publisherStore.js';

	export let credential: CtdlCredentialDraft;
</script>

<div>
	<BodyText>
		Open Badges alignments can describe a wide variety of relationships. The default is a "required
		Competency". Here you can customize the type of aligned resource and its connection to the
		credential.
	</BodyText>

	<div class="pt-2 space-y-6">
		{#each Object.keys(credential.obAlignments) as alignmentKey (alignmentKey)}
			<SingleEditableAlignment {credential} ac={credential.obAlignments[alignmentKey]} />
		{/each}
	</div>
</div>
