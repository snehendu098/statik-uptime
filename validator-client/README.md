# Statik Validator Dashboard

Validator dashboard for tracking earnings, performance metrics, and managing validator nodes on the Statik decentralized uptime monitoring network.

## Features

- Earnings tracking and performance metrics
- Uptime and checks completed statistics
- On-chain verification of payouts
- Real-time validator status monitoring
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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the validator dashboard.

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4 with Radix UI components
- **Web3**: Thirdweb SDK for wallet integration
- **Network**: U2U Mainnet

## Learn More

- For validator node setup, see the [validator README](../validator/README.md)
- For more information about the Statik project, see the [main README](../README.md)
