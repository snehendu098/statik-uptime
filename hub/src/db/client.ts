import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export interface Env {
  DB: D1Database;
}

export const getDbClient = (env: Env) => {
  return drizzle(env.DB, { schema });
};

export type DbClient = ReturnType<typeof getDbClient>;
