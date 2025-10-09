import { randomUUIDv7 } from "bun";
import type { OutgoingMessage, SignupOutgoingMessage } from "./types";
import { privateKeyToAccount } from "viem/accounts";
import { privateKey } from "./account";

const CALLBACKS: {
  [callbackId: string]: (data: SignupOutgoingMessage) => void;
} = {};

let validatorId: string = "";

console.log(privateKey);

const account = privateKeyToAccount(privateKey);

async function main() {
  const ws = new WebSocket("ws://localhost:8787/ws");

  ws.onopen = async () => {
    const callbackId = randomUUIDv7().toString();
    CALLBACKS[callbackId] = (data: any) => {
      validatorId = data.validatorId;
    };

    const signedMessage = await account.signMessage({
      message: `Signing up as validator with account ${account.address}`,
    });

    ws.send(
      JSON.stringify({
        type: "signup",
        data: {
          callbackId,
          ip: "127.0.0.1",
          publicKey: account.address,
          signedMessage,
        },
      }),
    );

    console.log("Signup data sent from validator");
  };

  ws.onmessage = async (event) => {
    const data: OutgoingMessage = JSON.parse(event.data);

    if (data.type === "signup") {
      console.log("Signup data recieved");
      CALLBACKS[data.data.callbackId]?.(data.data);
      console.log("Validator set", validatorId);
      delete CALLBACKS[data.data.callbackId];
    } else if (data.type === "validate") {
      const { callbackId, url, websiteId } = data.data;

      console.log(`Validating ${data.data.url}`);
      const signedMessage = await account.signMessage({
        message: `Replying to ${callbackId}`,
      });

      const startTime = Date.now();
      try {
        const res = await fetch(url);
        const latency = startTime - Date.now();
        const status = res.status;

        console.log(url);
        console.log(status);

        ws.send(
          JSON.stringify({
            type: "validate",
            data: {
              callbackId,
              status: status === 200 ? "Good" : "Bad",
              latency,
              websiteId,
              validatorId,
              signedMessage,
            },
          }),
        );
      } catch (error) {
        ws.send(
          JSON.stringify({
            type: "validate",
            data: {
              callbackId,
              status: "Bad",
              latency: 1000,
              websiteId,
              validatorId,
              signedMessage,
            },
          }),
        );

        console.error(error);
      }
    }
  };
}

main();
