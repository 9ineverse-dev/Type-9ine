import { Inject, Injectable } from '@nestjs/common';
import type {PRRepository,} from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { PREntityService } from '@/core/entities/PREntityService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.prRepository)
		private prRepository: PRRepository,

		private prEntityService: PREntityService,
	) {
		super(meta, paramDef, async (ps,me) => {
			const PRList = await this.prRepository.createQueryBuilder('pr')
			.andWhere(`pr.userId IN (:...userId)`, { userId: me.id })
			.innerJoinAndSelect('pr.note', 'note').getMany();

			return this.prEntityService.packMany(PRList,me);
		});
	}
}
