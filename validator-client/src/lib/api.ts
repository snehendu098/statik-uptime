// API utility for hub server communication (validator endpoints)

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || "http://localhost:8787";

export interface ValidatorData {
  validatorId: string;
  pubKey: string;
  pendingPayouts: number;
  location: string;
  ip: string;
}

export interface GetValidatorResponse {
  success: boolean;
  data?: ValidatorData;
  error?: string;
}

export interface ResetPayoutsRequest {
  pubKey: string;
  signedMessage: string;
}

export interface ResetPayoutsResponse {
  success: boolean;
  data?: {
    validatorId: string;
    pubKey: string;
    previousPayouts: number;
    newPayouts: number;
  };
  error?: string;
}

/**
 * Get validator pending payouts by public key
 */
export async function getValidatorByPubKey(
  pubKey: string
): Promise<GetValidatorResponse> {
  try {
    const response = await fetch(`${HUB_API_URL}/validator/${pubKey}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching validator:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Reset validator pending payouts to 0
 */
export async function resetValidatorPayouts(
  data: ResetPayoutsRequest
): Promise<ResetPayoutsResponse> {
  try {
    const response = await fetch(`${HUB_API_URL}/validator/reset-payouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error resetting validator payouts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
