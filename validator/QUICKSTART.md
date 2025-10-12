# Statik Validator - Quick Start Guide

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/snehendu098/statik-uptime/refs/heads/main/validator/scripts/install.sh | bash
```

Or for local development:
```bash
cd validator/scripts && ./install.sh
```

## Basic Commands

### Create Validators

```bash
# Single key, 5 validators
statik add main --instances 5
```

### View Status

```bash
# List all profiles
statik list

# Check detailed status
statik status
```

### Scale Up/Down

```bash
# Scale to 10 validators
statik scale main 10

# Scale down to 3
statik scale main 3
```

### View Logs

```bash
# Follow logs for a profile
statik logs main
```

### Control

```bash
# Start/stop specific profile
statik start main
statik stop main
statik restart main

# Control all profiles
statik start-all
statik stop-all
```

### Remove

```bash
# Remove a profile
statik remove main
```

## Examples

### Example 1: Single Key, Multiple Validators
```bash
# Install
curl -fsSL https://raw.githubusercontent.com/snehendu098/statik-uptime/refs/heads/main/validator/scripts/install.sh | bash

# Create 5 validators with one key
statik add main --instances 5

# View status
statik list

# Scale up
statik scale main 10
```

### Example 2: Multiple Keys, Multiple Validators
```bash
# First wallet - 5 validators
statik add node1 --instances 5

# Second wallet - 3 validators
statik add node2 --instances 3

# Third wallet - 2 validators
statik add node3 --instances 2

# View all (10 total validators)
statik list

# View logs for specific profile
statik logs node1
```

### Example 3: Managing Validators
```bash
# Check status
statik status

# Stop one profile
statik stop node2

# Scale another profile
statik scale node1 10

# Restart a profile
statik restart node3

# View logs
statik logs node1
```

## Workflow

```
1. Install CLI
   ↓
2. Create profile(s)
   ↓
3. Validators run automatically
   ↓
4. Monitor with logs/status
   ↓
5. Scale as needed
```

## File Structure

```
~/.statik/
├── config.json           # Your encrypted keys
├── validator/            # Validator source code
│   ├── Dockerfile
│   ├── index.ts
│   ├── account.ts
│   ├── types.ts
│   └── package.json
└── compose/              # Docker Compose files
    ├── main.yml         # Docker Compose for 'main'
    ├── node1.yml        # Docker Compose for 'node1'
    └── node2.yml        # Docker Compose for 'node2'
```

## Troubleshooting

### Issue: "Dockerfile: no such file or directory"

**Cause:** Validator files weren't downloaded properly during installation.

**Solution:**
```bash
# Re-run the installer to download all required files
curl -fsSL https://raw.githubusercontent.com/snehendu098/statik-uptime/refs/heads/main/validator/scripts/install.sh | bash
```

The installer will:
- Download validator source code to `~/.statik/validator/`
- Build the Docker image automatically
- Install the CLI to `/usr/local/bin/statik`

### Docker not running
```bash
# Install Docker Desktop first
# macOS: https://docs.docker.com/desktop/install/mac-install/
# Linux: https://docs.docker.com/desktop/install/linux-install/
# Then start Docker Desktop and run: statik add main
```

### View logs for debugging
```bash
statik logs <profile-name>
```

### Manually rebuild Docker image
```bash
# If automatic build fails, rebuild manually
cd ~/.statik/validator
docker build -t statik-validator:latest .
```

### Private key format error
```bash
# Private key must be: 0x + 64 hex characters
# Example: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Reset everything
```bash
statik stop-all
rm -rf ~/.statik
```

## Help

```bash
statik help
```

## Config Location

All your validator configuration is stored in:
- **Config**: `~/.statik/config.json`
- **Validator Code**: `~/.statik/validator/`
- **Docker Compose files**: `~/.statik/compose/`

## Security

- Private keys are encrypted (base64) before storage
- Keys are never logged or shown in container names
- Each validator runs in an isolated Docker container
- Automatic restart on failure
