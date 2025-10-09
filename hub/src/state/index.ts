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
  console.log(`Disconnected ${data?.validatorId}`);
  AVAILABLE_VALIDATORS.delete(ws);

  if (data) {
    const pubKeySet = PUBKEY_TO_VALIDATORS.get(data.pubKey);
    pubKeySet?.delete(ws);

    if (pubKeySet?.size === 0) {
      PUBKEY_TO_VALIDATORS.delete(data.pubKey);
    }
  }

  // Log available validators
  console.log(
    Array.from(
      AVAILABLE_VALIDATORS.values().map((item) => {
        return { id: item.validatorId, pk: item.pubKey };
      }),
    ),
  );
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
  }
};
