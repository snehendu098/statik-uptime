import { WSContext } from "hono/ws";
import { SignupIncomingMessage } from "../types";
import { v7 } from "uuid";
import { addValidator, AVAILABLE_VALIDATORS } from "../state";
import { type Env } from "../db/client";

export const signUpHandler = async (
  ws: WSContext<WebSocket>,
  data: SignupIncomingMessage,
  env: Env,
) => {
  const id = v7().toString();

  ws.send(
    JSON.stringify({
      type: "signup",
      data: {
        validatorId: id,
        callbackId: data.callbackId,
      },
    }),
  );

  // Add validator to both maps and save them
  await addValidator(
    ws,
    {
      validatorId: id,
      pubKey: data.publicKey,
      ip: data.ip,
    },
    env,
  );

  return AVAILABLE_VALIDATORS.size;
};
