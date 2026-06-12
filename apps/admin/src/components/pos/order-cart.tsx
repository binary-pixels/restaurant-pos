"use client";

import { useState } from "react";
import { Plus, Minus, Trash2, Edit3, Gift, Package, Clock, ArrowLeftRight } from "lucide-react";
import { usePosStore } from "@/stores/pos-store";
import { cn } from "@/lib/utils";

type Props = {
  onTransferTable?: () => void;
};

export function OrderCart({ onTransferTable }: Props) {
  const cart = usePosStore((s) => s.cart);
  const updateQuantity = usePosStore((s) => s.updateQuantity);
  const removeFromCart = usePosStore((s) => s.removeFromCart);
  const guestCount = usePosStore((s) => s.guestCount);
  const setGuestCount = usePosStore((s) => s.setGuestCount);
  const orderNote = usePosStore((s) => s.orderNote);
  const setOrderNote = usePosStore((s) => s.setOrderNote);
  const discount = usePosStore((s) => s.discount);
  const setDiscount = usePosStore((s) => s.setDiscount);
  const orderType = usePosStore((s) => s.orderType);
  const selectedTableLabel = usePosStore((s) => s.selectedTableLabel);
  const addToCart = usePosStore((s) => s.addToCart);

  const store = usePosStore;
  const itemNotes = usePosStore((s) => s.itemNotes);
  const setItemNoteAction = usePosStore((s) => s.setItemNote);

  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [itemNote, setItemNote] = useState("");
  const [showTempItem, setShowTempItem] = useState(false);
  const [tempItem, setTempItem] = useState({ name: "", price: 0 });

  function saveItemNote(key: string) {
    setItemNoteAction(key, itemNote.trim() || "");
    setEditingNote(null);
  }

  function addTempItem() {
    if (!tempItem.name || tempItem.price <= 0) return;
    addToCart({
      productId: `temp_${Date.now()}`,
      productName: `[临时] ${tempItem.name}`,
      quantity: 1,
      unitPrice: tempItem.price,
    });
    setTempItem({ name: "", price: 0 });
    setShowTempItem(false);
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-sm gap-3">
        <Package className="w-10 h-10 text-gray-300" />
        <p>购物车为空</p>
        <p className="text-xs">点击左侧菜品添加</p>
        <button onClick={() => setShowTempItem(true)} className="px-4 py-2 text-xs border border-dashed rounded-lg hover:border-blue-400 hover:text-blue-600">
          <Plus className="w-3 h-3 inline mr-1" />添加临时菜
        </button>
      </div>
    );
  }

  return (
    <div className="p-3">
      {/* Guest Count & Actions */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">人数</span>
          <button onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-50"><Minus className="w-3 h-3" /></button>
          <span className="w-6 text-center font-medium">{guestCount}</span>
          <button onClick={() => setGuestCount(guestCount + 1)} className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-50"><Plus className="w-3 h-3" /></button>
        </div>
        <div className="flex items-center gap-1">
          {orderType === "DINE_IN" && selectedTableLabel && onTransferTable && (
            <button onClick={onTransferTable} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="转桌">
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setShowTempItem(true)} className="p-1.5 text-gray-400 hover:text-orange-600 rounded" title="临时菜">
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1">
        {cart.map((item) => (
          <div key={item.key} className="py-2 border-b border-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", item.productId.startsWith("temp_") && "text-orange-600")}>
                  {item.productName}
                </p>
                {item.specSnapshot && <p className="text-xs text-gray-400">{item.specSnapshot}</p>}
                <p className="text-xs text-gray-500">¥{item.unitPrice.toFixed(2)} × {item.quantity}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQuantity(item.productId, item.specSnapshot, item.quantity - 1)} className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Minus className="w-3 h-3" /></button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, item.specSnapshot, item.quantity + 1)} className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Plus className="w-3 h-3" /></button>
                <button onClick={() => removeFromCart(item.productId, item.specSnapshot)} className="ml-1 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            {/* Item note */}
            {editingNote === item.key ? (
              <div className="mt-1 flex items-center gap-1">
                <input autoFocus value={itemNote} onChange={(e) => setItemNote(e.target.value)} placeholder="如: 少盐、不要香菜" className="flex-1 px-2 py-1 text-xs border rounded" onBlur={() => saveItemNote(item.key)} onKeyDown={(e) => e.key === "Enter" && saveItemNote(item.key)} />
              </div>
            ) : (
              <button onClick={() => { setEditingNote(item.key); setItemNote(itemNotes[item.key] || ""); }} className="mt-1 text-xs text-gray-400 hover:text-blue-600 flex items-center gap-0.5">
                <Edit3 className="w-3 h-3" /> {itemNotes[item.key] || "添加备注"}
              </button>
            )}
            {itemNotes[item.key] && editingNote !== item.key && (
              <p className="text-xs text-blue-600 mt-0.5">{itemNotes[item.key]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Coupon Code */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <input
            placeholder="优惠券码"
            className="flex-1 text-sm border rounded-lg px-2 py-1.5"
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                const code = (e.target as HTMLInputElement).value.trim();
                if (!code) return;
                const subtotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
                const res = await fetch("/api/coupons", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, orderTotal: subtotal }) });
                const data = await res.json();
                if (data.valid) {
                  setDiscount({ type: "FIXED", name: "券-" + code.slice(-4), value: data.discount });
                  (e.target as HTMLInputElement).value = "";
                } else {
                  alert(data.error || "无效券码");
                }
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="flex-1 text-sm border rounded-lg px-2 py-1.5" value={discount ? `${discount.type}:${discount.value}` : ""}
            onChange={(e) => {
              if (!e.target.value) { setDiscount(null); return; }
              const [type, val] = e.target.value.split(":");
              setDiscount({ type: type as any, name: type === "PERCENTAGE" ? "折扣" : "优惠", value: Number(val) });
            }}
          >
            <option value="">无优惠</option>
            <optgroup label="折扣">
              <option value="PERCENTAGE:10">9折 (10%)</option>
              <option value="PERCENTAGE:20">8折 (20%)</option>
              <option value="PERCENTAGE:15">85折 (15%)</option>
            </optgroup>
            <optgroup label="满减">
              <option value="FIXED:5">减 ¥5</option>
              <option value="FIXED:10">减 ¥10</option>
              <option value="FIXED:20">减 ¥20</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Order Note */}
      <div className="mt-3">
        <input value={orderNote} onChange={(e) => setOrderNote(e.target.value)} placeholder="整单备注..." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>

      {/* Temp Item Modal */}
      {showTempItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowTempItem(false)} />
          <div className="relative bg-white rounded-xl p-5 w-full max-w-xs z-10">
            <h4 className="font-semibold mb-3">临时菜</h4>
            <div className="space-y-3">
              <input value={tempItem.name} onChange={(e) => setTempItem({ ...tempItem, name: e.target.value })} placeholder="菜名（如：加一份米饭）" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="number" step="0.01" value={tempItem.price || ""} onChange={(e) => setTempItem({ ...tempItem, price: Number(e.target.value) })} placeholder="价格" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowTempItem(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">取消</button>
              <button onClick={addTempItem} className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg">添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
