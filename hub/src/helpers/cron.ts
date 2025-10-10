import { v7 } from "uuid";
import { getDbClient, type Env } from "../db/client";
import { websites, validators, websiteTicks } from "../db/schema";
import { AVAILABLE_VALIDATORS, CALLBACKS } from "../state";
import { IncomingMessage } from "../types";
import { Address, verifyMessage } from "viem";
import { eq, lte, and } from "drizzle-orm";
import { WSContext } from "hono/ws";

/**
 * Randomly selects N validators from the available pool
 * @param count Number of validators to select (default: 3)
 * @returns Array of selected validators with their WebSocket contexts
 */
const selectRandomValidators = (count: number = 3) => {
  const validatorsArray = Array.from(AVAILABLE_VALIDATORS.entries());

  // If we have fewer validators than requested, return all available
  if (validatorsArray.length <= count) {
    return validatorsArray;
  }

  // Fisher-Yates shuffle algorithm to get random selection
  const shuffled = [...validatorsArray];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
};

export const sendReqToValidators = async (env: Env) => {
  const db = getDbClient(env);
  const currentTime = new Date();

  // Query only websites that are due for checking (current time >= checkIntervals)
  const websitesDueForCheck = await db
    .select()
    .from(websites)
    .where(
      and(
        eq(websites.disabled, false),
        lte(websites.checkIntervals, currentTime)
      )
    );

  console.log(
    `Found ${websitesDueForCheck.length} websites due for checking`
  );

  for (const website of websitesDueForCheck) {
    // Select 3 random validators for this website check
    const selectedValidators = selectRandomValidators(3);

    console.log(
      `Selected ${selectedValidators.length} validators for website ${website.id} (${website.url})`
    );

    // Send validation requests only to selected validators
    selectedValidators.forEach(([socket, validatorInfo]) => {
      const callbackId = v7().toString();

      socket.send(
        JSON.stringify({
          type: "validate",
          data: {
            url: website.url,
            callbackId,
            websiteId: website.id,
          },
        }),
      );

      CALLBACKS[callbackId] = async (data: IncomingMessage) => {
        if (data.type === "validate") {
          const { status, latency, signedMessage } = data.data;

          const verified = await verifyMessage({
            address: validatorInfo.pubKey as Address,
            message: `Replying to ${callbackId}`,
            signature: signedMessage as Address,
          });

          const validatorDb = await db
            .select()
            .from(validators)
            .where(eq(validators.pubKey, validatorInfo.pubKey || ""))
            .limit(1);

          if (!verified || validatorDb.length === 0) return;

          const validator = validatorDb[0];

          // Drizzle doesn't have built-in transactions for D1 yet, but we can use batch
          await db.batch([
            db.insert(websiteTicks).values({
              websiteId: website.id,
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
          ]);

          console.log(
            `Recorded validation for website ${website.id} by validator ${validator.id}: ${status} (${latency}ms)`
          );
        }
      };
    });

    // Update the next check interval based on the website's checkIntervalMinutes
    const nextCheckTime = new Date(
      currentTime.getTime() + website.checkIntervalMinutes * 60 * 1000
    );

    await db
      .update(websites)
      .set({ checkIntervals: nextCheckTime })
      .where(eq(websites.id, website.id));

    console.log(
      `Updated next check time for website ${website.id} (${website.url}) to ${nextCheckTime.toISOString()}`
    );
  }
};
