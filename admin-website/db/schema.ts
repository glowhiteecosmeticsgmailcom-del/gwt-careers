import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const credentials=sqliteTable('credentials',{id:text('id').primaryKey(),salt:text('salt').notNull(),hash:text('hash').notNull()});
export const sessions=sqliteTable('sessions',{token:text('token').primaryKey(),userId:text('user_id').notNull(),expires:integer('expires').notNull()});
export const attempts=sqliteTable('attempts',{id:text('id').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull()});
