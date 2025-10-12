# API Examples

## Table of Contents
1. [Create Website Endpoint](#create-website-endpoint)
2. [Get Website Stats Endpoint](#get-website-stats-endpoint)

---

## Create Website Endpoint

**Endpoint:** `POST /website`

**Description:** Creates a new website for monitoring. If the user with the given public key doesn't exist, it will be created automatically.

### Request Body

```json
{
  "pubKey": "0x...",
  "url": "https://example.com",
  "signedMessage": "0x...",
  "checkIntervalMinutes": 5  // Optional, defaults to 5 minutes
}
```

### Required Fields

- `pubKey` (Address): The Ethereum address of the user
- `url` (string): The website URL to monitor
- `signedMessage` (0x${string}): Signature of the message `Create website monitoring for ${url}`

### Signature Message Format

The user must sign the following message:
```
Create website monitoring for ${url}
```

For example, if monitoring `https://example.com`:
```
Create website monitoring for https://example.com
```

### Example with viem (TypeScript)

```typescript
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const account = privateKeyToAccount('0x...');
const url = 'https://example.com';

// Sign the message
const signature = await account.signMessage({
  message: `Create website monitoring for ${url}`,
});

// Make the API request
const response = await fetch('https://your-worker.workers.dev/website', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    pubKey: account.address,
    url: url,
    signedMessage: signature,
    checkIntervalMinutes: 5,
  }),
});

const result = await response.json();
console.log(result);
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "websiteId": "...",
    "userId": "...",
    "url": "https://example.com",
    "checkIntervals": "2025-10-10T02:00:00.000Z",
    "disabled": false
  }
}
```

### Error Responses

**400 - Missing Fields**
```json
{
  "success": false,
  "error": "Missing required fields: pubKey, url, signedMessage"
}
```

**401 - Invalid Signature**
```json
{
  "success": false,
  "error": "Invalid signature"
}
```

**500 - Server Error**
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Testing with curl

First, generate a signature using your preferred method, then:

```bash
curl -X POST https://your-worker.workers.dev/website \
  -H "Content-Type: application/json" \
  -d '{
    "pubKey": "0xYourAddress",
    "url": "https://example.com",
    "signedMessage": "0xYourSignature"
  }'
```

## How It Works

1. **Signature Verification:** The endpoint verifies that the `signedMessage` was signed by the private key corresponding to `pubKey`
2. **User Creation:** If a user with the given `pubKey` doesn't exist, a new user is created
3. **Website Creation:** A new website entry is created linked to the user
4. **Check Intervals:** The `checkIntervals` field determines when the next monitoring check should occur
5. **Validator Selection:** When a check is due, the hub uses the Fisher-Yates shuffle algorithm to randomly select 3 validators from the active pool
6. **Response:** Returns the created website details including IDs and timestamps

---

## Get Website Stats Endpoint

**Endpoint:** `GET /website/:websiteId`

**Description:** Retrieves comprehensive statistics and monitoring data for a specific website, including all recent ticks from validators.

### URL Parameters

- `websiteId` (string): The ID of the website to retrieve stats for

### Example Request

```bash
curl https://your-worker.workers.dev/website/01932e62-8b4a-7d5f-9c8e-3f2a1b0c4d5e
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "website": {
      "id": "01932e62-8b4a-7d5f-9c8e-3f2a1b0c4d5e",
      "url": "https://example.com",
      "disabled": false,
      "checkIntervals": "2025-10-10T02:05:00.000Z",
      "user": {
        "id": "01932e62-8a1b-7c3d-9e4f-5a6b7c8d9e0f",
        "pubKey": "0xYourAddress"
      }
    },
    "stats": {
      "totalChecks": 48,
      "goodChecks": 47,
      "badChecks": 1,
      "uptimePercentage": 97.92,
      "averageLatency": 125.45
    },
    "recentTicks": [
      {
        "id": "01932e62-8c2d-7e4f-9a5b-6c7d8e9f0a1b",
        "status": "Good",
        "latency": 120.5,
        "createdAt": "2025-10-10T01:55:00.000Z",
        "validator": {
          "id": "01932e62-8d3e-7f5a-9b6c-7d8e9f0a1b2c",
          "pubKey": "0xValidatorAddress",
          "location": "US-East",
          "ip": "192.168.1.1"
        }
      },
      {
        "id": "01932e62-8e4f-7a5b-9c6d-8e9f0a1b2c3d",
        "status": "Good",
        "latency": 115.2,
        "createdAt": "2025-10-10T01:50:00.000Z",
        "validator": {
          "id": "01932e62-8f5a-7b6c-9d7e-9f0a1b2c3d4e",
          "pubKey": "0xAnotherValidator",
          "location": "EU-West",
          "ip": "192.168.1.2"
        }
      }
    ]
  }
}
```

### Response Fields

**website:**
- `id`: Website unique identifier
- `url`: The monitored URL
- `disabled`: Whether monitoring is disabled
- `checkIntervals`: Next scheduled check time
- `user`: Object containing user ID and public key

**stats:**
- `totalChecks`: Total number of monitoring checks performed
- `goodChecks`: Number of successful checks (status: "Good")
- `badChecks`: Number of failed checks (status: "Bad")
- `uptimePercentage`: Percentage of successful checks (0-100)
- `averageLatency`: Average response time in milliseconds

**recentTicks:**
- Array of up to 100 most recent checks, ordered by newest first
- Each tick includes:
  - `id`: Tick unique identifier
  - `status`: "Good" or "Bad"
  - `latency`: Response time in milliseconds
  - `createdAt`: Timestamp of the check
  - `validator`: Information about the validator that performed the check

### Error Responses

**400 - Missing Parameter**
```json
{
  "success": false,
  "error": "Missing websiteId parameter"
}
```

**404 - Website Not Found**
```json
{
  "success": false,
  "error": "Website not found"
}
```

**500 - Server Error**
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Example with TypeScript

```typescript
async function getWebsiteStats(websiteId: string) {
  const response = await fetch(
    `https://your-worker.workers.dev/website/${websiteId}`
  );

  const result = await response.json();

  if (result.success) {
    console.log(`Website: ${result.data.website.url}`);
    console.log(`Uptime: ${result.data.stats.uptimePercentage}%`);
    console.log(`Avg Latency: ${result.data.stats.averageLatency}ms`);
    console.log(`Recent checks: ${result.data.recentTicks.length}`);
  }

  return result;
}

// Usage
const stats = await getWebsiteStats('01932e62-8b4a-7d5f-9c8e-3f2a1b0c4d5e');
```

### Use Cases

- **Dashboard Display:** Show real-time uptime and performance metrics
- **Alerting:** Monitor uptimePercentage and trigger alerts when it drops
- **Performance Analysis:** Analyze latency trends across different validators
- **Validator Verification:** See which validators are checking your site
- **Historical Data:** Review up to 100 recent monitoring results
