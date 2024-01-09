/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { PRRepository} from '@/models/_.js';
import type { PR } from '@/models/PR.js';
import type { Packed } from '@/misc/json-schema.js';
import type { MiUser } from '@/models/User.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class PREntityService {
	constructor(
		@Inject(DI.notesRepository)
		private prRepository: PRRepository,

	) {
	}

	@bindThis
	public async pack(
		src: PR['id'] | PR,
		me?: { id: MiUser['id'] } | null | undefined,

	): Promise<Packed<'Pr'>> {
		const opts = Object.assign({
			detail: false,
			includeSecret: false,
			includeProfileImageIds: false,
		});

		const pr = typeof src === 'object' ? src : await this.prRepository.findOneByOrFail({ id: src });

		return {
			id: pr.id,
			noteId: pr.noteId,
			note: pr.note,
			userId: pr.userId,
			createdAt: pr.createdAt.toISOString(),
			targetChannelId: pr.targetChannelId,
			startsAt: pr.startsAt.toISOString() ?? null,
			limit: pr.limit.toISOString() ?? null,
			isActive: pr.isActive,
			isFinish: pr.isFinish,
			impressions: pr.impressions,
			stock: pr.stock,
		};
	}

	public packMany(
		clips: PR[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		return Promise.all(clips.map(x => this.pack(x, me)));
	}
}
