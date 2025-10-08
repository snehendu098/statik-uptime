import { WSContext } from "hono/ws";
import { SignupIncomingMessage } from "../types";
import { v7 } from "uuid";
import { addValidator } from "../state";

export const signUpHandler = (
  ws: WSContext<WebSocket>,
  data: SignupIncomingMessage,
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

  // Add validator to both maps
  addValidator(ws, { validatorId: id, pubKey: data.publicKey });
};
