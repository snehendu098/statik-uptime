import { v7 } from "uuid";
import { getDbClient, type Env } from "../db/client";
import { websites } from "../db/schema";
import { eq, lte, and } from "drizzle-orm";
import type { ExecutionContext } from "@cloudflare/workers-types";

/**
 * Randomly selects N validators from the available pool
 * @param count Number of validators to select (default: 3)
 * @returns Array of selected validators
 */
const selectRandomValidators = (
  validatorList: Array<{ validatorId: string; pubKey: string; ip: string }>,
  count: number = 3
) => {
  // If we have fewer validators than requested, return all available
  if (validatorList.length <= count) {
    return validatorList;
  }

  // Fisher-Yates shuffle algorithm to get random selection
  const shuffled = [...validatorList];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
};


export const sendReqToValidators = async (env: Env, ctx: ExecutionContext) => {
  console.log("🔄 Cron job starting - checking for websites to validate...");
  const db = getDbClient(env);
  const currentTime = new Date();

  // Get Durable Object stub to access validators
  const id = env.VALIDATOR_REGISTRY.idFromName("global");
  const stub = env.VALIDATOR_REGISTRY.get(id);
  console.log("🔗 Connected to Durable Object");

  // Get list of active validators from Durable Object
  console.log("📡 Fetching active validators from Durable Object...");
  const validatorsResponse = await stub.fetch("https://dummy.com/validators");

  console.log(`📥 Response status: ${validatorsResponse.status}`);

  const validatorsData = await validatorsResponse.json() as {
    success: boolean;
    count: number;
    validators: Array<{ validatorId: string; pubKey: string; ip: string }>;
  };

  console.log(`📊 Validators response data:`, JSON.stringify(validatorsData, null, 2));

  if (!validatorsData.success || validatorsData.count === 0) {
    console.log("⚠️ No validators available for checking websites");
    console.log(`   - Success: ${validatorsData.success}`);
    console.log(`   - Count: ${validatorsData.count}`);
    return;
  }

  console.log(`✅ Found ${validatorsData.count} active validators`);
  console.log(`   Validators:`, validatorsData.validators.map(v => ({
    id: v.validatorId,
    pubKey: v.pubKey.slice(0, 10) + '...'
  })));

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
    `📋 Found ${websitesDueForCheck.length} websites due for checking`
  );

  for (const website of websitesDueForCheck) {
    // Select 3 random validators for this website check
    const selectedValidators = selectRandomValidators(validatorsData.validators, 3);

    console.log(
      `✅ Selected ${selectedValidators.length} validators for website ${website.id} (${website.url})`
    );

    // Send validation requests to all selected validators (fire-and-forget)
    for (const validator of selectedValidators) {
      const callbackId = v7().toString();

      try {
        // Send validation request with callback context to Durable Object
        await stub.fetch("https://dummy.com/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            validatorId: validator.validatorId,
            callbackId,
            url: website.url,
            websiteId: website.id,
            callbackContext: {
              websiteId: website.id,
              website: {
                url: website.url,
                userId: website.userId,
                checkIntervalMinutes: website.checkIntervalMinutes,
              },
              validatorId: validator.validatorId,
              validatorPubKey: validator.pubKey,
            },
          }),
        });

        console.log(`📤 Sent validation request to validator ${validator.validatorId} for ${website.url}`);

      } catch (error) {
        console.error(`Error sending validation request to ${validator.validatorId}:`, error);
      }
    }

    // Update next check interval immediately (fire-and-forget)
    const nextCheckTime = new Date(
      currentTime.getTime() + website.checkIntervalMinutes * 60 * 1000
    );

    await db
      .update(websites)
      .set({ checkIntervals: nextCheckTime })
      .where(eq(websites.id, website.id));

    console.log(
      `⏰ Updated next check time for website ${website.id} (${website.url}) to ${nextCheckTime.toISOString()}`
    );
  }

  console.log(`✅ Cron job completed - sent validation requests for ${websitesDueForCheck.length} websites`);
};
