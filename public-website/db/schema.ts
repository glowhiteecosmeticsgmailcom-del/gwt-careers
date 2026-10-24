import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const jobs = sqliteTable('jobs', { id: text('id').primaryKey(), data: text('data').notNull(), status: text('status').notNull(), updatedAt: text('updated_at').notNull() });
export const settings = sqliteTable('settings', { id: text('id').primaryKey(), data: text('data').notNull() });
