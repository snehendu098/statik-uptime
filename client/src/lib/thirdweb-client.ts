"use client";

import { createThirdwebClient } from "thirdweb";

console.log(process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID);

export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});
