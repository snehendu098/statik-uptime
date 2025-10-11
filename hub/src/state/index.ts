import { WSContext } from "hono/ws";
import { getDbClient, type Env } from "../db/client";
import { validators } from "../db/schema";
import { IncomingMessage } from "../types";
import { eq } from "drizzle-orm";

export let AVAILABLE_VALIDATORS = new Map<
  WSContext<WebSocket>,
  { validatorId: string; pubKey: string }
>();
export let PUBKEY_TO_VALIDATORS = new Map<string, Set<WSContext<WebSocket>>>();

export const CALLBACKS: {
  [callbackId: string]: (data: IncomingMessage) => void;
} = {};

export const cleanUpValidator = (ws: WSContext<WebSocket>) => {
  const data = AVAILABLE_VALIDATORS.get(ws);

  if (!data) {
    console.log("⚠️ Attempted to clean up unknown validator");
    return;
  }

  console.log(`🔌 Validator disconnected: ${data.validatorId} (${data.pubKey.slice(0, 10)}...)`);

  AVAILABLE_VALIDATORS.delete(ws);

  const pubKeySet = PUBKEY_TO_VALIDATORS.get(data.pubKey);
  pubKeySet?.delete(ws);

  if (pubKeySet?.size === 0) {
    PUBKEY_TO_VALIDATORS.delete(data.pubKey);
  }

  // Log updated validator state
  console.log(`📊 Active validators after disconnect: ${AVAILABLE_VALIDATORS.size}`);

  if (AVAILABLE_VALIDATORS.size > 0) {
    console.log("📋 Remaining validators:");
    Array.from(AVAILABLE_VALIDATORS.values()).forEach((item) => {
      console.log(`  - ${item.validatorId.slice(0, 8)}... (${item.pubKey.slice(0, 10)}...)`);
    });
  } else {
    console.log("⚠️ No active validators remaining");
  }
};

export const addValidator = async (
  ws: WSContext<WebSocket>,
  data: { validatorId: string; pubKey: string; ip: string },
  env: Env,
) => {
  // 1. Add to primary map
  AVAILABLE_VALIDATORS.set(ws, data);

  // 2. Add to secondary map (get or create atomically)
  let pubKeySet = PUBKEY_TO_VALIDATORS.get(data.pubKey);

  if (!pubKeySet) {
    pubKeySet = new Set();
    PUBKEY_TO_VALIDATORS.set(data.pubKey, pubKeySet);
  }

  pubKeySet.add(ws);

  // 3. Save data to database
  const db = getDbClient(env);
  const existingValidator = await db
    .select()
    .from(validators)
    .where(eq(validators.pubKey, data.pubKey))
    .limit(1);

  if (existingValidator.length === 0) {
    await db.insert(validators).values({
      ip: data.ip,
      pubKey: data.pubKey,
      location: "",
      pendingPayouts: 0,
    });
    console.log(`📝 Saved new validator to database: ${data.pubKey.slice(0, 10)}...`);
  } else {
    console.log(`📝 Validator already exists in database: ${data.pubKey.slice(0, 10)}...`);
  }

  // 4. Log current validator state
  console.log(`📊 Active validators: ${AVAILABLE_VALIDATORS.size}`);
  console.log(`📊 Unique pubKeys: ${PUBKEY_TO_VALIDATORS.size}`);
};
