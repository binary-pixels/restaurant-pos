"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type SpecOption = { id: string; label: string; priceAdj: number };
type Spec = { id: string; name: string; type: string; isRequired: boolean; options: SpecOption[] };

type Props = {
  product: any;
  open: boolean;
  onConfirm: (product: any, selectedOptions: Record<string, string>, totalPrice: number) => void;
  onClose: () => void;
};

export function SpecSelector({ product, open, onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product && product.specs) {
      const init: Record<string, string> = {};
      product.specs.forEach((s: Spec) => {
        if (s.options.length > 0) init[s.id] = s.options[0].id;
      });
      setSelected(init);
    }
  }, [product]);

  if (!open || !product) return null;

  // Calculate total price with spec adjustments
  let totalPrice = product.price;
  Object.entries(selected).forEach(([specId, optId]) => {
    const spec = product.specs.find((s: Spec) => s.id === specId);
    if (spec) {
      const opt = spec.options.find((o: SpecOption) => o.id === optId);
      if (opt) totalPrice += opt.priceAdj;
    }
  });

  function handleConfirm() {
    onConfirm(product, selected, totalPrice);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl p-5 w-full max-w-sm z-10">
        <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
        <p className="text-sm text-gray-500 mb-4">¥{product.price.toFixed(2)}{totalPrice > product.price && <span className="text-blue-600"> → ¥{totalPrice.toFixed(2)}</span>}</p>

        {product.specs.map((spec: Spec) => (
          <div key={spec.id} className="mb-4">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              {spec.name} {spec.isRequired && <span className="text-red-400">*</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {spec.options.map((opt: SpecOption) => (
                <button
                  key={opt.id}
                  onClick={() => setSelected({ ...selected, [spec.id]: opt.id })}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg border transition-colors",
                    selected[spec.id] === opt.id
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {opt.label}
                  {opt.priceAdj > 0 && <span className="text-blue-500 ml-0.5">+¥{opt.priceAdj}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2 text-sm border rounded-lg hover:bg-gray-50">取消</button>
          <button onClick={handleConfirm} className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            加入购物车 · ¥{totalPrice.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
