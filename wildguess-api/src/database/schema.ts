import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at').notNull(),
});

export const sessions = sqliteTable('sessions', {
    token: text('token').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id),
    expiresAt: integer('expires_at').notNull(),
});

export const rooms = sqliteTable('rooms', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    hostId: text('host_id')
        .notNull()
        .references(() => users.id),
    phase: text('phase').notNull().default('voting'),
    currentTopic: text('current_topic'),
    round: integer('round').notNull().default(1),
    createdAt: integer('created_at').notNull(),
});

export const roomMembers = sqliteTable(
    'room_members',
    {
        roomId: text('room_id')
            .notNull()
            .references(() => rooms.id),
        userId: text('user_id')
            .notNull()
            .references(() => users.id),
        joinedAt: integer('joined_at').notNull(),
    },
    (table) => [primaryKey({ columns: [table.roomId, table.userId] })],
);

export const votes = sqliteTable('votes', {
    id: text('id').primaryKey(),
    roomId: text('room_id')
        .notNull()
        .references(() => rooms.id),
    userId: text('user_id')
        .notNull()
        .references(() => users.id),
    round: integer('round').notNull(),
    value: text('value'),
    createdAt: integer('created_at').notNull(),
});
