import { Address } from "viem";

export interface SignupIncomingMessage {
  ip: string;
  publicKey: Address;
  signedMessage: `0x${string}`;
  callbackId: string;
}

export interface IncomingMessage {
  type: "signup";
  data: SignupIncomingMessage;
}
