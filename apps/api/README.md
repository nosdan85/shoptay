# Nos Market API

Gaming Marketplace Backend built with NestJS.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

### Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Development

```bash
# Start in watch mode
npm run dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:3001/docs
- Health Check: http://localhost:3001/api

## Project Structure

```
apps/api/
├── src/
│   ├── main.ts           # Application bootstrap
│   ├── app.module.ts     # Root module
│   ├── common/          # Shared utilities
│   │   ├── decorators/  # Custom decorators
│   │   ├── filters/     # Exception filters
│   │   ├── guards/      # Auth guards
│   │   ├── interceptors/ # Request/response interceptors
│   │   └── middleware/   # Custom middleware
│   ├── prisma/          # Database service
│   ├── auth/            # Authentication
│   ├── users/           # User management
│   ├── products/        # Products & categories
│   ├── orders/          # Order management
│   ├── payments/        # Payment processing
│   ├── wallet/          # Wallet system
│   ├── delivery-slots/   # Delivery scheduling
│   ├── config/          # Shop configuration
│   ├── media/           # File uploads
│   ├── admin/           # Admin dashboard
│   ├── realtime/        # WebSocket gateway
│   └── tickets/         # Support tickets
└── prisma/
    └── schema.prisma    # Database schema
```

## License

MIT
