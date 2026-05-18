# Nos Market Discord Bot

A production-ready Discord bot for the Nos Market gaming marketplace, built with discord.js v14 and TypeScript.

## Features

- **Ticket System** - Create, manage, and close support tickets
- **Payment Integration** - PayPal, Cash App, and Litecoin payment support
- **Wallet Management** - View balance and transaction history
- **Auto-Vouch** - Automatic vouch posting when staff uploads images
- **Guild Sync** - Add all linked users to the Discord server
- **Order Tracking** - Check order status and delivery information
- **Verification** - Link Discord accounts with Nos Market

## Requirements

- Node.js 18+
- npm or yarn
- A Discord Bot Token
- Access to the Nos Market API

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment file and configure:

```bash
cp .env.example .env.local
```

4. Edit `.env.local` with your configuration:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_guild_id
OWNER_ROLE_ID=your_owner_role_id
OWNER_IDS=your_discord_id_1,your_discord_id_2
VOUCH_CHANNEL_ID=your_vouch_channel_id
TICKET_CATEGORY_ID=your_ticket_category_id
OWNER_TIMEZONE=UTC
API_BASE_URL=http://localhost:3001
ENCRYPTION_KEY=your_32_char_encryption_key
DISCORD_TICKET_CREATE_MIN_GAP_MS=3500
DISCORD_ADDALL_CONCURRENCY=4
LOG_LEVEL=info
```

## Development

Build the TypeScript code:

```bash
npm run build
```

Run in development mode with watch:

```bash
npm run dev
```

Run in production:

```bash
npm start
```

## Commands

### General Commands

| Command | Description |
|---------|-------------|
| `/ticket create` | Create a new support ticket |
| `/ticket close` | Close the current ticket |
| `/ticket list` | List your tickets |
| `/verify` | Link your Discord account |
| `/order status <id>` | Check order status |
| `/order info` | View your order history |
| `/stock [product]` | Check product availability |
| `/wallet balance` | View wallet balance |
| `/wallet history` | View transaction history |
| `/stats` | View market statistics |

### Staff Commands

| Command | Description |
|---------|-------------|
| `/addall` | Add all linked users to the server |
| `/reload` | Reload bot commands |
| `/config` | View bot configuration |

### Text Commands (in tickets)

| Command | Description |
|---------|-------------|
| `!close` | Close the ticket |
| `!done` | Mark order as completed |
| `!confirm` | Request customer confirmation |

## Project Structure

```
services/bot/
├── src/
│   ├── index.ts           # Entry point
│   ├── bot.ts             # Client setup
│   ├── config/            # Configuration
│   │   ├── index.ts       # Env config loader
│   │   └── constants.ts   # Permission bits, colors, limits
│   ├── types/             # TypeScript types
│   ├── commands/           # Slash commands
│   │   ├── index.ts
│   │   ├── ticket.ts
│   │   ├── verify.ts
│   │   ├── order.ts
│   │   ├── stock.ts
│   │   ├── wallet.ts
│   │   ├── stats.ts
│   │   └── admin/
│   ├── components/        # Button/select/modal handlers
│   │   ├── buttons/
│   │   ├── selectMenus/
│   │   └── modals/
│   ├── services/          # Business logic
│   │   ├── TicketService.ts
│   │   ├── VerificationService.ts
│   │   ├── VouchService.ts
│   │   ├── GuildSyncService.ts
│   │   └── EmbedService.ts
│   ├── embeds/            # Embed builders
│   ├── events/            # Discord events
│   └── utils/             # Utilities
└── package.json
```

## Button IDs

### Copy Buttons
- `copy_paypal_email_{orderId}` - Copy PayPal email
- `copy_paypal_item_{orderId}` - Copy PayPal item name
- `copy_cashapp_tag_{orderId}` - Copy CashApp tag
- `copy_cashapp_item_{orderId}` - Copy CashApp item name
- `copy_ltc_wallet_{orderId}` - Copy Litecoin address

### Ticket Actions
- `ticket_confirm_{orderId}` - Request confirmation
- `ticket_done_{orderId}` - Mark as completed
- `ticket_close_{orderId}` - Close ticket

### Payment Selection
- `payment_select_paypal_{orderId}` - Select PayPal
- `payment_select_cashapp_{orderId}` - Select Cash App
- `payment_select_ltc_{orderId}` - Select Litecoin

## Auto-Vouch

When staff uploads images in a ticket channel, the bot will:
1. Download the images (up to 10 per batch)
2. Post them to the vouch channel with formatted content
3. Reply in the ticket confirming the vouch was posted

## Rate Limiting

- Ticket creation: 3500ms minimum gap between creates (configurable)
- AddAll: 4 concurrent operations (configurable)
- API calls: Standard rate limiting with retries

## Error Handling

The bot implements exponential backoff for retries:
- Max retries: 2
- Base delay: 800ms
- Max delay: 10000ms

Special handling for:
- 429 (Rate Limited) - Respect Retry-After header
- 403 (Cloudflare) - Retry after 30s
- 500/503 (Server Error) - Retry with backoff

## License

MIT
