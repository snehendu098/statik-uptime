import type { Address } from "viem";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

export const privateKey = process.env.PRIVATE_KEY! as Address;
