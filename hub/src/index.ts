import { Hono } from "hono";
import { cors } from "hono/cors";
import { sendReqToValidators } from "./helpers/cron";
import { type Env, getDbClient } from "./db/client";
import { users, websites, websiteTicks, validators } from "./db/schema";
import { eq, desc } from "drizzle-orm";
import { Address, verifyMessage } from "viem";

// Export Durable Object for Cloudflare Workers
export { ValidatorRegistry } from "./validator-registry";

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for all routes
app.use(
  "/*",
  cors({
    origin: "*", // Allow all origins (adjust in production to specific domains)
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

/**
 * Helper function to get or create a user by public key
 * Returns the user record, creating one with 1000 credits if it doesn't exist
 */
async function getOrCreateUser(
  db: ReturnType<typeof getDbClient>,
  pubKey: string,
) {
  let user = await db
    .select()
    .from(users)
    .where(eq(users.pubKey, pubKey))
    .limit(1);

  if (user.length === 0) {
    console.log(`User not found for pubKey: ${pubKey}. Creating new user...`);

    const newUser = await db
      .insert(users)
      .values({
        pubKey,
        credits: 1000, // Initialize with 1000 credits
      })
      .returning();

    user = newUser;
    console.log(
      `Created new user: ${newUser[0].id} for pubKey: ${pubKey} with 1000 starting credits`,
    );
  }

  return user[0];
}

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

    // Get or create user
    const user = await getOrCreateUser(db, pubKey);
    const userId = user.id;

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

    // Get or create user (auto-creates on first visit for smoother UX)
    const user = await getOrCreateUser(db, pubKey);

    // Get all websites for this user
    const userWebsites = await db
      .select()
      .from(websites)
      .where(eq(websites.userId, user.id));

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
          id: user.id,
          pubKey: user.pubKey,
          credits: user.credits || 0,
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
        recentTicks: ticks
          .map((tick) => ({
            id: tick.id,
            status: tick.status,
            latency: tick.latency,
            createdAt: tick.createdAt,
            validator: tick.validator,
          }))
          .reverse(), // Reverse to show oldest first, most recent last for chart display
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

// Update user credits endpoint
app.post("/credits", async (c) => {
  try {
    const body = await c.req.json<{
      pubKey: Address;
      creditAmount: number;
      transactionHash: string;
      signedMessage: `0x${string}`;
    }>();

    const { pubKey, creditAmount, transactionHash, signedMessage } = body;

    // Validate input
    if (!pubKey || !creditAmount || !transactionHash || !signedMessage) {
      return c.json(
        {
          success: false,
          error: "Missing required fields: pubKey, creditAmount, transactionHash, signedMessage",
        },
        400,
      );
    }

    // Verify the signature
    const verified = await verifyMessage({
      address: pubKey,
      message: `Add ${creditAmount} credits`,
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

    // Get or create user
    const user = await getOrCreateUser(db, pubKey);

    // Update user credits (add to existing credits)
    const updatedCredits = (user.credits || 0) + creditAmount;

    await db
      .update(users)
      .set({ credits: updatedCredits })
      .where(eq(users.id, user.id));

    console.log(
      `Updated credits for user ${user.id}: ${user.credits || 0} -> ${updatedCredits} (added ${creditAmount}) via transaction ${transactionHash}`,
    );

    return c.json({
      success: true,
      data: {
        userId: user.id,
        pubKey: user.pubKey,
        previousCredits: user.credits || 0,
        addedCredits: creditAmount,
        newCredits: updatedCredits,
        transactionHash,
      },
    });
  } catch (error) {
    console.error("Error updating credits:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get validator pending payouts by pubKey
app.get("/validator/:pubKey", async (c) => {
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

    // Get validator by pubKey
    const validator = await db
      .select()
      .from(validators)
      .where(eq(validators.pubKey, pubKey))
      .limit(1);

    if (validator.length === 0) {
      return c.json(
        {
          success: false,
          error: "Validator not found",
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: {
        validatorId: validator[0].id,
        pubKey: validator[0].pubKey,
        pendingPayouts: validator[0].pendingPayouts,
        location: validator[0].location,
        ip: validator[0].ip,
      },
    });
  } catch (error) {
    console.error("Error fetching validator:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Reset validator pending payouts to 0
app.post("/validator/reset-payouts", async (c) => {
  try {
    const body = await c.req.json<{
      pubKey: Address;
      signedMessage: `0x${string}`;
    }>();

    const { pubKey, signedMessage } = body;

    // Validate input
    if (!pubKey || !signedMessage) {
      return c.json(
        {
          success: false,
          error: "Missing required fields: pubKey, signedMessage",
        },
        400,
      );
    }

    // Verify the signature
    const verified = await verifyMessage({
      address: pubKey,
      message: `Reset pending payouts for validator ${pubKey}`,
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

    // Get validator by pubKey
    const validator = await db
      .select()
      .from(validators)
      .where(eq(validators.pubKey, pubKey))
      .limit(1);

    if (validator.length === 0) {
      return c.json(
        {
          success: false,
          error: "Validator not found",
        },
        404,
      );
    }

    const previousPayouts = validator[0].pendingPayouts;

    // Reset pending payouts to 0
    await db
      .update(validators)
      .set({ pendingPayouts: 0 })
      .where(eq(validators.id, validator[0].id));

    console.log(
      `Reset pending payouts for validator ${validator[0].id}: ${previousPayouts} -> 0`,
    );

    return c.json({
      success: true,
      data: {
        validatorId: validator[0].id,
        pubKey: validator[0].pubKey,
        previousPayouts,
        newPayouts: 0,
      },
    });
  } catch (error) {
    console.error("Error resetting validator payouts:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// WebSocket route - proxy to Durable Object
app.get("/ws", async (c) => {
  // Get Durable Object stub using a fixed ID (single instance for all validators)
  const id = c.env.VALIDATOR_REGISTRY.idFromName("global");
  const stub = c.env.VALIDATOR_REGISTRY.get(id);

  // Forward the request to the Durable Object
  const url = new URL(c.req.url);
  url.pathname = "/ws";

  return stub.fetch(url.toString(), c.req.raw);
});

export default {
  fetch: app.fetch,
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) {
    console.log("Cron Processed");

    ctx.waitUntil(sendReqToValidators(env, ctx));
  },
};
