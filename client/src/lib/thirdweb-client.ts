"use client";

import { createThirdwebClient, defineChain, getContract } from "thirdweb";

console.log(process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID);

export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export const contract = getContract({
  client,
  chain: defineChain(42220),
  address: "0xC9191ceD91A36881e895cA7EA27E9efFa0f8351F",
});
