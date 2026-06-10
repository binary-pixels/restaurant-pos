"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus, Minus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateProduct } from "@/actions/product-actions";
import { formatCurrency } from "@pos/shared";

type Product = { id: string; name: string; stock: number; lowStockAt: number; price: number; unit: string; category: { name: string } };

type Props = { products: Product[]; storeId: string };

export function InventoryList({ products, storeId }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [adjusting, setAdjusting] = useState<Record<string, number>>({});

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdjust(id: string, delta: number) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const newStock = Math.max(0, product.stock + delta);
    await updateProduct(id, { stock: newStock });
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索商品..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" /> 库存不足</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500" /> 库存偏低</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" /> 库存正常</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">商品</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">分类</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">当前库存</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">预警线</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">单价</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">快速调整</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((product) => {
              const ratio = product.lowStockAt > 0 ? product.stock / product.lowStockAt : 999;
              const statusColor = product.stock === 0 ? "bg-red-500" : ratio < 1 ? "bg-amber-500" : "bg-green-500";

              return (
                <tr key={product.id} className={cn("hover:bg-gray-50", product.stock === 0 && "bg-red-50")}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", statusColor)} />
                      <span className="font-medium text-gray-900">{product.name}</span>
                      {product.stock <= product.lowStockAt && (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{product.category.name}</td>
                  <td className={cn("py-3 px-4 text-right font-medium", product.stock <= product.lowStockAt && "text-red-600")}>
                    {product.stock} {product.unit}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-500">{product.lowStockAt}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(product.price)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleAdjust(product.id, -1)} className="p-1 hover:bg-gray-100 rounded">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs">{product.stock}</span>
                      <button onClick={() => handleAdjust(product.id, 1)} className="p-1 hover:bg-gray-100 rounded">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
