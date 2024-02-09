import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type {UsersRepository, NotesRepository, PRRepository, PR, ChannelFavoritesRepository, MiChannel } from '@/models/_.js';
import type {  MiUser } from '@/models/User.js';
import { bindThis } from '@/decorators.js';
import type { MiNote } from '@/models/Note.js';
import { IdService } from '@/core/IdService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { id } from '@/models/util/id.js';
import limit from '@/server/api/endpoints/invite/limit.js';


@Injectable()
export class PRService {
	constructor(

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.prRepository)
		private prRepository: PRRepository,

		@Inject(DI.channelFavoritesRepository)
		private channelFavoritesRepository: ChannelFavoritesRepository,

		private userEntityService: UserEntityService,
		private noteEntityService: NoteEntityService,

		private idService: IdService,
		private getterService: GetterService,
	) {
	}

	@bindThis
	public async create(note: MiNote, targetChannel?: MiChannel| null, limitDate?: Date |null, stock?: number| null,){
		this.notesRepository.createQueryBuilder().update()
			.set({
				isPR: true
			})
			.where('id = :id', { id: note.id })
			.execute();
		const record: PR = {
			id: this.idService.gen(),
			noteId: note.id,
			userId: note.userId,
			createdAt: new Date(),
			targetChannelId: targetChannel?.id ?? null,
			limit: limitDate,
			state: 'screening',
			impressions: 0,
			stock: stock ?? 0,
		};
		await this.prRepository.insert(record);
	}

	@bindThis
	public async getPRNote(user: MiUser){
		const favoriteChannels = await this.channelFavoritesRepository.createQueryBuilder('favorite')
		.andWhere('favorite.userId = :meId', { meId: user.id })
			.andWhere(new Brackets(qb => { qb
				.where('channel.isPrivate = FALSE')
				.orWhere(new Brackets(qb2 => { qb2
					.where('channel.isPrivate = TRUE')
					.andWhere(new Brackets(qb3 => { qb3
						.where(':id = ANY(channel.privateUserIds)', { id: user?.id })
						.orWhere('channel.userId = :id', { id: user?.id });
					}));
				}));
			}))
			.leftJoinAndSelect('favorite.channel', 'channel')
			.getMany();
		const channelIds = [...favoriteChannels.map(c => c.channelId)];

		const PRList = await this.prRepository.createQueryBuilder('pr')
		.select('pr.noteid')
		.andWhere(`pr.state = 'active'`)
		.andWhere(new Brackets(qb4 => { qb4
			.where('pr.targetChannelId IS NULL')
			.orWhere(`pr.targetChannelId IN (:...channelIds)`, { channelIds: channelIds })
		}))
		.andWhere(new Brackets(qb5 => { qb5
			.where('pr.startsAt IS NULL')
			.orWhere(`pr.startsAt > :date`, { date: Date.now() })
		})).getMany();
		if(PRList == null) return;
		const noteIds = [...PRList.map(n => n.noteId)];
		const prnoteId = noteIds[Math.floor(Math.random()*noteIds.length)];

		try{
			const notePR = noteIds.find(({ noteId }) => noteId == prnoteId);
			const note = await this.getterService.getNote(prnoteId);
			if((notePR.impressions >= (notePR.stock + 1)) || ((notePR.limit >= Date.now()) && (notePR.limit !== null))){
				await this.prRepository.createQueryBuilder().update().set(
					{
						impressions: () => '"impressions" + 1',
						state: 'finished'
					})
					.where("noteId = :id", { id: prnoteId }).execute();
			} else {
				await this.prRepository.createQueryBuilder().update().set(
					{
						impressions: () => '"impressions" + 1',
						isActive: true,
					})
					.where("noteId = :id", { id: prnoteId }).execute();
			}

			return note;

		}
		catch(e) { return null;}
	}

	@bindThis
	public async updatePR(prnoteId: MiNote['id'],state?: string| null,targetChannel?: MiChannel| null, limitDate?: Date |null,  stock?: number| null){
		const target = await this.prRepository.findOneBy({ noteId: prnoteId });
		await this.prRepository.createQueryBuilder().update().set(
			{
				targetChannelId: targetChannel?.id ?? target.targetChannelId,
				limit: limitDate ?? target.limit,
				state: state ?? 'cancel',
				stock: stock ?? target.stock,
			})
			.where("noteId = :id", { id: target.noteId }).execute();
	}
}
