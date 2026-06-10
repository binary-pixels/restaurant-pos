import { create } from "zustand";

type CartItem = {
  key: string; // unique key for cart (productId + spec combination)
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  specSnapshot?: string;
  note?: string;
};

type DiscountInput = {
  type: "PERCENTAGE" | "FIXED";
  name: string;
  value: number; // percentage (e.g. 20 = 20%) or amount
};

type PosState = {
  // Table
  selectedTableId: string | null;
  selectedTableLabel: string | null;

  // Order type
  orderType: "DINE_IN" | "TAKEOUT" | "DELIVERY";

  // Cart
  cart: CartItem[];
  guestCount: number;
  orderNote: string;

  // Discount
  discount: DiscountInput | null;

  // Payment
  paymentMethod: string;
  paymentAmount: string; // received amount (for cash payment)

  // Actions
  setSelectedTable: (id: string | null, label?: string | null) => void;
  setOrderType: (type: "DINE_IN" | "TAKEOUT" | "DELIVERY") => void;
  addToCart: (item: Omit<CartItem, "key">) => void;
  updateQuantity: (productId: string, specSnapshot: string | undefined, quantity: number) => void;
  removeFromCart: (productId: string, specSnapshot: string | undefined) => void;
  clearCart: () => void;
  setGuestCount: (count: number) => void;
  setOrderNote: (note: string) => void;
  setDiscount: (discount: DiscountInput | null) => void;
  setPaymentMethod: (method: string) => void;
  setPaymentAmount: (amount: string) => void;
  reset: () => void;
};

function cartKey(productId: string, specSnapshot?: string): string {
  return `${productId}_${specSnapshot || "default"}`;
}

export const usePosStore = create<PosState>((set, get) => ({
  selectedTableId: null,
  selectedTableLabel: null,
  orderType: "DINE_IN",
  cart: [],
  guestCount: 1,
  orderNote: "",
  discount: null,
  paymentMethod: "CASH",
  paymentAmount: "",

  setSelectedTable: (id, label) =>
    set({ selectedTableId: id, selectedTableLabel: label || null }),

  setOrderType: (type) => set({ orderType: type }),

  addToCart: (item) =>
    set((state) => {
      const key = cartKey(item.productId, item.specSnapshot);
      const existing = state.cart.find((c) => c.key === key);
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.key === key ? { ...c, quantity: c.quantity + item.quantity } : c
          ),
        };
      }
      return { cart: [...state.cart, { ...item, key }] };
    }),

  updateQuantity: (productId, specSnapshot, quantity) =>
    set((state) => {
      const key = cartKey(productId, specSnapshot);
      if (quantity <= 0) {
        return { cart: state.cart.filter((c) => c.key !== key) };
      }
      return {
        cart: state.cart.map((c) =>
          c.key === key ? { ...c, quantity } : c
        ),
      };
    }),

  removeFromCart: (productId, specSnapshot) =>
    set((state) => {
      const key = cartKey(productId, specSnapshot);
      return { cart: state.cart.filter((c) => c.key !== key) };
    }),

  clearCart: () => set({ cart: [], discount: null, orderNote: "", guestCount: 1 }),

  setGuestCount: (count) => set({ guestCount: count }),
  setOrderNote: (note) => set({ orderNote: note }),
  setDiscount: (discount) => set({ discount }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setPaymentAmount: (amount) => set({ paymentAmount: amount }),

  reset: () =>
    set({
      selectedTableId: null,
      selectedTableLabel: null,
      cart: [],
      guestCount: 1,
      orderNote: "",
      discount: null,
      paymentMethod: "CASH",
      paymentAmount: "",
    }),
}));

// Selectors
export const selectCartSubtotal = (state: PosState) =>
  state.cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

export const selectDiscountAmount = (state: PosState) => {
  if (!state.discount) return 0;
  const subtotal = selectCartSubtotal(state);
  if (state.discount.type === "PERCENTAGE") {
    return subtotal * (state.discount.value / 100);
  }
  return state.discount.value;
};

export const selectCartTotal = (state: PosState) => {
  const subtotal = selectCartSubtotal(state);
  const discount = selectDiscountAmount(state);
  return Math.max(0, subtotal - discount);
};

export const selectCartCount = (state: PosState) =>
  state.cart.reduce((sum, item) => sum + item.quantity, 0);
