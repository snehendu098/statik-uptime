import { WSContext } from "hono/ws";

export let AVAILABLE_VALIDATORS = new Map<
  WSContext<WebSocket>,
  { validatorId: string; pubKey: string }
>();
export let PUBKEY_TO_VALIDATORS = new Map<string, Set<WSContext<WebSocket>>>();

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

export const addValidator = (
  ws: WSContext<WebSocket>,
  data: { validatorId: string; pubKey: string },
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
};
