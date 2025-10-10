import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { v7 } from "uuid";

// User table
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => v7().toString()),
  pubKey: text("pub_key").notNull().unique(),
  credits: integer("credits"),
});

// Website table
export const websites = sqliteTable("websites", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => v7().toString()),
  url: text("url").notNull(),
  userId: text("user_id").notNull(),
  disabled: integer("disabled", { mode: "boolean" }).notNull().default(false),
  checkIntervalMinutes: integer("check_interval_minutes").notNull().default(5),
  checkIntervals: integer("check_intervals", { mode: "timestamp" }).notNull(),
});

// Validator table
export const validators = sqliteTable("validators", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => v7().toString()),
  pubKey: text("pub_key").notNull(),
  location: text("location").notNull(),
  pendingPayouts: integer("pending_payouts").notNull().default(0),
  ip: text("ip").notNull(),
});

// WebsiteTick table
export const websiteTicks = sqliteTable("website_ticks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => v7().toString()),
  websiteId: text("website_id").notNull(),
  validatorId: text("validator_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  status: text("status", { enum: ["Good", "Bad"] }).notNull(),
  latency: real("latency").notNull(),
});

// Relations
export const websitesRelations = relations(websites, ({ many }) => ({
  ticks: many(websiteTicks),
}));

export const validatorsRelations = relations(validators, ({ many }) => ({
  ticks: many(websiteTicks),
}));

export const websiteTicksRelations = relations(websiteTicks, ({ one }) => ({
  website: one(websites, {
    fields: [websiteTicks.websiteId],
    references: [websites.id],
  }),
  validator: one(validators, {
    fields: [websiteTicks.validatorId],
    references: [validators.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Website = typeof websites.$inferSelect;
export type NewWebsite = typeof websites.$inferInsert;

export type Validator = typeof validators.$inferSelect;
export type NewValidator = typeof validators.$inferInsert;

export type WebsiteTick = typeof websiteTicks.$inferSelect;
export type NewWebsiteTick = typeof websiteTicks.$inferInsert;

export type WebsiteStatus = "Good" | "Bad";
