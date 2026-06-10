"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { usePosStore, selectCartTotal, selectCartCount, selectCartSubtotal } from "@/stores/pos-store";
import { createOrder, payOrder, closeOrder } from "@/actions/order-actions";
import { ProductGrid } from "./product-grid";
import { OrderCart } from "./order-cart";
import { PaymentPanel } from "./payment-panel";
import { cn } from "@/lib/utils";
import { ArrowLeftRight } from "lucide-react";

type Props = { zones: any[]; categories: any[]; storeId: string; cashierId: string };

export function PosScreen({ zones, categories, storeId, cashierId }: Props) {
  const t = useTranslations("pos");
  const locale = useLocale();
  const router = useRouter();
  const store = usePosStore();
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const subtotal = usePosStore(selectCartSubtotal);
  const total = usePosStore(selectCartTotal);
  const cartCount = usePosStore(selectCartCount);

  const handleOrderTypeChange = useCallback(
    (type: "DINE_IN" | "TAKEOUT" | "DELIVERY") => {
      store.setOrderType(type);
      if (type !== "DINE_IN") store.setSelectedTable(null, null);
    },
    [store]
  );

  const handleCheckout = useCallback(async () => {
    if (cartCount === 0) return;
    if (store.orderType === "DINE_IN" && !store.selectedTableId) return;
    setShowPayment(true);
  }, [cartCount, store.orderType, store.selectedTableId]);

  const handlePay = useCallback(
    async (method: string, amount: number) => {
      setProcessing(true);
      try {
        const discount = store.discount;
        const order = await createOrder({
          storeId,
          type: store.orderType,
          tableId: store.selectedTableId || undefined,
          cashierId,
          items: store.cart.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            specSnapshot: item.specSnapshot || undefined,
            note: item.note || undefined,
          })),
          discount: discount ? { type: discount.type, name: discount.name, value: discount.value } : undefined,
          note: store.orderNote || undefined,
          guestCount: store.guestCount,
        });

        await payOrder({ orderId: order.id, method, amount });
        await closeOrder(order.id);

        // Auto-print ticket
        window.open("/api/print?orderId=" + order.id + "&format=html", "_blank");

        store.reset();
        setShowPayment(false);
        router.refresh();
      } catch (err) {
        console.error("Payment failed:", err);
      } finally {
        setProcessing(false);
      }
    },
    [store, storeId, cashierId, router]
  );

  const allTables = zones.flatMap((z: any) =>
    z.tables.map((t: any) => ({ ...t, zoneName: z.name }))
  );

  const availableTables = allTables.filter(
    (t: any) => t.status === "AVAILABLE" && t.id !== store.selectedTableId
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-0 -mx-6">
      {/* LEFT: Table Selection */}
      <div className="w-56 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-3 border-b border-gray-200">
          <div className="flex rounded-lg bg-gray-100 p-1">
            {(["DINE_IN", "TAKEOUT", "DELIVERY"] as const).map((type) => (
              <button key={type} onClick={() => handleOrderTypeChange(type)}
                className={cn("flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                  store.orderType === type ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {type === "DINE_IN" ? "堂食" : type === "TAKEOUT" ? "自取" : "配送"}
              </button>
            ))}
          </div>
        </div>

        {store.orderType === "DINE_IN" && (
          <div className="p-3">
            {zones.map((zone: any) => (
              <div key={zone.id} className="mb-4">
                <h3 className="text-xs font-medium text-gray-400 uppercase mb-2">{zone.name}</h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {zone.tables.map((table: any) => (
                    <button key={table.id} onClick={() => store.setSelectedTable(table.id, table.label)}
                      className={cn("py-2 text-center text-xs font-medium rounded-lg border transition-colors",
                        store.selectedTableId === table.id ? "bg-blue-600 text-white border-blue-600" :
                        table.status === "AVAILABLE" ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" :
                        table.status === "OCCUPIED" ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-gray-50 text-gray-500 border-gray-200"
                      )}
                    >
                      {table.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CENTER: Product Grid */}
      <div className="flex-1 overflow-hidden">
        <ProductGrid
          categories={categories}
          onProductClick={(product) => {
            store.addToCart({
              productId: product.id,
              productName: product.name,
              quantity: 1,
              unitPrice: product.price,
            });
          }}
        />
      </div>

      {/* RIGHT: Order Cart */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {store.orderType === "DINE_IN" && store.selectedTableLabel
                ? `桌台 ${store.selectedTableLabel}`
                : store.orderType === "TAKEOUT" ? "自取订单" : "配送订单"}
            </h3>
            <span className="text-sm text-gray-500">{store.guestCount}人</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <OrderCart onTransferTable={() => setShowTransfer(true)} />
        </div>

        <div className="border-t border-gray-200 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t("subtotal")}</span>
            <span className="text-gray-900">¥{subtotal.toFixed(2)}</span>
          </div>
          {store.discount && (
            <div className="flex justify-between text-sm text-red-600">
              <span>{store.discount.name}</span>
              <span>-¥{(subtotal - total).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>{t("total")}</span>
            <span>¥{total.toFixed(2)}</span>
          </div>
          <button onClick={handleCheckout}
            disabled={cartCount === 0 || (store.orderType === "DINE_IN" && !store.selectedTableId)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
          >
            {t("checkout")} ({cartCount})
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentPanel total={total} onPay={handlePay} onClose={() => setShowPayment(false)} processing={processing} />
      )}

      {/* Transfer Table Modal */}
      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowTransfer(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5" /> 转桌
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              当前桌台: <strong>{store.selectedTableLabel}</strong>
            </p>
            {availableTables.length === 0 ? (
              <p className="text-center py-4 text-gray-400">没有空闲桌台可转</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableTables.map((t: any) => (
                  <button key={t.id} onClick={() => { store.setSelectedTable(t.id, t.label); setShowTransfer(false); }}
                    className="py-3 text-center text-sm font-medium rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowTransfer(false)} className="mt-4 w-full py-2 text-sm bg-gray-100 rounded-lg">取消</button>
          </div>
        </div>
      )}
    </div>
  );
}
