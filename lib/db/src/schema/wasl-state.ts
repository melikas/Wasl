import { integer, jsonb, pgTable, timestamp } from "drizzle-orm/pg-core";

export const waslStateTable = pgTable("wasl_state", {
  id: integer("id").primaryKey().default(1),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});