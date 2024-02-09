import state from "@/server/api/endpoints/notes/state.js";

export const packedPRSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		userId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		targetChannelId: {
			type: 'string',
			optional: true, nullable: true,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		note: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
		noteId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		state: {
			type: 'string',
			optional: false, nullable: false,
		},
		createdAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		startsAt: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
		limit: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
		impressions: {
			type: 'number',
			optional: false, nullable: false,
		},
		stock: {
			type: 'number',
			optional: false, nullable: false,
		},
	},
} as const;
