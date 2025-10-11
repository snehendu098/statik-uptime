import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import type { DurableObjectNamespace } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  VALIDATOR_REGISTRY: DurableObjectNamespace;
}

export const getDbClient = (env: Env) => {
  return drizzle(env.DB, { schema });
};

export type DbClient = ReturnType<typeof getDbClient>;
