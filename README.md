# Statik

A decentralized website uptime monitoring platform that leverages a network of validators to monitor website availability and performance across multiple geographic locations.

## Description

Statik is a distributed monitoring system that allows users to track their website uptime and performance through a network of decentralized validators. The platform consists of three main components:

- **Client Application**: A Next.js web dashboard where users can add websites to monitor, view uptime statistics, and analyze performance metrics
- **Hub Service**: A WebSocket-based coordination service that manages validators and distributes monitoring tasks
- **Validator Network**: Distributed nodes that perform actual website checks and earn rewards for their participation

The system uses Civic Auth for user authentication and integrates with Aptos/Petra wallets for validator payments and rewards. Website checks are performed every minute by available validators, with results stored in a PostgreSQL database via Prisma ORM.

## Features

### For Website Owners
- Add multiple websites for monitoring
- Real-time uptime and performance tracking
- Response time analytics with interactive charts
- AI-powered performance insights and recommendations
- Email-based user management through Civic Auth
- Historical data visualization

### For Validators
- Earn rewards by participating in the monitoring network
- Simple wallet connection via Petra
- Automatic task distribution through WebSocket connections
- Real-time validation status tracking
- Geographic distribution of monitoring points

### Technical Features
- Decentralized monitoring architecture
- WebSocket-based real-time communication
- JWT-based API authentication
- Responsive dark theme UI
- Database persistence with Prisma
- Cross-platform validator support

## Installation Instructions

### Prerequisites
- Node.js 18+ or Bun runtime
- PostgreSQL database
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd statik
```

### 2. Install Dependencies
```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 3. Database Setup
Set up your PostgreSQL database and configure the connection string in your environment variables.

### 4. Environment Configuration
Create `.env` files in the respective app directories:

**For API service (`apps/api/.env`):**
```
DATABASE_URL="postgresql://username:password@localhost:5432/statik"
JWT_PUBLIC_KEY="your-jwt-public-key"
```

**For Client application (`apps/client/.env.local`):**
```
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
DATABASE_URL="postgresql://username:password@localhost:5432/statik"
```

### 5. Database Migration
```bash
cd packages/db
npx prisma migrate deploy
npx prisma generate
```

## Usage Guide

### Starting the Services

1. **Start the Hub Service** (coordination layer):
```bash
cd apps/hub
bun run index.ts
# Runs on port 8081
```

2. **Start the API Service**:
```bash
cd apps/api
bun run index.ts
# Runs on port 8080
```

3. **Start the Client Application**:
```bash
cd apps/client
npm run dev
# Runs on port 3000
```

4. **Run a Validator** (optional, for testing):
```bash
cd apps/validator
npm run dev
# Opens validator interface
```

### Using the Platform

#### As a Website Owner:
1. Visit the client application at `http://localhost:3000`
2. Sign in using Civic Auth (email-based authentication)
3. Connect your Aptos wallet through the Petra extension
4. Add websites to monitor using the "Add Website" button
5. Configure monitoring intervals (1 minute to 1 hour)
6. View real-time status and historical data on the dashboard
7. Access detailed analytics by clicking on any monitored website

#### As a Validator:
1. Open the validator application
2. Install and connect the Petra wallet extension
3. Connect your wallet to join the validator network
4. The system will automatically assign monitoring tasks
5. Earn rewards for successful website validations
6. Monitor your validator status and earnings in real-time

### API Endpoints

The API service provides RESTful endpoints for website management:

- `POST /api/v1/website` - Add a new website to monitor
- `GET /api/v1/websites` - List all websites for authenticated user
- `GET /api/v1/website/status` - Get detailed status for a specific website
- `DELETE /api/v1/website` - Remove a website from monitoring
- `POST /api/v1/payout/:validatorId` - Process validator payments

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   API Service   │    │  Hub Service    │
│   (Next.js)     │◄──►│   (Express)     │    │  (WebSocket)    │
│   Port 3000     │    │   Port 8080     │    │   Port 8081     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Civic Auth    │    │   PostgreSQL    │    │   Validators    │
│  (Identity)     │    │   Database      │    │   (Network)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

The hub service coordinates between validators and maintains the monitoring schedule, while the API service handles user management and data persistence. The client application provides the user interface for both website owners and validators.
