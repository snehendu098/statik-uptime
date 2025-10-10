import { Hono } from "hono";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import { IncomingMessage } from "./types";
import { signUpHandler } from "./helpers";
import { CALLBACKS, cleanUpValidator } from "./state";
import { verify } from "./helpers/crypto";
import { sendReqToValidators } from "./helpers/cron";
import { type Env, getDbClient } from "./db/client";
import { users, websites, websiteTicks, validators } from "./db/schema";
import { eq, desc } from "drizzle-orm";
import { Address, verifyMessage } from "viem";

const app = new Hono<{ Bindings: Env }>();

// Create website endpoint
app.post("/website", async (c) => {
  try {
    const body = await c.req.json<{
      pubKey: Address;
      url: string;
      signedMessage: `0x${string}`;
      checkIntervalMinutes?: number; // Optional: how often to check (default: 5 minutes)
    }>();

    const { pubKey, url, signedMessage, checkIntervalMinutes = 5 } = body;

    // Validate input
    if (!pubKey || !url || !signedMessage) {
      return c.json(
        {
          success: false,
          error: "Missing required fields: pubKey, url, signedMessage",
        },
        400,
      );
    }

    // Verify the signature
    const verified = await verifyMessage({
      address: pubKey,
      message: `Create website monitoring for ${url}`,
      signature: signedMessage,
    });

    if (!verified) {
      return c.json(
        {
          success: false,
          error: "Invalid signature",
        },
        401,
      );
    }

    // Get database client
    const db = getDbClient(c.env);

    // Check if user exists
    let existingUser = await db
      .select()
      .from(users)
      .where(eq(users.pubKey, pubKey))
      .limit(1);

    let userId: string;

    // Create user if doesn't exist
    if (existingUser.length === 0) {
      const newUser = await db
        .insert(users)
        .values({
          pubKey,
        })
        .returning();

      userId = newUser[0].id;
      console.log(`Created new user: ${userId} for pubKey: ${pubKey}`);
    } else {
      userId = existingUser[0].id;
      console.log(`User already exists: ${userId} for pubKey: ${pubKey}`);
    }

    // Calculate next check interval (from now)
    const checkIntervals = new Date(
      Date.now() + checkIntervalMinutes * 60 * 1000,
    );

    // Create website
    const newWebsite = await db
      .insert(websites)
      .values({
        url,
        userId,
        disabled: false,
        checkIntervalMinutes,
        checkIntervals,
      })
      .returning();

    console.log(`Created website: ${newWebsite[0].id} for user: ${userId}`);

    return c.json({
      success: true,
      data: {
        websiteId: newWebsite[0].id,
        userId,
        url: newWebsite[0].url,
        checkIntervalMinutes: newWebsite[0].checkIntervalMinutes,
        checkIntervals: newWebsite[0].checkIntervals,
        disabled: newWebsite[0].disabled,
      },
    });
  } catch (error) {
    console.error("Error creating website:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get all websites for a user by pubKey (lightweight for listing page)
app.get("/websites/:pubKey", async (c) => {
  try {
    const pubKey = c.req.param("pubKey");

    if (!pubKey) {
      return c.json(
        {
          success: false,
          error: "Missing pubKey parameter",
        },
        400,
      );
    }

    const db = getDbClient(c.env);

    // Get user by pubKey
    const user = await db
      .select()
      .from(users)
      .where(eq(users.pubKey, pubKey))
      .limit(1);

    if (user.length === 0) {
      return c.json(
        {
          success: false,
          error: "User not found",
        },
        404,
      );
    }

    // Get all websites for this user
    const userWebsites = await db
      .select()
      .from(websites)
      .where(eq(websites.userId, user[0].id));

    // For each website, get ticks to calculate uptime
    const websitesWithBasicInfo = await Promise.all(
      userWebsites.map(async (website) => {
        // Get recent ticks to calculate uptime percentage
        const recentTicks = await db
          .select()
          .from(websiteTicks)
          .where(eq(websiteTicks.websiteId, website.id))
          .orderBy(desc(websiteTicks.createdAt))
          .limit(100);

        // Calculate uptime percentage
        const totalTicks = recentTicks.length;
        const goodTicks = recentTicks.filter((t) => t.status === "Good").length;
        const uptimePercentage =
          totalTicks > 0 ? (goodTicks / totalTicks) * 100 : 0;

        // Get last tick for current status
        const lastTick = recentTicks[0];

        return {
          id: website.id,
          url: website.url,
          disabled: website.disabled,
          checkIntervalMinutes: website.checkIntervalMinutes,
          currentStatus: lastTick?.status || "Unknown",
          lastChecked: lastTick?.createdAt || null,
          uptimePercentage: parseFloat(uptimePercentage.toFixed(2)),
        };
      }),
    );

    return c.json({
      success: true,
      data: {
        user: {
          id: user[0].id,
          pubKey: user[0].pubKey,
        },
        websites: websitesWithBasicInfo,
      },
    });
  } catch (error) {
    console.error("Error fetching user websites:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get website stats endpoint
app.get("/website/:websiteId", async (c) => {
  try {
    const websiteId = c.req.param("websiteId");

    if (!websiteId) {
      return c.json(
        {
          success: false,
          error: "Missing websiteId parameter",
        },
        400,
      );
    }

    const db = getDbClient(c.env);

    // Get website details
    const website = await db
      .select()
      .from(websites)
      .where(eq(websites.id, websiteId))
      .limit(1);

    if (website.length === 0) {
      return c.json(
        {
          success: false,
          error: "Website not found",
        },
        404,
      );
    }

    // Get user details
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, website[0].userId))
      .limit(1);

    // Get all website ticks with validator information
    const ticks = await db
      .select({
        id: websiteTicks.id,
        status: websiteTicks.status,
        latency: websiteTicks.latency,
        createdAt: websiteTicks.createdAt,
        validator: {
          id: validators.id,
          pubKey: validators.pubKey,
          location: validators.location,
          ip: validators.ip,
        },
      })
      .from(websiteTicks)
      .leftJoin(validators, eq(websiteTicks.validatorId, validators.id))
      .where(eq(websiteTicks.websiteId, websiteId))
      .orderBy(desc(websiteTicks.createdAt))
      .limit(100); // Limit to last 100 ticks

    // Calculate stats
    const totalTicks = ticks.length;
    const goodTicks = ticks.filter((t) => t.status === "Good").length;
    const badTicks = ticks.filter((t) => t.status === "Bad").length;
    const uptime =
      totalTicks > 0 ? ((goodTicks / totalTicks) * 100).toFixed(2) : "0.00";
    const avgLatency =
      totalTicks > 0
        ? (ticks.reduce((sum, t) => sum + t.latency, 0) / totalTicks).toFixed(2)
        : "0.00";

    return c.json({
      success: true,
      data: {
        website: {
          id: website[0].id,
          url: website[0].url,
          disabled: website[0].disabled,
          checkIntervalMinutes: website[0].checkIntervalMinutes,
          checkIntervals: website[0].checkIntervals,
          user: {
            id: user[0]?.id,
            pubKey: user[0]?.pubKey,
          },
        },
        stats: {
          totalChecks: totalTicks,
          goodChecks: goodTicks,
          badChecks: badTicks,
          uptimePercentage: parseFloat(uptime),
          averageLatency: parseFloat(avgLatency),
        },
        recentTicks: ticks.map((tick) => ({
          id: tick.id,
          status: tick.status,
          latency: tick.latency,
          createdAt: tick.createdAt,
          validator: tick.validator,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching website stats:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    const env = c.env;
    let pingInterval: NodeJS.Timeout | null = null;
    let wsRef: any = null;

    return {
      onMessage(event, ws) {
        // Initialize ping interval on first message (since onOpen is not supported)
        if (!pingInterval && !wsRef) {
          wsRef = ws;
          // Start ping interval to prevent Cloudflare's 100s timeout
          // Send ping every 30 seconds to keep the connection alive
          pingInterval = setInterval(() => {
            try {
              wsRef?.send(JSON.stringify({ type: "ping" }));
            } catch (error) {
              console.error("Error sending ping:", error);
              if (pingInterval) {
                clearInterval(pingInterval);
                pingInterval = null;
              }
            }
          }, 30000); // 30 seconds
        }

        const data: IncomingMessage = JSON.parse(event.data.toString());

        // Handle pong responses from clients
        if (data.type === "pong") {
          // Client acknowledged our ping, nothing else to do
          return;
        }

        if (data.type === "signup") {
          console.log("Signup request recieved from", data.data.ip);

          verify(data.data.signedMessage, data.data.publicKey)
            .then((verified) => {
              console.log(`Verified ${data.data.publicKey} with ${verified}`);

              if (verified) {
                signUpHandler(ws, data.data, env)
                  .then((signUpData) => {
                    console.log(`Validators: ${signUpData}`);
                  })
                  .catch((err) => console.log(`Error signing up`, err));
              }
            })
            .catch((error) => {
              console.error("Verification error:", error);
            });
        } else if (data.type === "validate") {
          CALLBACKS[data.data.callbackId]?.(data);
          delete CALLBACKS[data.data.callbackId];
        }
      },

      onClose(_close, ws) {
        // Clear the ping interval when connection closes
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        wsRef = null;
        cleanUpValidator(ws);
      },

      onError(error) {
        console.error("WebSocket error:", error);
        // Clear the ping interval on error
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        wsRef = null;
      },
    };
  }),
);

export default {
  fetch: app.fetch,
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) {
    console.log("Cron Processed");

    ctx.waitUntil(sendReqToValidators(env));
  },
};
