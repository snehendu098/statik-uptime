import { randomUUIDv7 } from "bun";
import type { OutgoingMessage, SignupOutgoingMessage } from "./types";
import { privateKeyToAccount } from "viem/accounts";
import { privateKey } from "./account";

const CALLBACKS: {
  [callbackId: string]: (data: SignupOutgoingMessage) => void;
} = {};

let validatorId: string = "";
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000; // 30 seconds max

console.log(privateKey);

const account = privateKeyToAccount(privateKey);

async function connect() {
  const ws = new WebSocket("wss://hub.silonelabs.workers.dev/ws");
  // const ws = new WebSocket("ws://localhost:8787/ws");

  ws.onopen = async () => {
    console.log("🔗 Connected to hub server");
    console.log(`🔑 Validator address: ${account.address}`);
    reconnectAttempts = 0; // Reset reconnect counter on successful connection

    const callbackId = randomUUIDv7().toString();
    CALLBACKS[callbackId] = (data: any) => {
      validatorId = data.validatorId;
      console.log(`✅ Registered as validator with ID: ${validatorId}`);
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

    console.log("📤 Signup request sent to hub");
  };

  ws.onmessage = async (event) => {
    const data: OutgoingMessage = JSON.parse(event.data);

    // Handle ping messages from server to keep connection alive
    if (data.type === "ping") {
      ws.send(JSON.stringify({ type: "pong" }));
      return;
    }

    if (data.type === "signup") {
      console.log("📥 Signup confirmation received from hub");
      CALLBACKS[data.data.callbackId]?.(data.data);
      delete CALLBACKS[data.data.callbackId];
    } else if (data.type === "validate") {
      const { callbackId, url, websiteId } = data.data;

      console.log(`\n🔍 Validation request received`);
      console.log(`  URL: ${url}`);
      console.log(`  Website ID: ${websiteId}`);

      const signedMessage = await account.signMessage({
        message: `Replying to ${callbackId}`,
      });

      const startTime = Date.now();
      try {
        const res = await fetch(url);
        const latency = Date.now() - startTime;
        const status = res.status;
        const result = status === 200 ? "Good" : "Bad";

        console.log(`  ✅ Status: ${status} (${result})`);
        console.log(`  ⏱️  Latency: ${latency}ms`);

        ws.send(
          JSON.stringify({
            type: "validate",
            data: {
              callbackId,
              status: result,
              latency,
              websiteId,
              validatorId,
              signedMessage,
            },
          }),
        );
      } catch (error) {
        const latency = Date.now() - startTime;
        console.log(`  ❌ Failed to validate (error)`);
        console.error(`  Error: ${error}`);
        console.log(`  ⏱️  Latency: ${latency}ms`);

        ws.send(
          JSON.stringify({
            type: "validate",
            data: {
              callbackId,
              status: "Bad",
              latency,
              websiteId,
              validatorId,
              signedMessage,
            },
          }),
        );
      }
    }
  };

  ws.onclose = () => {
    console.log("🔌 Disconnected from hub server");
    reconnect();
  };

  ws.onerror = (error) => {
    console.error("❌ WebSocket error:", error);
  };
}

function reconnect() {
  reconnectAttempts++;
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), MAX_RECONNECT_DELAY);

  console.log(`🔄 Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts})...`);

  setTimeout(() => {
    connect();
  }, delay);
}

// Start the connection
connect();
