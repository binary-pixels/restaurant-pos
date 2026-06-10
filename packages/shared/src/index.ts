// ==================== Shared Constants ====================

export const ORDER_STATUS_MAP = {
  PENDING: { label: "待确认", labelEn: "Pending", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "已确认", labelEn: "Confirmed", color: "bg-blue-100 text-blue-800" },
  PREPARING: { label: "制作中", labelEn: "Preparing", color: "bg-orange-100 text-orange-800" },
  SERVED: { label: "已上菜", labelEn: "Served", color: "bg-green-100 text-green-800" },
  COMPLETED: { label: "已完成", labelEn: "Completed", color: "bg-gray-100 text-gray-800" },
  CANCELLED: { label: "已取消", labelEn: "Cancelled", color: "bg-red-100 text-red-800" },
  REFUNDED: { label: "已退款", labelEn: "Refunded", color: "bg-purple-100 text-purple-800" },
} as const;

export const TABLE_STATUS_MAP = {
  AVAILABLE: { label: "空闲", labelEn: "Available", color: "bg-green-500" },
  OCCUPIED: { label: "用餐中", labelEn: "Occupied", color: "bg-red-500" },
  RESERVED: { label: "已预约", labelEn: "Reserved", color: "bg-blue-500" },
  CLEANING: { label: "清洁中", labelEn: "Cleaning", color: "bg-yellow-500" },
  DISABLED: { label: "已停用", labelEn: "Disabled", color: "bg-gray-400" },
} as const;

export const PAYMENT_METHOD_MAP = {
  CASH: { label: "现金", labelEn: "Cash", icon: "💵" },
  WECHAT_QR: { label: "微信支付", labelEn: "WeChat Pay", icon: "💚" },
  WECHAT_JSAPI: { label: "微信JSAPI", labelEn: "WeChat JSAPI", icon: "💚" },
  ALIPAY_QR: { label: "支付宝", labelEn: "Alipay", icon: "💙" },
  CARD: { label: "银行卡", labelEn: "Card", icon: "💳" },
  MEMBER_BALANCE: { label: "会员余额", labelEn: "Balance", icon: "🪙" },
} as const;

export const USER_ROLE_MAP = {
  SUPER_ADMIN: { label: "超级管理员", labelEn: "Super Admin" },
  STORE_ADMIN: { label: "门店管理员", labelEn: "Store Admin" },
  CASHIER: { label: "收银员", labelEn: "Cashier" },
  KITCHEN: { label: "后厨", labelEn: "Kitchen" },
  WAITER: { label: "服务员", labelEn: "Waiter" },
} as const;

export const MEMBER_TIER_MAP = {
  REGULAR: { label: "普通会员", labelEn: "Regular" },
  SILVER: { label: "银卡会员", labelEn: "Silver" },
  GOLD: { label: "金卡会员", labelEn: "Gold" },
  DIAMOND: { label: "钻石会员", labelEn: "Diamond" },
} as const;

export const ORDER_TYPE_MAP = {
  DINE_IN: { label: "堂食", labelEn: "Dine-in" },
  TAKEOUT: { label: "自取", labelEn: "Takeout" },
  DELIVERY: { label: "配送", labelEn: "Delivery" },
} as const;

// ==================== Types ====================

export interface OrderItemInput {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  specSnapshot?: string;
  note?: string;
}

export interface CreateOrderInput {
  storeId: string;
  type: "DINE_IN" | "TAKEOUT" | "DELIVERY";
  tableId?: string;
  customerId?: string;
  cashierId: string;
  items: OrderItemInput[];
  discountType?: "PERCENTAGE" | "FIXED" | "MANUAL";
  discountValue?: number;
  discountName?: string;
  note?: string;
  guestCount?: number;
}

export interface PaymentInput {
  orderId: string;
  method: string;
  amount: number;
}

// ==================== Helpers ====================

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `¥${num.toFixed(2)}`;
}

export function generateOrderNo(date: Date, seq: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `ORD-${y}${m}${d}-${String(seq).padStart(4, "0")}`;
}
