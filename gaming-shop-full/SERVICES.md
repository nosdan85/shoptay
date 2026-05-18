# Nos Market - Services Documentation

## Service URLs

### Development

| Service | URL | Description |
|---------|-----|-------------|
| Web Frontend | http://localhost:3000 | Next.js application |
| API Server | http://localhost:3001 | NestJS REST API |
| API Docs | http://localhost:3001/api/docs | Swagger documentation |
| Prisma Studio | http://localhost:5555 | Database GUI |
| Grafana | http://localhost:3002 | Metrics dashboards |
| Prometheus | http://localhost:9090 | Metrics collection |

### Production

| Service | URL | Description |
|---------|-----|-------------|
| Web Frontend | https://nosmarket.gg | Next.js application |
| API Server | https://api.nosmarket.gg | NestJS REST API |
| API Docs | https://api.nosmarket.gg/api/docs | Swagger documentation |
| Grafana | https://grafana.nosmarket.gg | Metrics dashboards |
| Prometheus | https://prometheus.nosmarket.gg | Metrics collection |

## Environment Variables Reference

### services/api/.env

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://user:password@host:5432/nosmarket

# ============================================
# REDIS
# ============================================
REDIS_URL=redis://host:6379
REDIS_PASSWORD=your-redis-password

# ============================================
# AUTHENTICATION
# ============================================
JWT_ACCESS_SECRET=your-32-char-minimum-access-secret
JWT_REFRESH_SECRET=your-32-char-minimum-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ============================================
# DISCORD OAUTH
# ============================================
DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_BOT_TOKEN=your-discord-bot-token
DISCORD_GUILD_ID=123456789012345678
DISCORD_INVITE_URL=https://discord.gg/your-invite

# Owner Configuration
OWNER_DISCORD_ID=123456789012345678
OWNER_ROLE_ID=123456789012345678

# ============================================
# PAYMENT PROVIDERS
# ============================================

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=live|sandbox

# Square (Cash App)
SQUARE_APPLICATION_ID=your-square-app-id
SQUARE_ACCESS_TOKEN=your-square-access-token
SQUARE_ENVIRONMENT=production|sandbox

# NOWPayments (Litecoin)
NOWPAYMENTS_API_KEY=your-nowpayments-api-key
NOWPAYMENTS_IPN_KEY=your-nowpayments-ipn-key

# ============================================
# URLS & DOMAINS
# ============================================
BASE_URL=https://nosmarket.gg
FRONTEND_URL=https://nosmarket.gg
API_URL=https://api.nosmarket.gg

# ============================================
# CORS & SECURITY
# ============================================
CORS_ORIGINS=https://nosmarket.gg,https://www.nosmarket.gg
FRAUD_BLOCK_THRESHOLD=80
FRAUD_WARN_THRESHOLD=50

# ============================================
# RATE LIMITING
# ============================================
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# ============================================
# FILE STORAGE
# ============================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
LOG_FORMAT=json

# ============================================
# NODE ENVIRONMENT
# ============================================
NODE_ENV=production
PORT=3001
```

### services/web/.env.local

```env
# ============================================
# API CONFIGURATION
# ============================================
NEXT_PUBLIC_API_URL=https://api.nosmarket.gg
NEXT_PUBLIC_APP_URL=https://nosmarket.gg

# ============================================
# DISCORD INTEGRATION
# ============================================
NEXT_PUBLIC_DISCORD_CLIENT_ID=123456789012345678
NEXT_PUBLIC_DISCORD_INVITE_URL=https://discord.gg/your-invite
NEXT_PUBLIC_DISCORD_VOUCH_URL=https://discord.gg/your-vouch-channel

# ============================================
# SITE CONFIGURATION
# ============================================
NEXT_PUBLIC_SITE_LOGO=/site-logo.png
NEXT_PUBLIC_SITE_NAME=Nos Market
NEXT_PUBLIC_SITE_DESCRIPTION=Gaming marketplace for Nos and more

# ============================================
# FEATURES
# ============================================
NEXT_PUBLIC_ENABLE_WALLET=true
NEXT_PUBLIC_ENABLE_CASHAPP=true
NEXT_PUBLIC_ENABLE_PAYPAL=true
NEXT_PUBLIC_ENABLE_LITECOIN=true
```

### services/bot/.env

```env
# ============================================
# DISCORD BOT
# ============================================
DISCORD_BOT_TOKEN=your-discord-bot-token
DISCORD_GUILD_ID=123456789012345678

# ============================================
# DATABASE & REDIS
# ============================================
DATABASE_URL=postgresql://user:password@host:5432/nosmarket
REDIS_URL=redis://host:6379
REDIS_PASSWORD=your-redis-password

# ============================================
# API CONNECTION
# ============================================
API_BASE_URL=https://api.nosmarket.gg

# ============================================
# DISCORD CHANNELS & ROLES
# ============================================
DISCORD_VOUCH_CHANNEL_ID=123456789012345678
OWNER_DISCORD_ID=123456789012345678
OWNER_ROLE_ID=123456789012345678
TICKET_CATEGORY_ID=123456789012345678

# ============================================
# BOT BEHAVIOR
# ============================================
DISCORD_TICKET_CREATE_MIN_GAP_MS=3500
DISCORD_ADDALL_CONCURRENCY=4
DISCORD_AUTO_VOUCH_ENABLED=true

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
LOG_FORMAT=json
```

## Database Schema Overview

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | Discord-linked user accounts |
| `sessions` | JWT session management |
| `products` | Product catalog items |
| `games` | Game categories |
| `categories` | Product categories per game |
| `orders` | Customer orders |
| `order_items` | Items within orders |
| `payments` | Payment records |
| `wallet` | User wallet balances |
| `transactions` | Wallet transaction history |
| `notifications` | User notifications |
| `audit_logs` | Admin action audit trail |

### Supporting Tables

| Table | Description |
|-------|-------------|
| `coupons` | Discount codes |
| `delivery_slots` | Available delivery times |
| `tickets` | Support tickets |
| `ticket_messages` | Ticket conversation |
| `delivery_proofs` | Delivery proof images |
| `shop_config` | Shop configuration |
| `notifications` | In-app notifications |

## API Rate Limits

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| Global (default) | 100 | 1 minute |
| Checkout | 10 | 15 minutes |
| Discord Auth | 5 | 15 minutes |
| Payment Creation | 5 | 15 minutes |
| API General | 100 | 1 minute |

## WebSocket Events

### Client to Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ room: string }` | Join a room |
| `leave_room` | `{ room: string }` | Leave a room |
| `subscribe_orders` | `{}` | Subscribe to order updates |
| `subscribe_notifications` | `{}` | Subscribe to notifications |

### Server to Client

| Event | Payload | Description |
|-------|---------|-------------|
| `order_created` | `Order` | New order created |
| `order_updated` | `{ orderId, status }` | Order status changed |
| `payment_confirmed` | `{ orderId }` | Payment received |
| `delivery_ready` | `{ orderId }` | Order ready for delivery |
| `notification` | `Notification` | New notification |
| `stock_updated` | `{ productId, stock }` | Stock level changed |

## Cron Jobs

The API runs several scheduled tasks:

| Job | Schedule | Description |
|-----|----------|-------------|
| `CleanupExpiredSessions` | Every hour | Remove expired sessions |
| `DeleteOldNotifications` | Daily at 3 AM | Remove read notifications older than 30 days |
| `ProcessPendingPayments` | Every 5 minutes | Check for pending payment confirmations |
| `SyncDiscordMembers` | Every hour | Sync guild member list |
| `GenerateReports` | Daily at midnight | Generate daily analytics |

## Error Codes

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Duplicate resource |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Application Error Codes

| Code | Message | Description |
|------|---------|-------------|
| `ORDER_NOT_FOUND` | Order not found | Invalid order ID |
| `PRODUCT_OUT_OF_STOCK` | Product out of stock | Insufficient inventory |
| `PAYMENT_FAILED` | Payment processing failed | Payment provider error |
| `DISCORD_RATE_LIMIT` | Discord API rate limited | Try again later |
| `INVALID_COUPON` | Invalid or expired coupon | Coupon validation failed |
| `FRAUD_DETECTED` | Transaction blocked | Fraud check triggered |
| `USER_NOT_IN_GUILD` | User must join Discord | Guild membership required |

## Redis Cache Keys

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `cache:products:all` | 5 min | All products |
| `cache:products:game:{id}` | 5 min | Products by game |
| `cache:products:category:{id}` | 5 min | Products by category |
| `cache:games:all` | 10 min | All games |
| `cache:config:shop` | 5 min | Shop configuration |
| `cache:config:banners` | 5 min | Banner images |
| `rate:checkout:{ip}` | 15 min | Checkout rate limit |
| `rate:api:{ip}` | 15 min | API rate limit |
| `session:{token}` | 7 days | User session data |

## Discord Bot Commands

### User Commands

| Command | Description |
|---------|-------------|
| `/ticket create` | Open a support ticket |
| `/ticket close` | Close your ticket |
| `/verify` | Verify your account |

### Staff Commands

| Command | Description |
|---------|-------------|
| `/order status` | Check order status |
| `/order deliver` | Mark order delivered |
| `/order confirm` | Request customer confirmation |
| `/addall` | Add all linked users to server |
| `/reload` | Reload bot configuration |

### Button Interactions

| Button ID | Action |
|-----------|--------|
| `copy_paypal_email_{orderId}` | Copy PayPal email |
| `copy_paypal_item_{orderId}` | Copy PayPal payment note |
| `copy_cashapp_tag_{orderId}` | Copy CashApp tag |
| `copy_ltc_wallet_{orderId}` | Copy Litecoin address |
| `confirm_delivery_{orderId}` | Confirm delivery |
| `close_ticket_{ticketId}` | Close ticket |

## Monitoring Metrics

### API Metrics

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency histogram
- `http_requests_in_flight` - Current concurrent requests
- `db_query_duration_seconds` - Database query latency
- `redis_operations_total` - Redis operation count
- `fraud_checks_total` - Fraud check results

### Business Metrics

- `orders_created_total` - Total orders created
- `orders_completed_total` - Total completed orders
- `payments_received_total` - Payment amounts
- `active_users_total` - Active users count
- `tickets_open_total` - Open support tickets

### System Metrics

- `process_cpu_seconds_total` - CPU usage
- `process_resident_memory_bytes` - Memory usage
- `nodejs_eventloop_lag_seconds` - Event loop lag
