#!/bin/bash
# ============================================
# Nos Market Deployment Script
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
TIMEOUT=300

echo -e "${GREEN}=== Nos Market Deployment Script ===${NC}\n"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required but not installed.${NC}" >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}Docker Compose is required but not installed.${NC}" >&2; exit 1; }

# Check environment file
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

# Build images
echo -e "\n${YELLOW}Building Docker images...${NC}"
docker-compose -f $COMPOSE_FILE build --no-cache

# Start services
echo -e "\n${YELLOW}Starting services...${NC}"
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to be healthy...${NC}"
services=("postgres" "redis" "api" "web" "bot")
for service in "${services[@]}"; do
    echo -n "Checking $service... "
    count=0
    while [ $count -lt $TIMEOUT ]; do
        if docker-compose -f $COMPOSE_FILE exec -T $service healthcheck >/dev/null 2>&1; then
            echo -e "${GREEN}OK${NC}"
            break
        fi
        sleep 1
        count=$((count+1))
    done
    if [ $count -eq $TIMEOUT ]; then
        echo -e "${RED}TIMEOUT${NC}"
        echo -e "${RED}Service $service failed to become healthy.${NC}"
        docker-compose -f $COMPOSE_FILE logs $service
        exit 1
    fi
done

# Run database migrations
echo -e "\n${YELLOW}Running database migrations...${NC}"
docker-compose -f $COMPOSE_FILE exec -T api npx prisma migrate deploy || true

# Seed database (optional)
read -p "Do you want to seed the database? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Seeding database...${NC}"
    docker-compose -f $COMPOSE_FILE exec -T api npx prisma db seed || true
fi

echo -e "\n${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Services:"
echo "  - Web:     http://localhost:3000"
echo "  - API:     http://localhost:3001"
echo "  - Grafana: http://localhost:3002"
echo ""
echo "To view logs: pnpm logs"
echo "To stop: pnpm stop:prod"
