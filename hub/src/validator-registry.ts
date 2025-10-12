import { DurableObject } from "cloudflare:workers";
import { v7 } from "uuid";
import { getDbClient, type Env as AppEnv } from "./db/client";
import { validators, users, websiteTicks } from "./db/schema";
import { eq } from "drizzle-orm";
import { verifyMessage } from "viem";

/**
 * Durable Object that maintains persistent validator WebSocket connections
 * This ensures validators are accessible across all isolates (WebSocket handlers and cron jobs)
 */
export class ValidatorRegistry extends DurableObject<AppEnv> {
  // Store active validator WebSocket connections
  private validators: Map<
    WebSocket,
    { validatorId: string; pubKey: string; ip: string }
  >;
  private pubKeyToValidators: Map<string, Set<WebSocket>>;

  constructor(ctx: DurableObjectState, env: AppEnv) {
    super(ctx, env as any);
    this.validators = new Map();
    this.pubKeyToValidators = new Map();
  }

  /**
   * Handle incoming HTTP requests
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade for validators
    if (url.pathname === "/ws") {
      const upgradeHeader = request.headers.get("Upgrade");
      if (upgradeHeader !== "websocket") {
        return new Response("Expected WebSocket", { status: 400 });
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      // Accept WebSocket WITHOUT tags for now - tags will be added during signup
      this.ctx.acceptWebSocket(server);
      console.log(
        "[WS] New WebSocket connection accepted - awaiting validator signup",
      );

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // API endpoint to get active validators (for cron)
    if (url.pathname === "/validators") {
      const allWebSockets = this.ctx.getWebSockets();
      console.log(`[INFO] /validators endpoint called`);
      console.log(
        `[INFO] WebSockets from getWebSockets(): ${allWebSockets.length}`,
      );
      console.log(`[INFO] Validators in memory map: ${this.validators.size}`);

      // If memory map is empty after hibernation, we need validators to re-identify
      if (this.validators.size === 0 && allWebSockets.length > 0) {
        console.log(
          `[WARNING] Memory cleared after hibernation. Sending ping to trigger re-identification`,
        );

        // Send ping to all WebSockets to trigger validators to respond with their ID
        for (const ws of allWebSockets) {
          try {
            ws.send(JSON.stringify({ type: "ping" }));
          } catch (error) {
            console.error(`[ERROR] Failed to send ping:`, error);
          }
        }

        // For now, return empty list. Validators will re-identify on next cron cycle
        console.log(
          `[INFO] Returning empty list. Validators will re-identify on next message`,
        );
        return Response.json({
          success: true,
          count: 0,
          validators: [],
        });
      }

      // Get validator list from the in-memory map
      // Only return validators we have in memory (with active connections)
      const validatorList = Array.from(this.validators.values()).map((v) => ({
        validatorId: v.validatorId,
        pubKey: v.pubKey,
        ip: v.ip,
      }));

      console.log(`[SUCCESS] Returning ${validatorList.length} active validators`);
      if (validatorList.length > 0) {
        console.log(
          `[INFO] Validator list:`,
          validatorList.map((v) => ({
            validatorId: v.validatorId,
            pubKey: v.pubKey.slice(0, 10) + "...",
          })),
        );
      }

      return Response.json({
        success: true,
        count: validatorList.length,
        validators: validatorList,
      });
    }

    // API endpoint to store callback context and send validation request
    if (url.pathname === "/validate" && request.method === "POST") {
      const body = (await request.json()) as {
        validatorId: string;
        callbackId: string;
        url: string;
        websiteId: string;
        callbackContext: {
          websiteId: string;
          website: {
            url: string;
            userId: string;
            checkIntervalMinutes: number;
          };
          validatorId: string;
          validatorPubKey: string;
        };
      };

      // Store callback context for later retrieval when validator responds
      await this.ctx.storage.put(`callback:${body.callbackId}`, {
        ...body.callbackContext,
        timestamp: Date.now(),
      });

      console.log(`[INFO] Stored callback context for ${body.callbackId}`);

      // Find the validator WebSocket
      let targetWs: WebSocket | null = null;

      // Try to find in memory map
      for (const [ws, data] of this.validators.entries()) {
        if (data.validatorId === body.validatorId) {
          targetWs = ws;
          break;
        }
      }

      if (!targetWs) {
        console.log(`[ERROR] Validator ${body.validatorId} not found`);
        // Clean up callback since we can't send the request
        await this.ctx.storage.delete(`callback:${body.callbackId}`);
        return Response.json(
          {
            success: false,
            error: "Validator not found or disconnected",
          },
          { status: 404 },
        );
      }

      // Send validation request to validator
      try {
        targetWs.send(
          JSON.stringify({
            type: "validate",
            data: {
              url: body.url,
              callbackId: body.callbackId,
              websiteId: body.websiteId,
            },
          }),
        );

        return Response.json({ success: true });
      } catch (error) {
        console.error("Error sending validation request:", error);
        // Clean up callback since request failed
        await this.ctx.storage.delete(`callback:${body.callbackId}`);
        return Response.json(
          {
            success: false,
            error: "Failed to send validation request",
          },
          { status: 500 },
        );
      }
    }

    return new Response("Not found", { status: 404 });
  }

  /**
   * Handle WebSocket messages
   */
  async webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer,
  ): Promise<void> {
    if (typeof message !== "string") return;

    const data = JSON.parse(message);

    // Handle signup
    if (data.type === "signup") {
      console.log("[INFO] Validator signup request received:", data.data.publicKey);

      // Get signup data
      const { publicKey, ip, callbackId, signedMessage } = data.data;

      // Verify the signature
      const expectedMessage = `Signing up as validator with account ${publicKey}`;
      try {
        const isValid = await verifyMessage({
          address: publicKey as `0x${string}`,
          message: expectedMessage,
          signature: signedMessage as `0x${string}`,
        });

        if (!isValid) {
          console.error("[ERROR] Invalid signature for signup");
          ws.send(
            JSON.stringify({
              type: "error",
              data: {
                callbackId,
                message: "Invalid signature",
              },
            }),
          );
          return;
        }
        console.log("[SUCCESS] Signature verified for signup");
      } catch (error) {
        console.error("[ERROR] Signature verification failed:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            data: {
              callbackId,
              message: "Signature verification failed",
            },
          }),
        );
        return;
      }

      // Generate validator ID
      const validatorId = v7().toString();

      // Store validator in memory
      this.validators.set(ws, {
        validatorId,
        pubKey: publicKey,
        ip,
      });

      // Store in secondary map
      let pubKeySet = this.pubKeyToValidators.get(publicKey);
      if (!pubKeySet) {
        pubKeySet = new Set();
        this.pubKeyToValidators.set(publicKey, pubKeySet);
      }
      pubKeySet.add(ws);

      // CRITICAL: Persist validator data to Durable Object storage
      // This survives hibernation when the in-memory map is cleared
      await this.ctx.storage.put(`validator:${validatorId}`, {
        validatorId,
        pubKey: publicKey,
        ip,
      });

      // Save to database
      const db = getDbClient(this.env as any);
      const existingValidator = await db
        .select()
        .from(validators)
        .where(eq(validators.pubKey, publicKey))
        .limit(1);

      if (existingValidator.length === 0) {
        await db.insert(validators).values({
          ip,
          pubKey: publicKey,
          location: "",
          pendingPayouts: 0,
        });
        console.log(
          `[SUCCESS] Saved new validator to database: ${publicKey.slice(0, 10)}...`,
        );
      } else {
        console.log(
          `[INFO] Validator already in database: ${publicKey.slice(0, 10)}...`,
        );
      }

      // Send confirmation back to validator
      ws.send(
        JSON.stringify({
          type: "signup",
          data: {
            validatorId,
            callbackId,
          },
        }),
      );

      console.log(
        `[SUCCESS] Validator registered! Total active: ${this.validators.size}`,
      );
      console.log(
        `[INFO] Current validators in map:`,
        Array.from(this.validators.values()).map((v) => ({
          validatorId: v.validatorId,
          pubKey: v.pubKey.slice(0, 10) + "...",
          ip: v.ip,
        })),
      );

      // Set up heartbeat alarm if this is the first validator
      if (this.validators.size === 1) {
        const currentAlarm = await this.ctx.storage.getAlarm();
        if (!currentAlarm) {
          await this.ctx.storage.setAlarm(Date.now() + 30000);
          console.log("[INFO] Heartbeat alarm initialized (30s interval)");
        }
      }
    }

    // Handle validation response
    else if (data.type === "validate") {
      console.log("[INFO] Validation response received:", data.data.callbackId);

      const { callbackId, validatorId, signedMessage, status, latency } =
        data.data;

      // Retrieve callback context
      const callbackContext = (await this.ctx.storage.get(
        `callback:${callbackId}`,
      )) as
        | {
            websiteId: string;
            website: {
              url: string;
              userId: string;
              checkIntervalMinutes: number;
            };
            validatorId: string;
            validatorPubKey: string;
            timestamp: number;
          }
        | undefined;

      if (!callbackContext) {
        console.error(`[ERROR] No callback context found for ${callbackId}`);
        return;
      }

      console.log(
        `[SUCCESS] Retrieved callback context for website ${callbackContext.websiteId}`,
      );

      // Get the validator's public key from the stored data
      let validatorData = this.validators.get(ws);

      // CRITICAL: After hibernation, memory map is empty - get from storage
      if (!validatorData) {
        console.log(
          "[WARNING] Validator not in memory map (hibernation) - fetching from storage",
        );
        const storedData = (await this.ctx.storage.get(
          `validator:${validatorId}`,
        )) as { validatorId: string; pubKey: string; ip: string } | undefined;

        if (!storedData) {
          console.error("[ERROR] Validator not found in storage either");
          await this.ctx.storage.delete(`callback:${callbackId}`);
          return;
        }

        validatorData = storedData;
        console.log(
          `[SUCCESS] Retrieved validator from storage: ${validatorData.pubKey.slice(0, 10)}...`,
        );

        // Rebuild memory map
        this.validators.set(ws, validatorData);
      }

      // Verify that the validatorId matches
      if (validatorData.validatorId !== validatorId) {
        console.error("[ERROR] Validator ID mismatch");
        await this.ctx.storage.delete(`callback:${callbackId}`);
        return;
      }

      // Verify the signature
      const expectedMessage = `Replying to ${callbackId}`;
      try {
        const isValid = await verifyMessage({
          address: validatorData.pubKey as `0x${string}`,
          message: expectedMessage,
          signature: signedMessage as `0x${string}`,
        });

        if (!isValid) {
          console.error("[ERROR] Invalid signature for validation response");
          await this.ctx.storage.delete(`callback:${callbackId}`);
          return;
        }
        console.log("[SUCCESS] Signature verified for validation response");
      } catch (error) {
        console.error(
          "[ERROR] Signature verification failed for validation:",
          error,
        );
        await this.ctx.storage.delete(`callback:${callbackId}`);
        return;
      }

      // Process validation response and save to database immediately
      try {
        const db = getDbClient(this.env as any);

        // Get validator from database using pubKey
        const validatorDb = await db
          .select()
          .from(validators)
          .where(eq(validators.pubKey, validatorData.pubKey))
          .limit(1);

        if (validatorDb.length === 0) {
          console.error(
            `[ERROR] Validator not found in database for pubKey ${validatorData.pubKey}`,
          );
          await this.ctx.storage.delete(`callback:${callbackId}`);
          return;
        }

        const validator = validatorDb[0];

        // Get user from database
        const userDb = await db
          .select()
          .from(users)
          .where(eq(users.id, callbackContext.website.userId))
          .limit(1);

        const user = userDb[0];
        if (!user) {
          console.error(`[ERROR] User not found: ${callbackContext.website.userId}`);
          await this.ctx.storage.delete(`callback:${callbackId}`);
          return;
        }

        const creditCost = 10; // Cost per validation
        const currentCredits = user.credits || 0;
        const newCredits = currentCredits - creditCost;

        if (newCredits < 0) {
          console.warn(
            `[WARNING] User ${user.id} has insufficient credits (${currentCredits}). Allowing negative balance.`,
          );
        }

        // Save to database: tick, update validator payout, deduct user credits
        await db.batch([
          db.insert(websiteTicks).values({
            websiteId: callbackContext.websiteId,
            validatorId: validator.id,
            status,
            latency,
            createdAt: new Date(),
          }),
          db
            .update(validators)
            .set({
              pendingPayouts: validator.pendingPayouts + 100,
            })
            .where(eq(validators.id, validator.id)),
          db
            .update(users)
            .set({
              credits: newCredits,
            })
            .where(eq(users.id, user.id)),
        ]);

        console.log(
          `[SUCCESS] Saved validation for website ${callbackContext.websiteId} by validator ${validator.id}: ${status} (${latency}ms). Credits: ${currentCredits} → ${newCredits}`,
        );

        // Clean up callback context
        await this.ctx.storage.delete(`callback:${callbackId}`);
      } catch (error) {
        console.error(`[ERROR] Error processing validation response:`, error);
        // Keep callback for potential retry (will be cleaned up by alarm after 5 minutes)
      }
    }

    // Handle pong
    else if (data.type === "pong") {
      // Keep-alive acknowledged and re-identification after hibernation
      let validatorData = this.validators.get(ws);

      // If not in memory (after hibernation), rebuild from storage
      if (!validatorData && data.data?.validatorId) {
        const validatorId = data.data.validatorId;
        console.log(
          `[INFO] Pong from unknown validator - rebuilding from storage: ${validatorId}`,
        );

        const storedData = (await this.ctx.storage.get(
          `validator:${validatorId}`,
        )) as { validatorId: string; pubKey: string; ip: string } | undefined;

        if (storedData) {
          this.validators.set(ws, storedData);
          validatorData = storedData;
          console.log(
            `[SUCCESS] Rebuilt validator ${validatorId} in memory from pong`,
          );
        } else {
          console.log(
            `[WARNING] Validator ${validatorId} not found in storage - may have been removed`,
          );
        }
      }

      if (validatorData) {
        console.log(
          `[INFO] Pong received from validator ${validatorData.validatorId}`,
        );
      }
    }
  }

  /**
   * Handle WebSocket close
   */
  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ): Promise<void> {
    const validatorData = this.validators.get(ws);

    console.log(
      `[WS] WebSocket closing - code: ${code}, reason: "${reason}", wasClean: ${wasClean}`,
    );

    if (validatorData) {
      console.log(
        `[WS] Validator disconnected: ${validatorData.validatorId} (${validatorData.pubKey.slice(0, 10)}...)`,
      );

      // Remove from primary map
      this.validators.delete(ws);

      // Remove from secondary map
      const pubKeySet = this.pubKeyToValidators.get(validatorData.pubKey);
      if (pubKeySet) {
        pubKeySet.delete(ws);
        if (pubKeySet.size === 0) {
          this.pubKeyToValidators.delete(validatorData.pubKey);
        }
      }

      // CRITICAL: Remove from persistent storage
      await this.ctx.storage.delete(`validator:${validatorData.validatorId}`);

      console.log(`[INFO] Active validators remaining: ${this.validators.size}`);
    } else {
      console.log(`[WARNING] WebSocket closed but no validator data found in memory`);
      // After hibernation, we might not have the validator in memory
      // We'll rely on the alarm cleanup to remove orphaned storage entries

      const allWebSockets = this.ctx.getWebSockets();
      console.log(`[INFO] Active WebSockets remaining: ${allWebSockets.length}`);
    }
  }

  /**
   * Handle WebSocket error
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("[ERROR] WebSocket error:", error);
    await this.webSocketClose(ws, 1006, "Error occurred", false);
  }

  /**
   * Alarm handler to:
   * 1. Send ping to all validators (keep-alive)
   * 2. Clean up old validation results
   */
  async alarm(): Promise<void> {
    console.log("[INFO] Alarm triggered - sending pings and cleaning up");

    // 1. Send pings to all validators to keep connections alive
    // Use getWebSockets() which works even after hibernation
    const allWebSockets = this.ctx.getWebSockets();
    console.log(
      `[INFO] Sending heartbeat pings to ${allWebSockets.length} WebSockets`,
    );
    console.log(`[INFO] Memory map has: ${this.validators.size} validators`);

    for (const ws of allWebSockets) {
      try {
        ws.send(JSON.stringify({ type: "ping" }));
      } catch (error) {
        console.error(`[ERROR] Failed to send ping to WebSocket:`, error);
      }
    }

    // 1.5. Clean up orphaned validator entries (when storage > active WebSockets)
    const validatorEntries = await this.ctx.storage.list({
      prefix: "validator:",
    });
    if (validatorEntries.size > allWebSockets.length) {
      console.log(
        `[INFO] Orphaned validators detected: ${validatorEntries.size} in storage vs ${allWebSockets.length} active WebSockets`,
      );

      // Remove excess entries (orphaned ones)
      const entriesToRemove = validatorEntries.size - allWebSockets.length;
      let removedCount = 0;

      for (const [key, value] of validatorEntries.entries()) {
        if (removedCount >= entriesToRemove) break;

        const validatorData = value as {
          validatorId: string;
          pubKey: string;
          ip: string;
        };
        await this.ctx.storage.delete(key);
        removedCount++;
        console.log(
          `[INFO] Removed orphaned validator: ${validatorData.validatorId.slice(0, 8)}...`,
        );
      }

      console.log(`[SUCCESS] Cleaned up ${removedCount} orphaned validator entries`);
    }

    // 2. Clean up old validation results (older than 2 minutes) - legacy, should be empty now
    const validationKeys = await this.ctx.storage.list({
      prefix: "validation:",
    });
    let validationCleanupCount = 0;
    const twoMinutesAgo = Date.now() - 120000; // 2 minutes in milliseconds

    for (const [key, value] of validationKeys.entries()) {
      const validationData = value as { timestamp?: number };

      // Only delete if timestamp exists and is older than 2 minutes
      if (
        validationData.timestamp &&
        validationData.timestamp < twoMinutesAgo
      ) {
        await this.ctx.storage.delete(key);
        validationCleanupCount++;
      }
    }
    if (validationCleanupCount > 0) {
      console.log(
        `[INFO] Cleaned up ${validationCleanupCount} old validation results (>2 minutes)`,
      );
    }

    // 3. Clean up old callback contexts (older than 5 minutes)
    const callbackKeys = await this.ctx.storage.list({ prefix: "callback:" });
    let callbackCleanupCount = 0;
    const fiveMinutesAgo = Date.now() - 300000; // 5 minutes in milliseconds

    for (const [key, value] of callbackKeys.entries()) {
      const callbackData = value as { timestamp?: number };

      // Only delete if timestamp exists and is older than 5 minutes
      if (callbackData.timestamp && callbackData.timestamp < fiveMinutesAgo) {
        await this.ctx.storage.delete(key);
        callbackCleanupCount++;
      }
    }
    if (callbackCleanupCount > 0) {
      console.log(
        `[INFO] Cleaned up ${callbackCleanupCount} old callback contexts (>5 minutes)`,
      );
    }

    // 4. Set next alarm for 30 seconds from now
    await this.ctx.storage.setAlarm(Date.now() + 30000);
  }
}
