// ============================================================================
// WALLET TYPES
// ============================================================================

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  balanceCents: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  amountCents: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  orderId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface Topup {
  id: string;
  userId: string;
  walletId?: string;
  amount: number;
  amountCents: number;
  method: PaymentMethod;
  status: PaymentStatus;
  squarePaymentId?: string | null;
  squareStatus?: string | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TopupWithUser extends Topup {
  user?: {
    id: string;
    username: string;
    discordId: string;
    avatar?: string | null;
  };
  referenceCode?: string;
}

export interface WalletWithTransactions extends Wallet {
  transactions: WalletTransaction[];
  pendingTopups: Topup[];
}

export interface CreateTopupRequest {
  amount: number;
  method: 'PAYPAL' | 'CASHAPP' | 'SQUARE' | 'LITECOIN';
}

export interface CreateTopupResponse {
  topup: Topup;
  instructions: PaymentInstructions;
  squareConfig?: {
    applicationId: string;
    locationId: string;
    environment: string;
  };
}

export interface PaymentInstructions {
  paypal_ff?: {
    destination: string;
    memoExpected: string;
    type: 'paypal_ff';
  };
  cashapp?: {
    handle: string;
    referenceId: string;
    type: 'cashapp';
  };
  ltc?: {
    payAddress: string;
    payAmount: string;
    payCurrency: string;
    qrImageUrl: string;
    type: 'ltc';
  };
}

export interface CompleteTopupRequest {
  squarePaymentId?: string;
}

export interface AdjustBalanceRequest {
  userId: string;
  amountCents: number;
  note?: string;
}

export interface AdjustBalanceResponse {
  success: boolean;
  userId: string;
  previousBalance: number;
  adjustment: number;
  newBalance: number;
  note?: string;
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface AdminDashboardStats {
  revenue: {
    total: number;
    currency: string;
    completedOrders: number;
  };
  orders: {
    total: number;
    pending: number;
    paid: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
  users: {
    total: number;
    linkedDiscord: number;
  };
  pendingTopups: {
    count: number;
    totalAmount: number;
  };
  products: {
    total: number;
    active: number;
    outOfStock: number;
  };
  recentOrders: AdminRecentOrder[];
  topupStats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    recentAmount: number;
    totalAmount: number;
  };
}

export interface AdminRecentOrder {
  id: string;
  orderNumber: string;
  discordUsername: string | null;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: Date;
}

export interface AdminOrder extends Order {
  user?: {
    id: string;
    username: string;
    discordId: string;
  };
  items: AdminOrderItem[];
  adminNotes?: string | null;
}

export interface AdminOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AdminUser {
  id: string;
  discordId: string | null;
  username: string;
  email: string | null;
  avatar: string | null;
  role: UserRole;
  createdAt: Date;
  lastLoginAt: Date | null;
  orderCount: number;
  wallet?: {
    id: string;
    balance: number;
    balanceCents: number;
  };
  recentOrders?: AdminRecentOrder[];
  recentTopups?: TopupSummary[];
}

export interface TopupSummary {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: Date;
}

export interface AdminTopup extends Topup {
  user?: {
    id: string;
    username: string;
    discordId: string;
  };
  referenceCode?: string;
}

export interface AdminProductsOverview {
  total: number;
  active: number;
  inactive: number;
  outOfStock: number;
}

// Admin Order statuses for filtering
export type AdminOrderStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface AdminOrderFilters {
  page?: number;
  limit?: number;
  status?: AdminOrderStatus;
  search?: string;
}

export interface AdminTopupFilters {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  method?: PaymentMethod;
}

// Enum re-exports for convenience
export type {
  TransactionType,
  PaymentStatus,
  PaymentMethod,
  UserRole,
  OrderStatus,
} from '@prisma/client';
