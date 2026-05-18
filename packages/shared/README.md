# @nosmarket/shared

Shared package for **Nos Market** — a gaming marketplace monorepo featuring:

- Discord OAuth authentication
- PayPal/CashApp/Litecoin payments
- Wallet system with balance management
- Delivery slot booking
- Admin dashboard

## Features

- **Prisma Schema** — Complete PostgreSQL database schema with 20+ models
- **Zod Schemas** — Comprehensive validation for all API inputs/outputs
- **TypeScript Types** — Fully typed with Prisma client integration
- **Constants** — Application-wide constants for pricing, timeouts, rate limits

## Installation

```bash
npm install @nosmarket/shared
# or
pnpm add @nosmarket/shared
```

## Usage

### Prisma Schema

Generate the Prisma client:

```bash
npm run prisma:generate
```

Then import the client in your application:

```typescript
import { PrismaClient } from '@prisma/client';
import { prisma } from '@nosmarket/shared/prisma';

// Use the singleton instance
const user = await prisma.user.findUnique({
  where: { discordId: '123456789' }
});
```

### Zod Schemas

Import and use validation schemas:

```typescript
import {
  CheckoutRequestSchema,
  OrderCreateSchema,
  ProductCreateSchema,
  PaymentWebhookPayloadSchema,
} from '@nosmarket/shared';

import { z } from 'zod';

// Validate checkout request
const checkoutData = CheckoutRequestSchema.parse(requestBody);

// Validate with custom error messages
const result = ProductCreateSchema.safeParse(data);
if (!result.success) {
  console.error(result.error.format());
}
```

### TypeScript Types

Import shared types:

```typescript
import type {
  Order,
  OrderItem,
  Product,
  User,
  WalletTransaction,
  ApiResponse,
  PaginatedResponse,
  CartItem,
  CheckoutFlowState,
} from '@nosmarket/shared';
```

### Constants

Access application constants:

```typescript
import {
  BULK_DISCOUNT_THRESHOLD,
  MAX_UI_QUANTITY,
  SESSION_EXPIRY_SECONDS,
  DISCORD_OAUTH_SCOPES,
  PAYMENT_METHODS,
  ERROR_CODES,
} from '@nosmarket/shared';

console.log(BULK_DISCOUNT_THRESHOLD); // 10
console.log(PAYMENT_METHODS); // ['PAYPAL_FF', 'CASHAPP', 'LTC', 'WALLET', 'PAYPAL_REST']
```

## Package Structure

```
packages/shared/
├── prisma/
│   └── schema.prisma      # PostgreSQL database schema
├── src/
│   ├── index.ts          # Main exports (types, Prisma)
│   ├── schemas.ts        # Zod validation schemas
│   └── constants.ts      # Application constants
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

## Database Models

| Model | Description |
|-------|-------------|
| `User` | Discord users with wallet balance |
| `Session` | User sessions with token management |
| `Game` | Game catalog entries |
| `Category` | Product categories |
| `Product` | Items available for purchase |
| `Order` | Customer orders with full lifecycle |
| `OrderItem` | Individual items within an order |
| `DeliverySlot` | Bookable delivery time slots |
| `WalletTransaction` | Wallet deposits and purchases |
| `PaymentAttempt` | Payment attempt records |
| `DeliveryProof` | Proof of delivery with images |
| `Ticket` | Support tickets |
| `TicketMessage` | Messages within tickets |
| `Coupon` | Discount codes |
| `ShopConfig` | Shop configuration (banners, etc.) |
| `AdminLog` | Admin action audit trail |
| `AuditLog` | General audit trail |
| `FraudCase` | Fraud detection cases |
| `Notification` | User notifications |
| `Blacklist` | Blocked IPs/discords |
| `ApiKey` | API key authentication |
| `WebhookLog` | Webhook event logging |
| `Counter` | Sequence counters |

## Enums

```typescript
// Order & Payment
OrderStatus: PENDING | WAITING_PAYMENT | COMPLETED | CANCELLED
PaymentStatus: PENDING | PAID | CANCELLED
PaymentMethod: PAYPAL_FF | CASHAPP | LTC | WALLET | PAYPAL_REST

// Wallet
WalletTransactionType: TOPUP | PURCHASE | ADJUSTMENT | REFUND
WalletTransactionStatus: PENDING | COMPLETED | REJECTED | CANCELLED
WalletTransactionDirection: CREDIT | DEBIT

// Tickets
TicketStatus: PENDING | CREATING | CREATED | READY | FAILED | PANEL | OPEN | CLOSED | ARCHIVED
TicketType: PAYMENT | DELIVERY | WALLET_TOPUP | SUPPORT

// Other
NotificationType: ORDER_UPDATE | PAYMENT_CONFIRMED | DELIVERY_READY | VOUCH_POSTED | SYSTEM
FraudStatus: OPEN | REVIEWED | CLEARED | FLAGGED
BlacklistType: IP | DISCORD_ID | EMAIL
```

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)
- pnpm (recommended) or npm

### Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Push schema to database
pnpm prisma:push

# Run migrations
pnpm prisma:migrate

# Build the package
pnpm build

# Type checking
pnpm typecheck

# Run tests
pnpm test
```

### Scripts

| Script | Description |
|--------|-------------|
| `build` | Build the package with tsup |
| `dev` | Watch mode for development |
| `typecheck` | Run TypeScript type checking |
| `lint` | Run ESLint |
| `format` | Format code with Prettier |
| `test` | Run tests with Vitest |
| `prisma:generate` | Generate Prisma client |
| `prisma:push` | Push schema to database |
| `prisma:migrate` | Run migrations |
| `prisma:studio` | Open Prisma Studio |
| `prisma:validate` | Validate schema |
| `prisma:format` | Format schema |

## Monorepo Structure

```
nos-market/
├── apps/
│   ├── web/           # Next.js 14 frontend
│   └── api/           # NestJS backend
├── packages/
│   └── shared/         # This package
├── services/
│   └── bot/            # Discord bot
└── infrastructure/
    └── docker/         # Docker configuration
```

## License

MIT
