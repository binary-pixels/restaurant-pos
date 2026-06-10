"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  categories: any[];
  onProductClick: (product: any) => void;
};

export function ProductGrid({ categories, onProductClick }: Props) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || "");
  const [search, setSearch] = useState("");

  const currentCategory = categories.find((c: any) => c.id === activeCategory);
  const allProducts = categories.flatMap((c: any) => c.products);

  const products = search
    ? allProducts.filter((p: any) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : currentCategory?.products || [];

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索菜品..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Category Tabs */}
      {!search && (
        <div className="flex gap-0 border-b border-gray-200 overflow-x-auto px-3">
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                activeCategory === cat.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {cat.name} ({cat.products.length})
            </button>
          ))}
        </div>
      )}

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((product: any) => (
            <button
              key={product.id}
              onClick={() => onProductClick(product)}
              className="bg-white border border-gray-200 rounded-xl p-3 text-left hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-gray-400 text-sm">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  product.name.charAt(0)
                )}
              </div>
              <p className="font-medium text-sm text-gray-900 truncate">
                {product.name}
              </p>
              <p className="text-sm font-bold text-blue-600 mt-0.5">
                ¥{product.price.toFixed(2)}
                <span className="text-xs text-gray-400 font-normal">
                  /{product.unit}
                </span>
              </p>
            </button>
          ))}

          {products.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              未找到菜品
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
