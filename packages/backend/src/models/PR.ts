import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne, } from 'typeorm';
import { prState } from '@/types.js';
import { id } from './util/id.js';
import { MiNote } from './Note.js';
import { MiUser } from './User.js';
import { MiChannel } from './Channel.js';

@Entity('user_note_pining')
@Index(['userId','targetChannelId', 'noteId'], { unique: true })
export class PR {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user?: MiUser | null;

	@Index()
	@Column(id())
	public targetChannelId: MiChannel['id'] | null;

	@Index()
	@Column(id())
	public noteId: MiNote['id'];

	@ManyToOne(type => MiNote, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public note?: MiNote | null;

	@Column('enum', { enum: prState })
	public state: typeof prState[number];

	@Column('timestamp with time zone', {
		default: () => 'now()',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		default: () => 'now()',
	})
	public startsAt?: Date | null;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public limit?: Date | null;

	@Column('integer', {
		default: 0,
	})
	public impressions: number;

	@Column('integer', {
		default: 0,
	})
	public stock: number;
	constructor(data: Partial<PR>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
