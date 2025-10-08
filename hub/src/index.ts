import { Hono } from "hono";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import { IncomingMessage } from "./types";
import { signUpHandler } from "./helpers";
import { AVAILABLE_VALIDATORS, cleanUpValidator } from "./state";
import { verify } from "./helpers/crypto";

const app = new Hono();

app.get(
  "/ws",
  upgradeWebSocket(() => {
    return {
      onMessage(event, ws) {
        const data: IncomingMessage = JSON.parse(event.data.toString());

        if (data.type === "signup") {
          console.log("Signup request recieved from", data.data.ip);

          verify(data.data.signedMessage, data.data.publicKey)
            .then((verified) => {
              console.log(`Verified ${data.data.publicKey} with ${verified}`);

              if (verified) {
                signUpHandler(ws, data.data);
                console.log(`Validators: ${AVAILABLE_VALIDATORS.size}`);
              }
            })
            .catch((error) => {
              console.error("Verification error:", error);
            });
        }
      },

      onClose(_close, ws) {
        cleanUpValidator(ws);
      },
    };
  }),
);

export default app;
