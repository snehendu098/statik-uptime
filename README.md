# Statik

![Statik Banner](images/banner.jpeg)

**Decentralized Uptime Monitoring Network on Celo**

Statik is a permissionless DePIN (Decentralized Physical Infrastructure Network) that transforms website reliability monitoring into a global, trustless service. By incentivizing node operators to verify website uptime from diverse locations, Statik delivers sub-second validation results while disrupting a $2B+ market dominated by centralized providers.

## Overview

Traditional uptime monitoring services suffer from three critical limitations:

1. **Single Points of Failure** - Centralized infrastructure leaves businesses blind to outages
2. **Geographic Limitations** - Limited monitoring locations reduce detection accuracy
3. **High Costs** - Enterprise monitoring costs $500-5000/month, pricing out small teams

Statik solves these problems by creating a decentralized network where:

- **Validators** run monitoring nodes globally, earning rewards for verifying website uptime
- **Website Owners** pay affordable rates for distributed, reliable monitoring
- **Smart Contracts** handle staking, payments, and reward distribution trustlessly

## Why Celo?

Celo's proof-of-stake architecture is essential for Statik's real-time requirements:

- **Fast Finality** - Instant transaction confirmation for validator assignments
- **Low Gas Fees** - Economic viability for micro-transactions (10 CELO per validation)
- **EVM Compatibility** - Seamless integration with existing Web3 wallets and tools

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Website Owner  │────▶│   Hub Server    │────▶│   Validators    │
│   Dashboard     │     │  (Cloudflare)   │     │   (Docker CLI)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                         │
         │                      │                         │
         ▼                      ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Celo Blockchain Network                      │
│  Smart Contracts: Staking, Rewards, Validator Registry          │
└─────────────────────────────────────────────────────────────────┘
```

### Components

#### 1. Smart Contracts (On-Chain)

- **Validator Registry** - Requires 1000 CELO stake to participate, slashing for misbehavior
- **Credit System** - Website owners purchase monitoring credits
- **Rewards Pool** - Distributes earnings to validators based on performance
- **Audit Log** - Immutable record of monitored URLs and check intervals

#### 2. Hub Server (Cloudflare Workers + Durable Objects)

- **WebSocket Coordinator** - Real-time task distribution to validators
- **Durable Objects** - Maintain persistent validator connections and aggregate results
- **REST API** - Website management, stats, and credit purchases
- **Cron Jobs** - Scheduled monitoring tasks based on check intervals
- **Load Distribution** - Fisher-Yates shuffle algorithm for fair, random validator selection (3 validators per check)

#### 3. Validator Nodes (Off-Chain)

- **Bun Runtime** - Fast TypeScript execution for monitoring tasks
- **Docker CLI** - One-command deployment and scaling
- **Health Checks** - Performs uptime validation and latency measurement
- **Result Reporting** - Submits weighted results to the hub

#### 4. Website Owner Dashboard

- **Next.js Frontend** - Real-time uptime dashboard with charts
- **Thirdweb Integration** - Web3 wallet connection and transactions
- **Instant Alerts** - Webhook/email notifications for downtime
- **SLA Proof** - Blockchain-verified monitoring history

#### 5. Validator Dashboard

- **Next.js Frontend** - Earnings tracking and validator management
- **Performance Metrics** - Uptime, checks completed, and rewards earned
- **On-Chain Verification** - Transparent payout tracking

## Key Features

### For Website Owners

- Real-time uptime monitoring from distributed global nodes
- Instant downtime alerts via webhooks/email
- Blockchain-verified SLA proof
- Affordable pricing: 10 CELO credits per validation
- Geographic diversity for accurate status detection

### For Validators

- One-command deployment with Docker CLI
- Scale multiple instances per wallet
- Transparent on-chain earnings tracking
- Automatic reward distribution
- Minimal infrastructure requirements

## Economic Model

- **Users Pay**: 10 CELO credits per validation
- **Validator Earns**: 9.5 CELO tokens per successful check
- **Platform Fee**: 5% directed to treasury for development
- **Validation Model**: Each check performed by 3 randomly selected validators using the Fisher-Yates shuffle algorithm for unbiased, fair distribution
- **Consensus**: Results aggregated with weighted voting (validators with higher stake and uptime history carry more weight)

## Tech Stack

### Frontend

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4 with Radix UI components
- **Web3**: Thirdweb SDK for wallet integration
- **Charts**: Recharts for visualization

### Backend (Hub)

- **Runtime**: Cloudflare Workers
- **Framework**: Hono (lightweight web framework)
- **Database**: Drizzle ORM with Cloudflare D1
- **Real-time**: Durable Objects for WebSocket coordination
- **Auth**: Message signing with Viem

### Validator

- **Runtime**: Bun (fast JavaScript runtime)
- **Language**: TypeScript
- **Deployment**: Docker with compose orchestration
- **Monitoring**: HTTP health checks with latency tracking

### Blockchain

- **Network**: Celo Mainnet
- **Tools**: Viem for contract interactions
- **Standards**: ERC20-compatible credit system
- **Contract Address**: `0xC9191ceD91A36881e895cA7EA27E9efFa0f8351F`
- **Explorer**: [View on Celo Blockscout](https://celo.blockscout.com/address/0xC9191ceD91A36881e895cA7EA27E9efFa0f8351F)

## Smart Contract Deployment

The Statik smart contract is deployed on the Celo Mainnet:

- **Contract Address**: `0xC9191ceD91A36881e895cA7EA27E9efFa0f8351F`
- **Network**: Celo Mainnet
- **Explorer**: [View on Celo Blockscout](https://celo.blockscout.com/address/0xC9191ceD91A36881e895cA7EA27E9efFa0f8351F)

The contract handles:

- Validator registry and staking (1000 CELO stake requirement)
- Credit system for website monitoring
- Reward distribution to validators
- Slashing mechanism for misbehavior
- Immutable audit log of monitoring activities

## Project Structure

```
statik/
├── client/                 # Website owner dashboard
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # Reusable React components
│   │   └── lib/           # Utilities and Web3 config
│   └── package.json
│
├── validator-client/       # Validator dashboard
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # Validator-specific UI
│   │   └── lib/           # Utilities and Web3 config
│   └── package.json
│
├── hub/                    # Cloudflare Workers hub
│   ├── src/
│   │   ├── index.ts       # Main API routes
│   │   ├── validator-registry.ts  # Durable Object
│   │   ├── db/            # Drizzle schema and client
│   │   └── helpers/       # Cron jobs and utilities
│   ├── drizzle.config.ts
│   └── package.json
│
└── validator/              # Validator node
    ├── index.ts           # Main validator logic
    ├── account.ts         # U2U account management
    ├── types/             # TypeScript definitions
    ├── scripts/           # CLI installer
    ├── Dockerfile         # Docker image
    └── package.json
```

## Getting Started

### Prerequisites

- **Node.js** 20+ (for frontend applications)
- **Bun** 1.2+ (for validator development)
- **Docker** (for validator deployment)
- **Cloudflare Account** (for hub deployment)
- **Celo Wallet** with tokens for staking/monitoring

### 1. Hub Server Setup

```bash
cd hub
npm install

# Configure environment
cp .env.example .env
# Add your Cloudflare bindings

# Development
npm run dev

# Deploy to Cloudflare
npm run deploy
```

### 2. Website Owner Dashboard

```bash
cd client
npm install

# Configure environment
cp .env.example .env
# Add NEXT_PUBLIC_THIRDWEB_CLIENT_ID
# Add NEXT_PUBLIC_HUB_API_URL

# Development
npm run dev

# Production build
npm run build
npm start
```

### 3. Validator Dashboard

```bash
cd validator-client
npm install

# Configure environment
cp .env.example .env

# Development
npm run dev

# Production build
npm run build
npm start
```

### 4. Validator Node (Quick Start)

#### One-Command Installation

```bash
curl -fsSL https://raw.githubusercontent.com/snehendu098/statik-uptime/refs/heads/main/validator/scripts/install.sh | bash
```

This will:

- Check for Docker installation
- Install required dependencies (jq)
- Install the `statik` CLI globally
- Build the validator Docker image

#### Create Your First Validator

```bash
# Create a profile with 5 validator instances
statik add main --instances 5

# View your validators
statik list

# Check logs
statik logs main

# Scale up or down
statik scale main 10

# Stop validators
statik stop main

# Remove validators
statik remove main
```

For detailed validator documentation, see [validator/README.md](validator/README.md).

## API Documentation

The hub server exposes a REST API for website management and monitoring. See [hub/API_EXAMPLES.md](hub/API_EXAMPLES.md) for detailed endpoint documentation.

### Quick API Reference

#### Create Website Monitoring

```bash
POST /website
Body: { pubKey, url, signedMessage, checkIntervalMinutes }
```

#### Get Website Stats

```bash
GET /website/:websiteId
Response: { website, stats, recentTicks }
```

#### Get User Websites

```bash
GET /websites/:pubKey
Response: { user, websites }
```

#### Update Credits

```bash
POST /credits
Body: { pubKey, creditAmount, transactionHash, signedMessage }
```

#### Get Validator Info

```bash
GET /validator/:pubKey
Response: { validatorId, pubKey, pendingPayouts }
```

## Development

### Hub Server Development

```bash
cd hub

# Generate database migrations
npm run db:generate

# Push schema changes
npm run db:push

# Open Drizzle Studio
npm run db:studio

# Run local development with remote bindings
npm run dev-remote
```

### Validator Local Development

```bash
cd validator

# Install dependencies
bun install

# Create .env with your private key
echo "PRIVATE_KEY=0x..." > .env

# Run validator
bun run dev
```

## Hackathon Progress

### Pre-Hackathon Foundation

- ✅ WebSocket-based coordination system
- ✅ Docker deployment infrastructure
- ✅ Distributed monitoring for websites
- ✅ Validator dashboard for earnings tracking

### Week 1: Smart Contract Development

- ✅ Deployed validator staking with slashing mechanism
- ✅ Built ERC20-compatible credit system
- ✅ Implemented reward vesting schedules
- ✅ Passed security audit checklist (reentrancy, overflow protection)

### Week 2: Celo Integration

- ✅ Migrated to Celo Mainnet
- ✅ Integrated off-chain credits with Celo token payments
- ✅ Integrated Celo wallet via Thirdweb
- ✅ Implemented on-chain validator registry reads

### Week 3: Production Launch

- ✅ Deployed all contracts to Celo Mainnet
- ✅ Onboarded 3 beta users monitoring 12 production websites
- ✅ Distributed 25,000 U2U tokens in validator rewards

### Week 4: Polish & Documentation

- ✅ End-to-end user journey refinement
- ✅ Published technical documentation and architecture diagrams
- ✅ Open-sourced codebase with comprehensive README
- ✅ Published roadmap

## Key Metrics Achieved

- **15 Active Validators** across US, EU, and APAC regions
- **12 Websites Monitored** with 1-5 minute check intervals
- **50K+ Validations** completed successfully
- **99.8% Network Uptime** (demonstrating Celo speed advantage)
- **<500ms Average Response Time** from validation request to result

![Latency Monitoring Chart](images/latency-chart.jpeg)

## Market Opportunity

- **Target Market**: DevOps teams, SaaS companies, e-commerce platforms
- **TAM**: $2B+ uptime monitoring market (growing 12% YoY)
- **Competitive Edge**: 10x cheaper pricing, zero single points of failure, no vendor lock-in

### Competitive Comparison

| Feature                    | Statik    | Pingdom   | UptimeRobot | Datadog   |
| -------------------------- | --------- | --------- | ----------- | --------- |
| Decentralized              | ✅        | ❌        | ❌          | ❌        |
| No Single Point of Failure | ✅        | ❌        | ❌          | ❌        |
| Blockchain SLA Proof       | ✅        | ❌        | ❌          | ❌        |
| Geographic Diversity       | ✅        | Limited   | Limited     | Limited   |
| Starting Price             | $10/month | $15/month | $7/month    | $70/month |
| Censorship Resistant       | ✅        | ❌        | ❌          | ❌        |

## Security

### Smart Contract Security

- Reentrancy protection on all state-changing functions
- SafeMath for overflow protection
- Time-locked upgrades for governance changes
- Multi-signature treasury management

### Validator Security

- Private keys encrypted (base64) in `~/.statik/config.json`
- Keys never logged or exposed in container names
- Each container runs in isolated Docker network
- Automatic restart on failure

### API Security

- Message signing for all state-changing operations
- Public key verification using Viem
- Rate limiting on Cloudflare Workers
- CORS configured for production domains

## Roadmap

### Q1 2025

- [ ] Launch mainnet with 100+ validators
- [ ] Integrate with major Celo DeFi protocols
- [ ] Multi-chain expansion (Ethereum, Polygon)
- [ ] Advanced alerting (Slack, Discord, PagerDuty)

### Q2 2025

- [ ] DAO governance for protocol upgrades
- [ ] NFT-based validator licenses
- [ ] Mobile apps (iOS/Android)
- [ ] Advanced analytics dashboard

### Q3 2025

- [ ] AI-powered anomaly detection
- [ ] SLA insurance products
- [ ] Enterprise features (SSO, RBAC)
- [ ] Validator reputation system

### Q4 2025

- [ ] Cross-chain bridges for multi-network monitoring
- [ ] API monitoring (beyond just uptime)
- [ ] Performance monitoring (Lighthouse scores)
- [ ] Custom monitoring scripts

## Contributing

We welcome contributions from the community! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation for API changes
- Use conventional commits (feat, fix, docs, etc.)

## License

This project is open source and available under the [MIT License](LICENSE).

## Links

- **Live Application**: https://www.statikuptime.xyz/
- **Validator Dashboard**: https://validator.statikuptime.xyz/
- **Documentation**: [hub/API_EXAMPLES.md](hub/API_EXAMPLES.md)
- **Validator Guide**: [validator/README.md](validator/README.md)
- **Celo Network**: https://celo.org
- **Support**: [GitHub Issues](https://github.com/snehendu098/statik-uptime/issues)

## Acknowledgments

- Originally built for the U2U Hackathon 2025, now deployed on Celo
- Powered by Celo's proof-of-stake blockchain
- Deployed on Cloudflare Workers with Durable Objects
- UI components by Radix UI and Tailwind CSS

---

**Built with ❤️ for a decentralized web**
