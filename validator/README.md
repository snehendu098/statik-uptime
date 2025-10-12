# Statik Validator

Run validators to earn rewards by monitoring website uptime and performance.

## 🚀 Quick Start (Recommended)

### One-Command Installation

```bash
curl -fsSL https://statik.network/install.sh | bash
```

Or for local development:
```bash
cd validator/scripts && ./install.sh
```

This will:
- ✅ Check for Docker installation
- ✅ Install required dependencies (jq)
- ✅ Install the `statik` CLI globally
- ✅ Build the validator Docker image

### Create Your First Validator

```bash
# Create a profile with 5 validator instances
statik add main --instances 5
```

You'll be prompted for your private key. All 5 validators will use the same key.

### View Your Validators

```bash
statik list
```

Output:
```
PROFILE          INSTANCES    STATUS
────────────────────────────────────────
main             5            ✅ Running
```

## 📚 CLI Commands

### Profile Management

```bash
# Add a new validator profile
statik add <name> [--instances <num>]

# List all profiles
statik list

# Scale a profile up or down
statik scale <name> <num>

# Remove a profile
statik remove <name>
```

### Control

```bash
# Start a profile
statik start <name>

# Stop a profile
statik stop <name>

# Restart a profile
statik restart <name>

# Start all profiles
statik start-all

# Stop all profiles
statik stop-all
```

### Monitoring

```bash
# View logs for a profile
statik logs <name>

# Check status of all profiles
statik status
```

## 💡 Use Cases

### Single Key, Multiple Validators

Perfect for running multiple validators with the same wallet:

```bash
# Create profile with 5 instances
statik add main --instances 5

# Scale up to 10
statik scale main 10

# Scale down to 3
statik scale main 3
```

### Multiple Keys, Multiple Validators

Run validators with different wallets:

```bash
# First wallet with 5 validators
statik add node1 --instances 5

# Second wallet with 3 validators
statik add node2 --instances 3

# Third wallet with 2 validators
statik add node3 --instances 2
```

Now you have **10 total validators** across **3 different wallets**.

### Managing Multiple Profiles

```bash
# View all profiles
statik list

# Check logs for specific profile
statik logs node1

# Stop one profile, keep others running
statik stop node2

# Restart a specific profile
statik restart node3
```

## 🔧 Configuration

All configuration is stored in `~/.statik/`:

```
~/.statik/
├── config.json              # Encrypted keys and profile settings
└── compose/
    ├── main.yml            # Docker Compose for 'main' profile
    ├── node1.yml           # Docker Compose for 'node1' profile
    └── node2.yml           # Docker Compose for 'node2' profile
```

## 🛠️ Manual Development Setup

If you want to run validators without Docker:

### Install Dependencies

```bash
bun install
```

### Run Validator

```bash
bun run index.ts
```

Create a `.env` file with your private key:
```
PRIVATE_KEY=0x...
```

## 📦 Docker

### Build Image Manually

```bash
docker build -t statik-validator:latest .
```

### Run Single Container

```bash
docker run -e PRIVATE_KEY=0x... statik-validator:latest
```

## 🔐 Security

- Private keys are stored encrypted (base64) in `~/.statik/config.json`
- Keys are never logged or exposed in Docker container names
- Each container runs in an isolated network
- Containers restart automatically on failure

## ❓ Help

```bash
statik help
```

## 🐛 Troubleshooting

### Docker not running
```bash
# Start Docker Desktop and try again
statik add main
```

### View container logs
```bash
statik logs <profile-name>
```

### Remove all validators
```bash
statik stop-all
statik remove <profile-name>
```

---

This project was created using `bun init` in bun v1.2.23. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
