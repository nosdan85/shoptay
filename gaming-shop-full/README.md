# Nos Market

A high-performance gaming marketplace built with modern web technologies, featuring Discord integration for authentication and support, multiple payment providers, and real-time updates.

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand + React Query/SWR
- **Forms**: React Hook Form + Zod

### Backend (API)
- **Framework**: NestJS 10
- **Language**: TypeScript
- **ORM**: Prisma with PostgreSQL
- **Cache**: Redis (ioredis)
- **Authentication**: JWT + Discord OAuth2
- **API Documentation**: Swagger/OpenAPI

### Bot (Discord)
- **Library**: Discord.js v14
- **Language**: TypeScript
- **Commands**: Slash commands + Button interactions

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Monitoring**: Prometheus + Grafana
- **Database**: PostgreSQL 16

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                            │
│              (SSL Termination, Rate Limiting)                    │
└─────────────────────────────────────────────────────────────────┘
                    │                         │
                    ▼                         ▼
┌──────────────────────────┐    ┌────────────────────────────────┐
│    Next.js Web App       │    │       NestJS API Server        │
│    (Port 3000)           │    │       (Port 3001)               │
│                          │    │                                │
│  - Product browsing      │    │  - REST API                    │
│  - Cart & checkout       │    │  - Authentication              │
│  - User dashboard       │    │  - Business logic               │
│  - Admin panel          │    │  - Database operations          │
└──────────────────────────┘    │  - WebSocket (Socket.io)       │
                                  └────────────────────────────────┘
                                            │
                                            ▼
                         ┌────────────────────────────────────────┐
                         │              PostgreSQL                 │
                         │         (Main Database)                │
                         └────────────────────────────────────────┘
                                            │
                         ┌──────────────────┬─────────────────────┐
                         │                  │                     │
                         ▼                  ▼                     ▼
               ┌──────────────┐  ┌─────────────────┐  ┌─────────────────┐
               │    Redis     │  │  Discord Bot    │  │   Prometheus    │
               │   (Cache)   │  │  (Node Process) │  │   (Metrics)    │
               └──────────────┘  └─────────────────┘  └─────────────────┘
```

## Project Structure

```
nosmarket/
├── apps/
│   ├── api/                    # NestJS API Server
│   │   ├── src/
│   │   │   ├── auth/          # Authentication (Discord OAuth, JWT)
│   │   │   ├── users/          # User management
│   │   │   ├── products/       # Product catalog (games, categories)
│   │   │   ├── orders/         # Order processing & checkout
│   │   │   ├── payments/       # Payment providers (PayPal, Square, LTC)
│   │   │   ├── wallet/         # Wallet system
│   │   │   ├── delivery-slots/ # Delivery scheduling
│   │   │   ├── config/         # Shop configuration
│   │   │   ├── admin/          # Admin dashboard APIs
│   │   │   ├── realtime/       # WebSocket gateway
│   │   │   ├── tickets/        # Support tickets
│   │   │   ├── proofs/         # Delivery proofs
│   │   │   ├── notifications/   # Notifications system
│   │   │   ├── security/        # Fraud detection, rate limiting
│   │   │   ├── redis/           # Redis service
│   │   │   ├── media/           # File uploads
│   │   │   └── common/          # Guards, decorators, pipes
│   │   └── prisma/
│   │       └── schema.prisma   # Database schema
│   │
│   └── web/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   ├── components/     # React components
│       │   ├── hooks/          # Custom hooks
│       │   ├── lib/            # Utilities
│       │   ├── stores/         # Zustand stores
│       │   └── styles/         # Global styles
│       └── public/             # Static assets
│
├── services/
│   └── bot/                    # Discord Bot
│       └── src/
│           ├── commands/        # Slash commands
│           ├── components/      # Button/select handlers
│           ├── embeds/          # Discord embeds
│           ├── events/          # Event listeners
│           └── services/        # Business logic
│
├── packages/
│   ├── shared/                 # Shared code
│   │   ├── src/
│   │   │   ├── schemas.ts     # Zod schemas
│   │   │   ├── constants.ts    # Constants
│   │   │   └── index.ts       # Re-exports
│   │   └── prisma/
│   │       └── schema.prisma   # Shared schema
│   │
│   └── config/                 # Shared configs
│       ├── tsconfig.base.json
│       └── eslint.js
│
├── infrastructure/
│   ├── docker/                 # Docker configurations
│   ├── nginx/                  # Nginx configs
│   └── monitoring/             # Prometheus & Grafana
│
├── scripts/                    # Deployment scripts
├── docker-compose.yml          # Development compose
├── docker-compose.prod.yml     # Production compose
├── turbo.json                  # Turborepo config
└── package.json               # Root package.json
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local development)
- PostgreSQL 16+ (or use Docker)
- Redis 7+ (or use Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nosmarket
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example env files
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   cp services/bot/.env.example services/bot/.env

   # Edit each file with your values
   ```

4. **Start infrastructure (PostgreSQL & Redis)**
   ```bash
   docker-compose up -d postgres redis
   ```

5. **Run database migrations**
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

6. **Start development servers**
   ```bash
   pnpm dev
   ```

### Development URLs

- **Web Frontend**: http://localhost:3000
- **API Server**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **Prisma Studio**: http://localhost:5555
- **Grafana**: http://localhost:3002 (metrics)
- **Prometheus**: http://localhost:9090

## Environment Variables

### API (apps/api/.env)

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/nosmarket

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-app-client-id
DISCORD_CLIENT_SECRET=your-discord-app-client-secret
DISCORD_BOT_TOKEN=your-discord-bot-token
OWNER_DISCORD_ID=your-discord-user-id

# URLs
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:3001

# Payment Providers
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
SQUARE_APPLICATION_ID=your-square-app-id
SQUARE_ACCESS_TOKEN=your-square-access-token
NOWPAYMENTS_API_KEY=your-nowpayments-api-key

# Security
FRAUD_BLOCK_THRESHOLD=80
FRAUD_WARN_THRESHOLD=50
CORS_ORIGINS=http://localhost:3000

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

### Web (apps/web/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DISCORD_CLIENT_ID=your-discord-app-client-id
NEXT_PUBLIC_DISCORD_INVITE_URL=https://discord.gg/your-invite
NEXT_PUBLIC_DISCORD_VOUCH_URL=https://discord.gg/your-vouch-channel
NEXT_PUBLIC_SITE_LOGO=/site-logo.png
```

### Bot (services/bot/.env)

```env
DISCORD_BOT_TOKEN=your-discord-bot-token
DATABASE_URL=postgresql://postgres:password@localhost:5432/nosmarket
REDIS_URL=redis://localhost:6379
API_BASE_URL=http://localhost:3001
DISCORD_GUILD_ID=your-server-id
DISCORD_VOUCH_CHANNEL_ID=your-vouch-channel-id
OWNER_DISCORD_ID=your-owner-discord-id
OWNER_ROLE_ID=your-owner-role-id
TICKET_CATEGORY_ID=your-ticket-category-id
```

## Available Scripts

### Development

```bash
pnpm dev              # Start all services in development mode
pnpm dev:api          # Start only API server
pnpm dev:web          # Start only web frontend
pnpm dev:bot          # Start only Discord bot
```

### Building

```bash
pnpm build            # Build all packages
pnpm build:api        # Build API server
pnpm build:web         # Build web frontend
pnpm build:bot         # Build Discord bot
```

### Database

```bash
pnpm db:generate       # Generate Prisma client
pnpm db:push          # Push schema changes (dev)
pnpm db:migrate        # Run migrations
pnpm db:migrate:dev    # Create new migration (dev)
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio
```

### Testing

```bash
pnpm test             # Run all tests
pnpm test:e2e         # Run E2E tests
pnpm test:coverage    # Run tests with coverage
```

### Docker

```bash
pnpm start:prod        # Start production stack
pnpm stop:prod        # Stop production stack
pnpm logs             # View logs
pnpm logs:api          # View API logs
pnpm healthcheck       # Check API health
```

## Features

### User Features
- Discord OAuth authentication
- Browse products by game and category
- Shopping cart with bulk pricing
- Multiple payment methods (PayPal, Cash App, Litecoin)
- Wallet system with deposits
- Order history and tracking
- Delivery scheduling
- Real-time notifications

### Admin Features
- Dashboard with analytics
- Order management
- Product management (CRUD)
- Game and category management
- Banner and homepage configuration
- Delivery slot scheduling
- Wallet management
- Audit logs
- Fraud detection

### Discord Bot Features
- Ticket creation and management
- Automatic delivery notifications
- Vouch posting (delivery proofs)
- User verification
- Guild member sync
- Staff commands

## API Documentation

The API is documented with Swagger/OpenAPI. Access the interactive documentation at:

```
http://localhost:3001/api/docs
```

### Authentication

The API uses JWT Bearer token authentication:

```
Authorization: Bearer <access_token>
```

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/shop/products` | List products |
| GET | `/api/v1/shop/games` | List games |
| GET | `/api/v1/shop/config` | Get shop config |
| GET | `/api/v1/shop/recent-purchases` | Recent orders |
| POST | `/api/v1/auth/discord` | Discord OAuth |
| GET | `/api/v1/check-owner` | Check owner status |

### Authenticated Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/orders` | User orders |
| POST | `/api/v1/orders/checkout` | Create order |
| GET | `/api/v1/wallet` | Wallet balance |
| POST | `/api/v1/wallet/topup` | Create topup |
| GET | `/api/v1/notifications` | User notifications |
| GET | `/api/v1/delivery-slots` | Available slots |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/orders` | All orders |
| PUT | `/api/v1/admin/orders/:id/paid` | Mark paid |
| POST | `/api/v1/owner/products` | Create product |
| PUT | `/api/v1/owner/products/:id` | Update product |
| GET | `/api/v1/owner/audit` | Audit logs |

## Monitoring

### Prometheus Metrics

Access metrics at:
```
http://localhost:9090
```

### Grafana Dashboards

Access dashboards at:
```
http://localhost:3002
```

Default credentials: `admin` / `admin` (change in production)

## Deployment

### Docker Compose (Recommended)

1. Copy environment files:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp services/bot/.env.example services/bot/.env
   ```

2. Edit environment files with production values

3. Start the stack:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

4. Run migrations:
   ```bash
   docker-compose exec api npx prisma migrate deploy
   docker-compose exec api npx prisma db seed
   ```

### Manual Deployment

1. Build all services:
   ```bash
   pnpm build
   ```

2. Set up PostgreSQL and Redis

3. Configure environment variables

4. Run migrations

5. Start services:
   ```bash
   # API
   node apps/api/dist/main.js

   # Web
   node apps/web/.next/standalone/server.js

   # Bot
   node services/bot/dist/index.js
   ```

## Security

### Rate Limiting

- Global: 100 requests/minute per IP
- Checkout: 10 requests/15 minutes per IP
- Auth: 5 requests/15 minutes per IP
- API: 100 requests/minute per IP

### Fraud Detection

The system includes fraud detection that flags:
- Rapid order creation
- Unusual payment amounts
- VPN/proxy usage
- Disposable email addresses
- High item counts

### Input Sanitization

All user input is sanitized:
- HTML tags stripped
- Script tags removed
- Maximum field lengths enforced
- SQL injection prevention (via Prisma)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support, join our Discord server or open an issue.
