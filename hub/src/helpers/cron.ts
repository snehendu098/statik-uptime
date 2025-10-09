import { v7 } from "uuid";
import { getDbClient, type Env } from "../db/client";
import { websites, validators, websiteTicks } from "../db/schema";
import { AVAILABLE_VALIDATORS, CALLBACKS } from "../state";
import { IncomingMessage } from "../types";
import { Address, verifyMessage } from "viem";
import { eq, lte, and } from "drizzle-orm";

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
    // Send validation requests to all available validators
    AVAILABLE_VALIDATORS.keys().forEach((socket) => {
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
            address: AVAILABLE_VALIDATORS.get(socket)?.pubKey as Address,
            message: `Replying to ${callbackId}`,
            signature: signedMessage as Address,
          });

          const validatorDb = await db
            .select()
            .from(validators)
            .where(eq(validators.pubKey, AVAILABLE_VALIDATORS.get(socket)?.pubKey || ""))
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
