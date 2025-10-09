import { Address } from "viem";

export interface SignupIncomingMessage {
  ip: string;
  publicKey: Address;
  signedMessage: `0x${string}`;
  callbackId: string;
}

export interface ValidateIncomingMessage {
  callbackId: string;
  signedMessage: string;
  status: "Good" | "Bad";
  latency: number;
  websiteId: string;
  validatorId: string;
}

export type IncomingMessage =
  | {
      type: "signup";
      data: SignupIncomingMessage;
    }
  | {
      type: "validate";
      data: ValidateIncomingMessage;
    };
