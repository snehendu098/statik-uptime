# Statik Hub

The hub server is the coordination layer for the Statik network, built on Cloudflare Workers with Durable Objects for persistent WebSocket connections.

## Smart Contract

The Statik smart contract is deployed on the Celo Mainnet:

- **Contract Address**: `0xC9191ceD91A36881e895cA7EA27E9efFa0f8351F`
- **Network**: Celo Mainnet
- **Explorer**: [View on Celo Blockscout](https://celo.blockscout.com/address/0xC9191ceD91A36881e895cA7EA27E9efFa0f8351F)

## Features

- **WebSocket Coordination** - Maintains persistent connections to all active validators
- **Cron-based Monitoring** - Scheduled checks for websites based on configured intervals
- **Fair Load Distribution** - Uses Fisher-Yates shuffle algorithm to randomly select 3 validators per website check
- **REST API** - Endpoints for website management, statistics, and credit purchases
- **Real-time Communication** - Instant task distribution and result aggregation

## Getting Started

```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
