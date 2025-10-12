#!/usr/bin/env bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
STATIK_GREEN='\033[38;2;0;191;99m'  # #00bf63
NC='\033[0m' # No Color

# Config paths
STATIK_DIR="$HOME/.statik"
CONFIG_FILE="$STATIK_DIR/config.json"
COMPOSE_DIR="$STATIK_DIR/compose"
DOCKER_IMAGE="statik-validator:latest"

# Initialize config directory
init_config() {
    mkdir -p "$STATIK_DIR"
    mkdir -p "$COMPOSE_DIR"

    if [ ! -f "$CONFIG_FILE" ]; then
        echo '{"profiles":{}}' > "$CONFIG_FILE"
    fi
}

# Encrypt private key (simple base64 for now, can be enhanced)
encrypt_key() {
    echo -n "$1" | base64
}

# Decrypt private key
decrypt_key() {
    echo -n "$1" | base64 -d
}

# Get config
get_config() {
    cat "$CONFIG_FILE"
}

# Save config
save_config() {
    echo "$1" > "$CONFIG_FILE"
}

# Generate docker-compose for a profile
generate_compose() {
    local profile_name=$1
    local private_key=$2
    local instances=$3

    local compose_file="$COMPOSE_DIR/$profile_name.yml"

    cat > "$compose_file" << EOF
services:
EOF

    for i in $(seq 1 $instances); do
        cat >> "$compose_file" << EOF
  ${profile_name}-${i}:
    image: ${DOCKER_IMAGE}
    container_name: statik-${profile_name}-${i}
    environment:
      - PRIVATE_KEY=${private_key}
    restart: unless-stopped
    networks:
      - statik-network

EOF
    done

    cat >> "$compose_file" << EOF
networks:
  statik-network:
    driver: bridge
EOF

    echo "$compose_file"
}

# Build Docker image if it doesn't exist
ensure_docker_image() {
    if ! docker image inspect "$DOCKER_IMAGE" &> /dev/null; then
        echo -e "${BLUE}Building validator Docker image...${NC}"
        local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        local validator_dir="$(dirname "$script_dir")"
        docker build -t "$DOCKER_IMAGE" "$validator_dir"
        echo -e "${GREEN}SUCCESS: Image built successfully${NC}"
    fi
}

# Add a new profile
cmd_add() {
    local profile_name=$1
    local instances=${2:-1}

    # Parse --instances flag
    if [[ "$2" == "--instances" ]]; then
        instances=$3
    fi

    if [ -z "$profile_name" ]; then
        echo -e "${RED}ERROR: Profile name required${NC}"
        echo "Usage: statik add <name> [--instances <num>]"
        exit 1
    fi

    # Check if profile exists
    local config=$(get_config)
    if echo "$config" | jq -e ".profiles.\"$profile_name\"" &> /dev/null; then
        echo -e "${RED}ERROR: Profile '$profile_name' already exists${NC}"
        exit 1
    fi

    # Prompt for private key
    echo -e "${BLUE}Enter private key for profile '$profile_name':${NC}"
    read -s private_key
    echo

    if [ -z "$private_key" ]; then
        echo -e "${RED}ERROR: Private key cannot be empty${NC}"
        exit 1
    fi

    # Validate private key format (should start with 0x)
    if [[ ! "$private_key" =~ ^0x[a-fA-F0-9]{64}$ ]]; then
        echo -e "${YELLOW}WARNING: Private key should be in format 0x... (64 hex chars)${NC}"
    fi

    ensure_docker_image

    # Encrypt and save config
    local encrypted_key=$(encrypt_key "$private_key")
    local updated_config=$(echo "$config" | jq ".profiles.\"$profile_name\" = {\"key\": \"$encrypted_key\", \"instances\": $instances, \"created\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}")
    save_config "$updated_config"

    # Generate compose file and start
    local compose_file=$(generate_compose "$profile_name" "$private_key" "$instances")
    docker compose -f "$compose_file" up -d

    echo -e "${GREEN}SUCCESS: Profile '$profile_name' created with $instances instance(s)${NC}"
    echo -e "${GREEN}SUCCESS: Validators started successfully${NC}"
}

# List all profiles
cmd_list() {
    local config=$(get_config)
    local profiles=$(echo "$config" | jq -r '.profiles | keys[]')

    if [ -z "$profiles" ]; then
        echo -e "${YELLOW}No profiles found. Use 'statik add <name>' to create one.${NC}"
        exit 0
    fi

    echo -e "${BLUE}PROFILE          INSTANCES    STATUS${NC}"
    echo "────────────────────────────────────────"

    for profile in $profiles; do
        local instances=$(echo "$config" | jq -r ".profiles.\"$profile\".instances")
        local compose_file="$COMPOSE_DIR/$profile.yml"

        if [ -f "$compose_file" ]; then
            local running=$(docker compose -f "$compose_file" ps --format json 2>/dev/null | jq -s 'map(select(.State == "running")) | length')
            if [ "$running" -eq "$instances" ]; then
                local status="${GREEN}Running${NC}"
            elif [ "$running" -gt 0 ]; then
                local status="${YELLOW}$running/$instances running${NC}"
            else
                local status="${RED}Stopped${NC}"
            fi
        else
            local status="${RED}Stopped${NC}"
        fi

        printf "%-16s %-12s %b\n" "$profile" "$instances" "$status"
    done
}

# Scale a profile
cmd_scale() {
    local profile_name=$1
    local new_instances=$2

    if [ -z "$profile_name" ] || [ -z "$new_instances" ]; then
        echo -e "${RED}ERROR: Profile name and instance count required${NC}"
        echo "Usage: statik scale <name> <instances>"
        exit 1
    fi

    local config=$(get_config)
    if ! echo "$config" | jq -e ".profiles.\"$profile_name\"" &> /dev/null; then
        echo -e "${RED}ERROR: Profile '$profile_name' not found${NC}"
        exit 1
    fi

    # Get private key
    local encrypted_key=$(echo "$config" | jq -r ".profiles.\"$profile_name\".key")
    local private_key=$(decrypt_key "$encrypted_key")

    # Update config
    local updated_config=$(echo "$config" | jq ".profiles.\"$profile_name\".instances = $new_instances")
    save_config "$updated_config"

    # Regenerate compose and restart
    local compose_file=$(generate_compose "$profile_name" "$private_key" "$new_instances")
    docker compose -f "$compose_file" down 2>/dev/null || true
    docker compose -f "$compose_file" up -d

    echo -e "${GREEN}SUCCESS: Profile '$profile_name' scaled to $new_instances instance(s)${NC}"
}

# View logs with colored validator names
cmd_logs() {
    local profile_name=$1
    local compose_file="$COMPOSE_DIR/$profile_name.yml"

    if [ -z "$profile_name" ]; then
        echo -e "${RED}ERROR: Profile name required${NC}"
        echo "Usage: statik logs <name>"
        exit 1
    fi

    if [ ! -f "$compose_file" ]; then
        echo -e "${RED}ERROR: Profile '$profile_name' not found${NC}"
        exit 1
    fi

    # Format logs with colored validator names using Perl for better color support
    docker compose -f "$compose_file" logs -f --tail=10 2>&1 | perl -lne '
        BEGIN {
            # Color codes for different validators
            @colors = (
                "\033[38;2;0;191;99m",    # Statik green
                "\033[38;2;52;152;219m",  # Blue
                "\033[38;2;155;89;182m",  # Purple
                "\033[38;2;241;196;15m",  # Yellow
                "\033[38;2;230;126;34m",  # Orange
                "\033[38;2;231;76;60m",   # Red
                "\033[38;2;26;188;156m",  # Teal
                "\033[38;2;46;204;113m"   # Green
            );
            $nc = "\033[0m";

            # Log level colors
            $info = "\033[0;36m";       # Cyan
            $success = "\033[0;32m";    # Green
            $validate = "\033[0;35m";   # Magenta
            $error = "\033[0;31m";      # Red

            $| = 1;  # Disable buffering
        }

        # Match docker compose log format: "container-name  | message"
        if (/^(statik-[a-zA-Z0-9_-]+)\s+\|\s+(.*)$/) {
            my $container = $1;
            my $message = $2;

            # Extract validator number
            my $color;
            if ($container =~ /-(\d+)$/) {
                my $num = $1;
                my $color_idx = ($num - 1) % 8;
                $color = $colors[$color_idx];
            } else {
                $color = $colors[0];
            }

            # Color log level prefixes
            $message =~ s/\[INFO\]/${info}[INFO]${nc}/g;
            $message =~ s/\[SUCCESS\]/${success}[SUCCESS]${nc}/g;
            $message =~ s/\[VALIDATE\]/${validate}[VALIDATE]${nc}/g;
            $message =~ s/\[ERROR\]/${error}[ERROR]${nc}/g;

            # Print colored line
            print "${color}[$container]${nc}: $message";
        } else {
            # Pass through unmatched lines as-is
            print $_;
        }
    '
}

# Start profile
cmd_start() {
    local profile_name=$1
    local compose_file="$COMPOSE_DIR/$profile_name.yml"

    if [ -z "$profile_name" ]; then
        echo -e "${RED}ERROR: Profile name required${NC}"
        echo "Usage: statik start <name>"
        exit 1
    fi

    if [ ! -f "$compose_file" ]; then
        echo -e "${RED}ERROR: Profile '$profile_name' not found${NC}"
        exit 1
    fi

    docker compose -f "$compose_file" up -d
    echo -e "${GREEN}SUCCESS: Profile '$profile_name' started${NC}"
}

# Stop profile
cmd_stop() {
    local profile_name=$1
    local compose_file="$COMPOSE_DIR/$profile_name.yml"

    if [ -z "$profile_name" ]; then
        echo -e "${RED}ERROR: Profile name required${NC}"
        echo "Usage: statik stop <name>"
        exit 1
    fi

    if [ ! -f "$compose_file" ]; then
        echo -e "${RED}ERROR: Profile '$profile_name' not found${NC}"
        exit 1
    fi

    docker compose -f "$compose_file" down
    echo -e "${GREEN}SUCCESS: Profile '$profile_name' stopped${NC}"
}

# Restart profile
cmd_restart() {
    local profile_name=$1

    if [ -z "$profile_name" ]; then
        echo -e "${RED}ERROR: Profile name required${NC}"
        echo "Usage: statik restart <name>"
        exit 1
    fi

    cmd_stop "$profile_name"
    cmd_start "$profile_name"
}

# Remove profile
cmd_remove() {
    local profile_name=$1
    local compose_file="$COMPOSE_DIR/$profile_name.yml"

    if [ -z "$profile_name" ]; then
        echo -e "${RED}ERROR: Profile name required${NC}"
        echo "Usage: statik remove <name>"
        exit 1
    fi

    # Stop containers
    if [ -f "$compose_file" ]; then
        docker compose -f "$compose_file" down
        rm "$compose_file"
    fi

    # Remove from config
    local config=$(get_config)
    local updated_config=$(echo "$config" | jq "del(.profiles.\"$profile_name\")")
    save_config "$updated_config"

    echo -e "${GREEN}SUCCESS: Profile '$profile_name' removed${NC}"
}

# Start all profiles
cmd_start_all() {
    local config=$(get_config)
    local profiles=$(echo "$config" | jq -r '.profiles | keys[]')

    if [ -z "$profiles" ]; then
        echo -e "${YELLOW}No profiles found${NC}"
        exit 0
    fi

    for profile in $profiles; do
        cmd_start "$profile"
    done
}

# Stop all profiles
cmd_stop_all() {
    local config=$(get_config)
    local profiles=$(echo "$config" | jq -r '.profiles | keys[]')

    if [ -z "$profiles" ]; then
        echo -e "${YELLOW}No profiles found${NC}"
        exit 0
    fi

    for profile in $profiles; do
        cmd_stop "$profile"
    done
}

# Status (alias for list)
cmd_status() {
    cmd_list
}

# Show help
cmd_help() {
    echo -e "${STATIK_GREEN}Statik Validator CLI${NC}"
    echo ""
    echo -e "${YELLOW}USAGE:${NC}"
    echo "  statik <command> [options]"
    echo ""
    echo -e "${YELLOW}COMMANDS:${NC}"
    echo "  add <name> [--instances <num>]   Create a new validator profile"
    echo "  list                              List all validator profiles"
    echo "  scale <name> <num>               Scale profile to N instances"
    echo "  logs <name>                      View logs for a profile"
    echo "  start <name>                     Start a profile"
    echo "  stop <name>                      Stop a profile"
    echo "  restart <name>                   Restart a profile"
    echo "  remove <name>                    Remove a profile"
    echo "  start-all                        Start all profiles"
    echo "  stop-all                         Stop all profiles"
    echo "  status                           Show status of all profiles"
    echo "  help                             Show this help message"
    echo ""
    echo -e "${YELLOW}EXAMPLES:${NC}"
    echo "  statik add main --instances 5    Create 'main' profile with 5 validators"
    echo "  statik scale main 10             Scale 'main' to 10 validators"
    echo "  statik logs main                 View logs for 'main' profile"
    echo "  statik list                      List all profiles"
    echo "  statik start-all                 Start all validators"
    echo ""
    echo -e "${YELLOW}CONFIG:${NC}"
    echo "  Config location: ~/.statik/config.json"
    echo "  Docker compose files: ~/.statik/compose/"
}

# Main command router
main() {
    init_config

    local command=${1:-help}
    shift || true

    case $command in
        add)
            cmd_add "$@"
            ;;
        list)
            cmd_list
            ;;
        scale)
            cmd_scale "$@"
            ;;
        logs)
            cmd_logs "$@"
            ;;
        start)
            cmd_start "$@"
            ;;
        stop)
            cmd_stop "$@"
            ;;
        restart)
            cmd_restart "$@"
            ;;
        remove)
            cmd_remove "$@"
            ;;
        start-all)
            cmd_start_all
            ;;
        stop-all)
            cmd_stop_all
            ;;
        status)
            cmd_status
            ;;
        help|--help|-h)
            cmd_help
            ;;
        *)
            echo -e "${RED}ERROR: Unknown command: $command${NC}"
            echo "Run 'statik help' for usage"
            exit 1
            ;;
    esac
}

main "$@"
