// API utility for hub server communication

const HUB_API_URL =
  process.env.NEXT_PUBLIC_HUB_API_URL || "http://localhost:8787";

export interface CreateWebsiteRequest {
  pubKey: string;
  url: string;
  signedMessage: string;
  checkIntervalMinutes?: number;
}

export interface CreateWebsiteResponse {
  success: boolean;
  data?: {
    websiteId: string;
    userId: string;
    url: string;
    checkIntervalMinutes: number;
    checkIntervals: string;
    disabled: boolean;
  };
  error?: string;
}

export interface Website {
  id: string;
  url: string;
  disabled: boolean;
  checkIntervalMinutes: number;
  currentStatus: "Good" | "Bad" | "Unknown";
  lastChecked: string | null;
  uptimePercentage: number;
}

export interface GetWebsitesResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      pubKey: string;
      credits: number;
    };
    websites: Website[];
  };
  error?: string;
}

export interface WebsiteTick {
  id: string;
  status: "Good" | "Bad";
  latency: number;
  createdAt: string;
  validator: {
    id: string;
    pubKey: string;
    location: string;
    ip: string;
  } | null;
}

export interface GetWebsiteStatsResponse {
  success: boolean;
  data?: {
    website: {
      id: string;
      url: string;
      disabled: boolean;
      checkIntervalMinutes: number;
      checkIntervals: string;
      user: {
        id: string;
        pubKey: string;
      };
    };
    stats: {
      totalChecks: number;
      goodChecks: number;
      badChecks: number;
      uptimePercentage: number;
      averageLatency: number;
    };
    recentTicks: WebsiteTick[];
  };
  error?: string;
}

/**
 * Create a new website monitor
 */
export async function createWebsite(
  data: CreateWebsiteRequest,
): Promise<CreateWebsiteResponse> {
  try {
    const response = await fetch(`${HUB_API_URL}/website`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating website:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all websites for a user by public key
 */
export async function getWebsitesByPubKey(
  pubKey: string,
): Promise<GetWebsitesResponse> {
  try {
    const response = await fetch(`${HUB_API_URL}/websites/${pubKey}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching websites:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get detailed stats for a specific website
 */
export async function getWebsiteStats(
  websiteId: string,
): Promise<GetWebsiteStatsResponse> {
  try {
    const response = await fetch(`${HUB_API_URL}/website/${websiteId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching website stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface UpdateCreditsRequest {
  pubKey: string;
  creditAmount: number;
  transactionHash: string;
  signedMessage: string;
}

export interface UpdateCreditsResponse {
  success: boolean;
  data?: {
    userId: string;
    pubKey: string;
    previousCredits: number;
    addedCredits: number;
    newCredits: number;
    transactionHash: string;
  };
  error?: string;
}

/**
 * Update user credits after a successful transaction
 */
export async function updateCredits(
  data: UpdateCreditsRequest,
): Promise<UpdateCreditsResponse> {
  try {
    const response = await fetch(`${HUB_API_URL}/credits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error updating credits:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
