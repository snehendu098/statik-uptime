# Statik Client Dashboard

Website owner dashboard for monitoring uptime and managing websites on the Statik decentralized uptime monitoring network.

## Features

- Real-time uptime monitoring dashboard with charts
- Website management (add, remove, configure check intervals)
- Credit management and purchase system
- Instant downtime alerts
- Blockchain-verified SLA proof
- Web3 wallet integration via Thirdweb

## Smart Contract

The Statik smart contract is deployed on the Celo Mainnet:

- **Contract Address**: `0xC9191ceD91A36881e895cA7EA27E9efFa0f8351F`
- **Network**: Celo Mainnet
- **Explorer**: [View on Celo Blockscout](https://celo.blockscout.com/address/0xC9191ceD91A36881e895cA7EA27E9efFa0f8351F)

## Getting Started

First, install dependencies:

```bash
npm install
```

Configure your environment variables:

```bash
cp .env.example .env
```

Add your environment variables:
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` - Your Thirdweb client ID
- `NEXT_PUBLIC_HUB_API_URL` - Hub server API URL

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4 with Radix UI components
- **Web3**: Thirdweb SDK for wallet integration
- **Charts**: Recharts for visualization
- **Network**: Celo Mainnet

## Learn More

For more information about the Statik project, see the [main README](../README.md).
