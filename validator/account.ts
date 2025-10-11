import type { Hex } from "viem";

// Bun automatically loads .env files, no need for dotenv
export const privateKey = process.env.PRIVATE_KEY! as Hex;
