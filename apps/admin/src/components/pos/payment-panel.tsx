"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Banknote, Smartphone, CreditCard, Wallet, QrCode, Plus, X, ArrowRight } from "lucide-react";

const METHODS = [
  { id: "CASH", label: "现金", labelEn: "Cash", icon: Banknote, color: "bg-green-500" },
  { id: "WECHAT_QR", label: "微信支付", labelEn: "WeChat", icon: Smartphone, color: "bg-emerald-500" },
  { id: "ALIPAY_QR", label: "支付宝", labelEn: "Alipay", icon: Smartphone, color: "bg-blue-500" },
  { id: "CARD", label: "银行卡", labelEn: "Card", icon: CreditCard, color: "bg-purple-500" },
  { id: "MEMBER_BALANCE", label: "会员余额", labelEn: "Balance", icon: Wallet, color: "bg-amber-500" },
];

type Props = {
  total: number;
  onPay: (method: string, amount: number) => Promise<void>;
  onClose: () => void;
  processing: boolean;
};

export function PaymentPanel({ total, onPay, onClose, processing }: Props) {
  const t = useTranslations("payment");
  const [step, setStep] = useState<"method" | "qr" | "split">("method");
  const [method, setMethod] = useState("CASH");
  const [received, setReceived] = useState("");
  const receiveAmount = parseFloat(received) || 0;
  const change = Math.max(0, receiveAmount - total);

  // Split payment
  const [splits, setSplits] = useState<{ method: string; amount: number }[]>([]);
  const [splitMethod, setSplitMethod] = useState("WECHAT_QR");
  const [splitAmount, setSplitAmount] = useState("");

  const splitsTotal = splits.reduce((s, sp) => s + sp.amount, 0);
  const remaining = Math.max(0, total - splitsTotal);

  function addSplit() {
    const amt = parseFloat(splitAmount);
    if (!amt || amt <= 0 || amt > remaining) return;
    setSplits([...splits, { method: splitMethod, amount: amt }]);
    setSplitAmount("");
  }

  function removeSplit(idx: number) {
    setSplits(splits.filter((_, i) => i !== idx));
  }

  async function handlePay() {
    if (splits.length > 0) {
      // Pay all splits
      for (const sp of splits) await onPay(sp.method, sp.amount);
      if (remaining > 0 && method === "CASH") await onPay(method, remaining);
    } else {
      await onPay(method, method === "CASH" ? receiveAmount : total);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => !processing && onClose()} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md z-10">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t("title")}</h2>
        <p className="text-3xl font-bold text-blue-600 mb-6">¥{total.toFixed(2)}</p>

        {/* Step Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-4">
          {["method", "split"].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s as any)}
              className={cn("flex-1 py-1.5 text-sm rounded-md font-medium", step === s ? "bg-white shadow-sm text-blue-600" : "text-gray-500")}
            >
              {s === "method" ? "单一支付" : "组合支付"}
            </button>
          ))}
        </div>

        {step === "method" && (
          <>
            {/* Payment Methods */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {METHODS.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setMethod(pm.id)}
                  className={cn("py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-2",
                    method === pm.id ? "border-blue-600 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  <pm.icon className="w-4 h-4" /> {pm.label}
                </button>
              ))}
            </div>

            {/* Cash Input */}
            {method === "CASH" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("received")}</label>
                <input type="number" value={received} onChange={(e) => setReceived(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" autoFocus />
                {change > 0 && <p className="mt-2 text-sm text-green-600">{t("change")}: ¥{change.toFixed(2)}</p>}
              </div>
            )}

            {/* QR Code sim for digital payments */}
            {(method === "WECHAT_QR" || method === "ALIPAY_QR") && (
              <div className="mb-6 text-center">
                <div className="w-40 h-40 bg-gray-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">请顾客出示{method === "WECHAT_QR" ? "微信" : "支付宝"}付款码</p>
                <p className="text-xs text-gray-400 mt-1">或扫码枪扫描顾客付款码</p>
              </div>
            )}

            {/* Balance check */}
            {method === "MEMBER_BALANCE" && (
              <div className="mb-6 p-4 bg-amber-50 rounded-xl">
                <p className="text-sm text-amber-700">将扣除会员余额 ¥{total.toFixed(2)}</p>
                <p className="text-xs text-amber-500 mt-1">请确认会员身份后再收款</p>
              </div>
            )}
          </>
        )}

        {/* Split Payment */}
        {step === "split" && (
          <div className="mb-6">
            {splits.map((sp, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b text-sm">
                <span>{METHODS.find((m) => m.id === sp.method)?.label || sp.method}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">¥{sp.amount.toFixed(2)}</span>
                  <button onClick={() => removeSplit(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {splits.length > 0 && (
              <div className="flex justify-between py-2 text-sm font-medium">
                <span>已分账</span><span>¥{splitsTotal.toFixed(2)}</span>
              </div>
            )}
            <div className={cn("flex justify-between py-2 text-sm", remaining > 0 && "text-red-500")}>
              <span>待支付</span><span>¥{remaining.toFixed(2)}</span>
            </div>

            {remaining > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <select value={splitMethod} onChange={(e) => setSplitMethod(e.target.value)} className="flex-1 px-2 py-2 border rounded-lg text-sm">
                  {METHODS.filter((m) => m.id !== "CASH").map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                  <option value="CASH">现金</option>
                </select>
                <input type="number" value={splitAmount} onChange={(e) => setSplitAmount(e.target.value)}
                  placeholder="金额" className="w-24 px-3 py-2 border rounded-lg text-sm" />
                <button onClick={addSplit} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"><Plus className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} disabled={processing} className="flex-1 py-3 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50">取消</button>
          <button onClick={handlePay}
            disabled={processing || (step === "method" && method === "CASH" && receiveAmount < total && splits.length === 0)}
            className="flex-1 py-3 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center gap-2"
          >
            {processing ? t("paying") : <><ArrowRight className="w-4 h-4" /> {step === "split" ? "组合收款" : t("payBtn")}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
