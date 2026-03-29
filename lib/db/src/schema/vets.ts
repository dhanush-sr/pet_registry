import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vetsTable = pgTable("vets", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  clinic: text("clinic"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVetSchema = createInsertSchema(vetsTable).omit({ id: true, createdAt: true });

export type Vet = typeof vetsTable.$inferSelect;
export type InsertVet = z.infer<typeof insertVetSchema>;
