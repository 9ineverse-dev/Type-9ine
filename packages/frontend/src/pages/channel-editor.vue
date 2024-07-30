<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700">
		<div v-if="channelId == null || channel != null" class="_gaps_m">
			<MkInput v-model="name">
				<template #label>{{ i18n.ts.name }}</template>
			</MkInput>

			<MkTextarea v-model="description" mfmAutocomplete :mfmPreview="true">
				<template #label>{{ i18n.ts.description }}</template>
			</MkTextarea>

			<MkColorInput v-model="color">
				<template #label>{{ i18n.ts.color }}</template>
			</MkColorInput>

			<MkSwitch v-model="allowRenoteToExternal">
				<template #label>{{ i18n.ts._channel.allowRenoteToExternal }}</template>
			</MkSwitch>

			<div>
				<MkButton v-if="bannerId == null" @click="setBannerImage"><i class="ti ti-plus"></i> {{ i18n.ts._channel.setBanner }}</MkButton>
				<div v-else-if="bannerUrl">
					<img :src="bannerUrl" style="width: 100%;"/>
					<MkButton @click="removeBannerImage()"><i class="ti ti-trash"></i> {{ i18n.ts._channel.removeBanner }}</MkButton>
				</div>
			</div>

			<MkSwitch v-model="isSensitive">
				<template #label>{{ i18n.ts.compartmentalization }}</template>
			</MkSwitch>

			<MkSwitch v-model="searchable">
				{{ i18n.ts.channelSearchable }}
			</MkSwitch>

			<MkFolder :defaultOpen="true">
				<template #label>{{ i18n.ts.pinnedNotes }}</template>

				<div class="_gaps">
					<MkButton primary rounded @click="addPinnedNote()"><i class="ti ti-plus"></i></MkButton>

					<Sortable
						v-model="pinnedNotes"
						itemKey="id"
						:handle="'.' + $style.pinnedNoteHandle"
						:animation="150"
					>
						<template #item="{element,index}">
							<div :class="$style.pinnedNote">
								<button class="_button" :class="$style.pinnedNoteHandle"><i class="ti ti-menu"></i></button>
								{{ element.id }}
								<button class="_button" :class="$style.pinnedNoteRemove" @click="removePinnedNote(index)"><i class="ti ti-x"></i></button>
							</div>
						</template>
					</Sortable>
				</div>
			</MkFolder>

			<MkSwitch v-model="isPrivate" :disabled="!$i.policies.canCreatePrivateChannel">
				{{ i18n.ts._channel.isPrivate }}
			</MkSwitch>

			<MkSwitch v-model="isLocalOnly">
				<template #label>{{ i18n.ts._channel.isLocalOnly }}</template>
			</MkSwitch>

			<MkFolder v-if="isPrivate && $i.policies.canCreatePrivateChannel === true" :defaultOpen="true">
				<template #label>{{ i18n.ts._channel.privateUserIds }}</template>

				<div class="_gaps">
					<MkButton primary rounded @click="addPrivateUserIds()"><i class="ti ti-plus"></i></MkButton>

					<Sortable
						v-model="privateUserIds"
						itemKey="value"
						:handle="'.' + $style.pinnedNoteHandle"
						:animation="150"
					>
						<template #item="{element,index}">
							<div :class="$style.pinnedNote">
								<button class="_button" :class="$style.pinnedNoteHandle"><i class="ti ti-menu"></i></button>
								{{ element.label }}
								<button class="_button" :class="$style.pinnedNoteRemove" @click="removePrivateUserIds(index)"><i class="ti ti-x"></i></button>
							</div>
						</template>
					</Sortable>
				</div>
			</MkFolder>

			<div class="_buttons">
				<MkButton primary @click="save()"><i class="ti ti-device-floppy"></i> {{ channelId ? i18n.ts.save : i18n.ts.create }}</MkButton>
				<MkButton v-if="channelId" danger @click="archive()"><i class="ti ti-trash"></i> {{ i18n.ts.archive }}</MkButton>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, watch, defineAsyncComponent, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkColorInput from '@/components/MkColorInput.vue';
import { selectFile } from '@/scripts/select-file.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { $i } from '@/account.js';
import MkTextarea from '@/components/MkTextarea.vue';
import { useRouter } from '@/router/supplier.js';

const Sortable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

const router = useRouter();

const props = defineProps<{
	channelId?: string;
}>();

const channel = ref<Misskey.entities.Channel | null>(null);
const name = ref<string | null>(null);
const description = ref<string | null>(null);
const bannerUrl = ref<string | null>(null);
const bannerId = ref<string | null>(null);
const color = ref('#FFFFFF');
const isSensitive = ref(false);
const searchable = ref(true);
const isPrivate = ref(false);
const privateUserIds = ref<{ value: string, label: string}[]>([]);
const isLocalOnly = ref(false);
const allowRenoteToExternal = ref(true);
const pinnedNotes = ref<{ id: Misskey.entities.Note['id'] }[]>([]);

watch(() => bannerId.value, async () => {
	if (bannerId.value == null) {
		bannerUrl.value = null;
	} else {
		bannerUrl.value = (await misskeyApi('drive/files/show', {
			fileId: bannerId.value,
		})).url;
	}
});

watch(isPrivate, () => {
	if (isPrivate.value) {
		searchable.value = false;
	}
});

async function fetchChannel() {
	if (props.channelId == null) return;

	channel.value = await misskeyApi('channels/show', {
		channelId: props.channelId,
	});

	name.value = channel.value.name;
	description.value = channel.value.description;
	bannerId.value = channel.value.bannerId;
	bannerUrl.value = channel.value.bannerUrl;
	searchable.value = channel.value.searchable;
	isSensitive.value = channel.value.isSensitive;
	isPrivate.value = channel.value.isPrivate;
	const fetchPrivateUserIds = channel.value.privateUserIds;
	color.value = channel.value.color;
	allowRenoteToExternal.value = channel.value.allowRenoteToExternal;
	isLocalOnly.value = channel.value.isLocalOnly;
	const set = new Set(fetchPrivateUserIds);
	const searchPrivateUserIds = [...set];
	const pusers = await misskeyApi('users/show', {
		userIds: searchPrivateUserIds,
	});
	if (pusers) {
		let tmp: any[] = [];
		for (let puser of pusers) {
			if (puser) {
				tmp.push({ value: puser.id, label: puser.username });
			}
		}
		privateUserIds.value = tmp;
	}
	pinnedNotes.value = channel.value.pinnedNoteIds.map(id => ({
		id,
	}));

}

//fetchChannel();

onMounted(() => {
	fetchChannel();
});

async function addPrivateUserIds() {
	const { canceled, result } = await os.inputText({
		title: i18n.ts.usernameOrUserId,
	});
	if (canceled) return;

	const show = (user) => {
		privateUserIds.value = [{
			value: user.id,
			label: user.username,
		}, ...privateUserIds.value];
	};

	const usernamePromise = misskeyApi('users/show', Misskey.acct.parse(result) );
	const idPromise = misskeyApi('users/show', { userId: result });
	let _notFound = false;
	const notFound = () => {
		if (_notFound) {
			os.alert({
				type: 'error',
				text: i18n.ts.noSuchUser,
			});
		} else {
			_notFound = true;
		}
	};
	usernamePromise.then(show).catch(err => {
		if (err.code === 'NO_SUCH_USER') {
			notFound();
		}
	});
	idPromise.then(show).catch(err => {
		notFound();
	});
}

function removePrivateUserIds(index: number) {
	privateUserIds.value.splice(index, 1);
}

async function addPinnedNote() {
	const { canceled, result: value } = await os.inputText({
		title: i18n.ts.noteIdOrUrl,
	});
	if (canceled) return;
	const note = await os.apiWithDialog('notes/show', {
		noteId: value.includes('/') ? value.split('/').pop() : value,
	});
	pinnedNotes.value = [{
		id: note.id,
	}, ...pinnedNotes.value];
}

function removePinnedNote(index: number) {
	pinnedNotes.value.splice(index, 1);
}

async function save() {

	const fetchPrivateUserIds = privateUserIds.value.map(v => v.value);
	const set = new Set(fetchPrivateUserIds);
	const saverivateUserIds = [...set];
	const params = {
		name: name.value,
		description: description.value,
		bannerId: bannerId.value,
		pinnedNoteIds: pinnedNotes.value.map(x => x.id),
		color: color.value,
		searchable: searchable.value,
		isSensitive: isSensitive.value,
		isPrivate: isPrivate.value,
		privateUserIds: saverivateUserIds,
		allowRenoteToExternal: allowRenoteToExternal.value,
		isLocalOnly: isLocalOnly.value,
	};

	if (props.channelId) {
		params.channelId = props.channelId;
		await os.apiWithDialog('channels/update', params);
	} else {
		await os.apiWithDialog('channels/create', params).then(created => {
			router.push(`/channels/${created.id}`);
		});
	}
	fetchChannel();
}

async function archive() {
	const { canceled } = await os.confirm({
		type: 'warning',
		title: i18n.tsx.channelArchiveConfirmTitle({ name: name.value }),
		text: i18n.ts.channelArchiveConfirmDescription,
	});

	if (canceled) return;

	misskeyApi('channels/update', {
		channelId: props.channelId,
		isArchived: true,
	}).then(() => {
		os.success();
	});
}

function setBannerImage(evt) {
	selectFile(evt.currentTarget ?? evt.target, null).then(file => {
		bannerId.value = file.id;
	});
}

function removeBannerImage() {
	bannerId.value = null;
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: props.channelId ? i18n.ts._channel.edit : i18n.ts._channel.create,
	icon: 'ti ti-device-tv',
}));

</script>

<style lang="scss" module>
.pinnedNote {
	position: relative;
	display: block;
	line-height: 2.85rem;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
	color: var(--navFg);
}

.pinnedNoteRemove {
	position: absolute;
	z-index: 10000;
	width: 32px;
	height: 32px;
	color: #ff2a2a;
	right: 8px;
	opacity: 0.8;
}

.pinnedNoteHandle {
	cursor: move;
	width: 32px;
	height: 32px;
	margin: 0 8px;
	opacity: 0.5;
}
</style>
