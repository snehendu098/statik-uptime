// Message types sent FROM the hub TO validators
export type OutgoingMessage =
  | { type: "ping" }
  | { type: "signup"; data: SignupOutgoingMessage }
  | { type: "validate"; data: ValidateOutgoingMessage };

export interface SignupOutgoingMessage {
  validatorId: string;
  callbackId: string;
}

export interface ValidateOutgoingMessage {
  callbackId: string;
  url: string;
  websiteId: string;
}

// Message types sent FROM validators TO the hub
export interface IncomingMessage {
  type: "pong" | "signup" | "validate";
  data: SignupIncomingMessage | ValidateIncomingMessage;
}

export interface SignupIncomingMessage {
  callbackId: string;
  ip: string;
  publicKey: string;
  signedMessage: string;
}

export interface ValidateIncomingMessage {
  callbackId: string;
  status: "Good" | "Bad";
  latency: number;
  websiteId: string;
  validatorId: string;
  signedMessage: string;
}
