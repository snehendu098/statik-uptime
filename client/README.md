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

The Statik smart contract is deployed on the U2U Mainnet:

- **Contract Address**: `0x9Fe9004AecD7eE38342EfAfA3feBaF3AE3eDE0A6`
- **Network**: U2U Mainnet
- **Explorer**: [View on U2U Scan](https://u2uscan.xyz/address/0x9Fe9004AecD7eE38342EfAfA3feBaF3AE3eDE0A6)

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
- **Network**: U2U Mainnet

## Learn More

For more information about the Statik project, see the [main README](../README.md).
