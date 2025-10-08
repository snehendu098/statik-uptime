import { Address, verifyMessage } from "viem";

export const verify = async (sig: `0x${string}`, pubKey: Address) => {
  const valid = await verifyMessage({
    address: pubKey,
    message: `Signing up as validator with account ${pubKey}`,
    signature: sig,
  });

  return valid;
};
